import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Stack, Container, CircularProgress, Box, Button } from "@mui/material";
import { TelephonyConnection } from "voice-javascript-common";

import api from "../../../utils/axiosInstance";
import useAppStore from "../../../store/useAppStore";

import DialingCards from "./components/DialingCards";
import SingleCallCampaignPanel from "./components/SingleCallCampaign";
import { useCampaign } from "./useCampaign";
import { useSocketReady } from "./useSocketReady";
import { CallSession, Contact } from "../../../types/contact";
import {
  coerceRouteStatePhoneToString,
  getContactPhoneDisplayString,
  type DialCallPayload,
  type PhoneSlot,
} from "../../../utils/getContactPrimaryPhone";
import { CallResult } from "../../../types/call-results";
import ContinueDialog from "./components/ContinueDIalog";
import {
  getDialingSessionsWithStatuses,
  getSingleDialingSessionWithStatus,
} from "../../../utils/getDialingSessionsWithStatuses";
import { useRingingTone } from "./useRingingTone";
import { useAuth } from "../../../contexts/AuthContext";
import { useSnackbar } from "../../../hooks/useSnackbar";
import MinimalCallPanel from "./components/MinimalCallPanel";
import { CallBar } from "./components/molecules/CallBar";
import { campaignV2 } from "./components/campaignV2Tokens";

interface LocationState {
  contacts: any[];
  mode: TelephonyConnection;
  contactId: string;
  /** Dial string or structured contact phone object from navigation */
  phone?: string | unknown;
  defaultDisposition: string;
  autoStart: boolean;
  /** When set (e.g. from Lists), redirect to /lists after all step contacts are finished */
  listId?: string;
}

/** Read `contactId` from the hash only (direct load: `/#/path?contactId=`). */
function getContactIdFromHashOnly(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const raw = window.location.hash.replace(/^#/, "");
  const q = raw.indexOf("?");
  if (q >= 0) {
    const v = new URLSearchParams(raw.slice(q)).get("contactId")?.trim();
    if (v) return v;
  }
  const m = window.location.hash.match(/[?&]contactId=([^&]+)/);
  if (m?.[1]) {
    try {
      return decodeURIComponent(m[1]).trim();
    } catch {
      return m[1].trim();
    }
  }
  return undefined;
}

/** `contactId` from RR `location.search`, or before `#`, or inside the hash (HashRouter). */
function getCampaignContactIdFromLocation(location: { search: string }): string | undefined {
  const fromRouter = new URLSearchParams(location.search).get("contactId");
  if (fromRouter) return fromRouter.trim();

  if (typeof window === "undefined") return undefined;

  const beforeHash = new URLSearchParams(window.location.search).get("contactId");
  if (beforeHash) return beforeHash.trim();

  return getContactIdFromHashOnly();
}

function getCampaignSearchString(location: { search: string }): string {
  if (location.search) return location.search;
  if (typeof window === "undefined") return "";
  const raw = window.location.hash.replace(/^#/, "");
  const q = raw.indexOf("?");
  return q >= 0 ? raw.slice(q) : "";
}

function getContactRecordId(c: CallSession | Contact | null | undefined): string {
  if (!c || typeof c !== "object") return "";
  const o = c as Record<string, unknown>;
  const raw = o.id ?? o._id;
  return raw != null ? String(raw) : "";
}

function normalizeContactPayload(data: unknown): CallSession {
  const o = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  const id = o.id ?? o._id;
  return { ...o, id: id != null ? String(id) : undefined } as CallSession;
}

const Campaign = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    contacts,
    mode,
    contactId,
    phone,
    defaultDisposition,
    autoStart,
    listId,
  } = (location.state || {}) as LocationState;

  /** Parsed once on mount so direct opens like `/#/campaign?contactId=…` work before RR syncs search. */
  const [bootContactIdFromHash] = useState(getContactIdFromHashOnly);

  const contactIdFromUrl =
    searchParams.get("contactId")?.trim() ||
    getCampaignContactIdFromLocation(location) ||
    bootContactIdFromHash;

  const effectiveContactId = contactId || contactIdFromUrl;
  const oneOffPhoneString = useMemo(
    () => coerceRouteStatePhoneToString(phone),
    [phone]
  );
  const { phoneState, authLoading, isAuthenticated } = useAuth();
  const { socket, volumeHandler, hangUpHandler } = phoneState;
  const { enqueue } = useSnackbar();

  const { user, settings, setSettings } = useAppStore((state) => state);

  // Load settings (dispositions) when not yet in store - required for ContinueDialog
  useEffect(() => {
    if (!user) return;
    if (settings) return;
    api
      .get("/settings")
      .then(({ data }) => setSettings(data))
      .catch((err) => console.error("[Campaign] Failed to load settings:", err));
  }, [user, settings, setSettings]);

  // Use `isAuthenticated`, not store `user`: after refresh, Zustand `user` can lag one tick behind
  // session/cookies while `isAuthenticated` is already true — avoiding bogus redirects / blocked fetches.
  const shouldRedirect = !authLoading && !isAuthenticated;

  useEffect(() => {
    if (shouldRedirect) {
      navigate("/dashboard", { replace: true, state: { from: location } });
    }
  }, [shouldRedirect, navigate, location]);

  const { ready: isSocketReady, reason: socketReason } = useSocketReady(
    socket,
    user?.id
  );

  const callResults: CallResult[] =
    (settings?.["Phone Settings"]?.callResults as CallResult[]) ?? [];

  const [manualSession, setManualSession] = useState<CallSession | null>(null);
  const [contactDetailsLoading, setContactDetailsLoading] = useState(false);
  const loadedContactIdKey = getContactRecordId(manualSession);
  const [callStarted, setCallStarted] = useState(false);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const [error, setError] = useState<string | null>(null);
  const [isStartingNextCall, setIsStartingNextCall] = useState(false);
  const hasAutoStartedRef = useRef(false);
  const preDialAudioRef = useRef<HTMLAudioElement | null>(null);
  const hasSeenCallActivityRef = useRef(false);

  const setCampaignContactIdInUrl = useCallback(
    (id: string) => {
      const base = getCampaignSearchString(location);
      const next = new URLSearchParams(
        base.startsWith("?") ? base.slice(1) : base
      );
      next.set("contactId", id);
      navigate(
        {
          pathname: location.pathname,
          search: `?${next.toString()}`,
          hash: location.hash,
        },
        { replace: true, state: location.state }
      );
    },
    [location.hash, location.pathname, location.search, location.state, navigate]
  );

  const contactLoadGenRef = useRef(0);
  // Load contact when `contactId` is in state or URL (including full page refresh / F5).
  // Depends on `contactIdFromUrl` from render so `useSearchParams` + hash fallbacks stay in sync with the effect.
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    const id = (contactId || contactIdFromUrl || "").trim();
    if (!id) return;
    if (contacts && contacts.length > 0) return;
    if (loadedContactIdKey === id) return;

    const gen = ++contactLoadGenRef.current;
    setContactDetailsLoading(true);
    api
      .get(`/contacts/${id}`)
      .then((res) => {
        if (gen !== contactLoadGenRef.current) return;
        setManualSession(normalizeContactPayload(res.data));
      })
      .catch((err) => {
        console.error("[Campaign] Failed to load contact:", err);
        enqueue("Could not load contact details.", { variant: "error" });
      })
      .finally(() => {
        if (gen === contactLoadGenRef.current) {
          setContactDetailsLoading(false);
        }
      });
  }, [
    authLoading,
    isAuthenticated,
    contactId,
    contactIdFromUrl,
    contacts,
    loadedContactIdKey,
  ]);

  useEffect(() => {
    if (!contactId || (contacts && contacts.length > 0)) return;
    const current = getCampaignContactIdFromLocation(location);
    if (current === contactId) return;
    const base = getCampaignSearchString(location);
    const next = new URLSearchParams(
      base.startsWith("?") ? base.slice(1) : base
    );
    next.set("contactId", contactId);
    navigate(
      {
        pathname: location.pathname,
        search: `?${next.toString()}`,
        hash: location.hash,
      },
      { replace: true, state: location.state }
    );
  }, [
    contactId,
    contacts,
    location.hash,
    location.pathname,
    location.search,
    location.state,
    navigate,
  ]);

  // State management for the dialog box
  const [contactNotes, setContactNotes] = useState<Record<string, string>>({});
  const [selectedResults, setSelectedResults] = useState<
    Record<string, string>
  >({});
  const [activityTimelineRefreshKey, setActivityTimelineRefreshKey] =
    useState(0);

  // Private hook state variables
  const {
    currentIndex,
    isCampaignRunning,
    isCampaignFinished,
    showContinueDialog,
    ringingSessions,
    answeredSession,
    pendingResultContacts,
    currentBatch,
    currentBatchRef,
    lastAnsweredId,
    setCurrentBatch,
    setIsCampaignRunning,
    setIsCampaignFinished,
    setCurrentIndex,
    setPendingResultContacts,
    setShowContinueDialog,
    setStatus,
    setRingingSessions,
    handleHangUp,
    handleHangUpNotKnown,
    handleNumpadClick,
  } = useCampaign({
    userId: user?.id ?? "",
    socket,
    enabled: isSocketReady,
    callEventHandlers: {
      volumeHandler,
      hangUpHandler,
    },
  });

  useRingingTone({ ringingSessions, answeredSession });

  // Call timer for CallBar (active state)
  useEffect(() => {
    if (callStarted) {
      setCallStartTime(new Date());
    }
  }, [callStarted]);

  useEffect(() => {
    let int: NodeJS.Timeout;
    if (answeredSession && callStartTime) {
      int = setInterval(() => {
        const diff = Math.floor((Date.now() - callStartTime.getTime()) / 1000);
        const mm = String(Math.floor(diff / 60)).padStart(2, "0");
        const ss = String(diff % 60).padStart(2, "0");
        setElapsedTime(`${mm}:${ss}`);
      }, 1000);
    } else {
      setElapsedTime("00:00");
    }
    return () => clearInterval(int!);
  }, [callStartTime, answeredSession]);

  useEffect(() => {
    if (answeredSession) {
      setCallStartTime((prev) => prev || new Date());
    }
  }, [answeredSession]);

  // MODE DETECTION - Determine if this is one-off call vs batch/power dialer
  // One-off: phone present, no manualSession, no contacts array, no mode
  // Batch: contacts array present OR isCampaignRunning with mode
  const isOneOff = useMemo(() => {
    return !!(phone && !manualSession && !contacts && !mode);
  }, [phone, manualSession, contacts, mode]);

  const isBatchDial = useMemo(() => {
    return !!(contacts || (isCampaignRunning && mode));
  }, [contacts, isCampaignRunning, mode]);

  // STABLE DIALER STATE MACHINE - Only moves forward, prevents flicker
  // This centralizes UI interpretation and ensures UI never reacts directly to raw event timing
  const dialerState = useMemo(() => {
    // Priority order (highest to lowest) - ensures only ONE state is active
    if (isStartingNextCall && isBatchDial) {
      return "TRANSITIONING" as const;
    }
    if (answeredSession) {
      return "IN_CALL" as const;
    }
    if (callStarted || ringingSessions.length > 0) {
      return "DIALING" as const;
    }
    return "IDLE" as const;
  }, [isStartingNextCall, isBatchDial, answeredSession, callStarted, ringingSessions.length]);


  // Reset "seen activity" only when a NEW call starts (transition false→true)
  const prevCallStartedRef = useRef(false);
  useEffect(() => {
    if (callStarted && !prevCallStartedRef.current) {
      hasSeenCallActivityRef.current = false;
    }
    prevCallStartedRef.current = callStarted;
  }, [callStarted]);

  // Track when we've seen call activity (ringing or answered) - prevents premature cleanup
  useEffect(() => {
    if (ringingSessions.length > 0 || answeredSession !== null) {
      hasSeenCallActivityRef.current = true;
    }
  }, [ringingSessions.length, answeredSession]);

  // Guaranteed cleanup: reset callStarted when call ends (remote hangup, terminal status, etc.)
  // FIX: Only cleanup AFTER we've seen call activity - prevents resetting during initial dialing
  // delay before "ringing" arrives (which hides CallBar for single calls)
  useEffect(() => {
    // Skip cleanup for one-off calls - they never populate ringingSessions
    if (isOneOff) {
      return;
    }

    // Only reset when we've seen activity and it's now cleared (call truly ended)
    // Without hasSeenCallActivityRef, we'd reset during the delay before "ringing" arrives
    if (
      callStarted &&
      answeredSession === null &&
      ringingSessions.length === 0 &&
      hasSeenCallActivityRef.current
    ) {
      setCallStarted(false);
      hasSeenCallActivityRef.current = false;
    }
  }, [callStarted, answeredSession, ringingSessions, isOneOff]);

  // Clear isStartingNextCall when call actually starts or on error
  useEffect(() => {
    if (callStarted) {
      setIsStartingNextCall(false);
    }
  }, [callStarted]);

  useEffect(() => {
    if (error) {
      setIsStartingNextCall(false);
    }
  }, [error]);

  // List / step campaign: return to lists when every contact in the loaded slice has been processed
  useEffect(() => {
    if (shouldRedirect) return;
    if (!listId || !contacts?.length) return;
    if (!isCampaignFinished) return;
    if (currentIndex < contacts.length) return;
    navigate("/lists", { replace: true });
  }, [
    shouldRedirect,
    listId,
    contacts,
    isCampaignFinished,
    currentIndex,
    navigate,
  ]);

  const guardNoSocket = () => {
    if (!isSocketReady) {
      enqueue(
        `Real-time connection not ready${
          socketReason ? `: ${socketReason}` : ""
        }`,
        { variant: "warning" }
      );
      return true;
    }
    return false;
  };

  const resolvedMode = mode ?? TelephonyConnection.SOFT_CALL;
  const callsPerBatch = {
    [TelephonyConnection.SOFT_CALL]: 1,
    [TelephonyConnection.PARALLEL_CALL]: 2,
    [TelephonyConnection.ADVANCED_PARALLEL_CALL]: 4,
  }[resolvedMode];

  const singleSession = getSingleDialingSessionWithStatus(currentBatch);

  // When "Save and stop" is clicked, keep the current contact in view
  const sessionToShow = useMemo(() => {
    if (currentBatch.length === 0) return null;
    if (isCampaignFinished) {
      if (lastAnsweredId) {
        const answered = currentBatch.find((c) => c.id === lastAnsweredId);
        if (answered) return { ...answered, status: "Active" };
      }
      return getSingleDialingSessionWithStatus(currentBatch);
    }
    return isCampaignRunning ? singleSession : null;
  }, [isCampaignFinished, isCampaignRunning, currentBatch, lastAnsweredId, singleSession]);

  // Persistent CallBar: always visible, compute display and actions from context
  const callBarMode = dialerState === "IDLE" ? "idle" : "active";

  const callBarDisplayLabel = useMemo(() => {
    if (phone != null && phone !== "" && !manualSession) {
      return oneOffPhoneString || "No number";
    }
    const primaryFor = (c: Contact) =>
      getContactPhoneDisplayString(c) || "no number";
    if (manualSession)
      return `${manualSession.first_name || ""} ${manualSession.last_name || ""} – ${primaryFor(manualSession)}`.trim();
    if (sessionToShow)
      return `${sessionToShow.first_name || ""} ${sessionToShow.last_name || ""} – ${primaryFor(sessionToShow)}`.trim();
    if (singleSession)
      return `${singleSession.first_name || ""} ${singleSession.last_name || ""} – ${primaryFor(singleSession)}`.trim();
    if (currentBatch.length > 0) {
      const c = currentBatch[0];
      return `${c.first_name || ""} ${c.last_name || ""} – ${primaryFor(c)}`.trim();
    }
    if (contacts && contacts.length > 0) {
      const name = `${contacts[0].first_name || ""} ${contacts[0].last_name || ""}`.trim();
      return name ? `Campaign – ${name} (${contacts.length})` : `Campaign (${contacts.length} contacts)`;
    }
    return "No active call";
  }, [
    phone,
    manualSession,
    oneOffPhoneString,
    sessionToShow,
    singleSession,
    currentBatch,
    contacts,
  ]);

  const makeCallNotKnown = async (phone: string) => {
    if (!phone?.trim()) return;
    if (guardNoSocket()) return;
    try {
      await api.post("/campaign/call-notknown", {
        phone,
      });
      // Only set callStarted after backend confirms call creation
      setCallStarted(true);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to start call. Please try again.";
      enqueue(errorMessage, { variant: "error" });
      setError(errorMessage);
      // Do NOT set callStarted on error - UI stays in idle state
    }
  };

  /** `override` is set when the user picks a specific slot from the dial menu. */
  const makeCallBatch = async (override?: { number: string; slot: PhoneSlot }) => {
    if (guardNoSocket()) return;
    let slice: Contact[];
    if (contacts) {
      slice = contacts.slice(currentIndex, currentIndex + callsPerBatch);
      if (slice.length === 0) {
        setIsCampaignFinished(true);
        setRingingSessions([]);
        setIsCampaignRunning(false);
        return;
      }
    } else if (effectiveContactId) {
      slice = [manualSession as Contact];
    } else {
      enqueue("Some error happened. Please try again!", { variant: "error" });
      return;
    }

    try {
      const { data } = await api.post("/contacts/batch", {
        ids: slice.map((contact) => contact.id),
      });
      let batchContacts = data as Contact[];

      if (
        override?.slot &&
        override.number?.trim() &&
        batchContacts.length === 1
      ) {
        const c = batchContacts[0];
        const trimmed = override.number.trim();
        // Keep full structured `phone` from batch for CallBar dropdown; Twilio uses `dialToNumber` first.
        batchContacts = [
          {
            ...c,
            dialToNumber: trimmed,
          } as unknown as Contact,
        ];
      }

      const activeCalls = await api.post("/campaign/call-campaign", {
        contacts: batchContacts,
      });

      // play pre-dial sound (stopped when dialer state becomes DIALING)
      // const audio = new Audio(`${import.meta.env.BASE_URL}pre-dial.wav`);
      // preDialAudioRef.current = audio;
      // audio.play().catch(() => {
      //   // Autoplay may be blocked; pre-dial is best-effort
      // });

      // Only set callStarted after backend confirms call creation
      setCallStarted(true);

      const extendedBatchContactsWithSid = batchContacts.map(
        (batchContact: Contact) => {
          const call = activeCalls.data.find((activeCall: any) => {
            const primary = getContactPhoneDisplayString(batchContact);
            return primary === activeCall.phoneNumber;
          });

          return { ...batchContact, callSid: call.callSid };
        }
      );

      setCurrentBatch(extendedBatchContactsWithSid as CallSession[]);
      currentBatchRef.current = extendedBatchContactsWithSid as CallSession[];
      setStatus(`Calling ${batchContacts.length} contact(s)...`);
      setCurrentIndex((prev) => prev + callsPerBatch);

      const urlContactId = batchContacts[0]?.id;
      if (urlContactId) {
        setCampaignContactIdInUrl(urlContactId);
      }
    } catch (error: any) {
      if (preDialAudioRef.current) {
        preDialAudioRef.current.pause();
        preDialAudioRef.current.currentTime = 0;
        preDialAudioRef.current = null;
      }
      const msg = error.response.data.errors[0].message;
      setError(typeof msg === "string" ? msg : error.message);
      setIsStartingNextCall(false);
      // Do NOT set callStarted on error - UI stays in idle state
    }
  };

  const handleStartCampaign = () => {
    setIsCampaignRunning(true);
    setIsCampaignFinished(false);
    setCurrentIndex(0);
    makeCallBatch();
  };

  // Auto-start dialing when autoStart is true (wait for settings so dispositions are ready when call ends)
  useEffect(() => {
    if (!autoStart || !isSocketReady || !settings || hasAutoStartedRef.current) return;
    if (guardNoSocket()) return;

    if ((manualSession || (contacts && contacts.length > 0)) && !isCampaignRunning) {
      hasAutoStartedRef.current = true;
      // start campaign for a single call
      handleStartCampaign();
    
      return;
    }
  }, [autoStart, isSocketReady, settings, phone, manualSession, contacts, callResults, isCampaignRunning]);

  const callBarOnStartCall = useMemo(() => {
    if (dialerState !== "IDLE") return undefined;
    if (phone != null && phone !== "" && !manualSession) {
      return (payload: DialCallPayload) => {
        const n = payload?.number?.trim() || oneOffPhoneString;
        if (!n) return;
        void makeCallNotKnown(n);
      };
    }
    if (manualSession) {
      return (payload: DialCallPayload) => {
        if (!payload?.number?.trim()) return;
        setIsCampaignRunning(true);
        setIsCampaignFinished(false);
        setCurrentIndex(0);
        if (payload.slot) {
          void makeCallBatch({
            number: payload.number.trim(),
            slot: payload.slot,
          });
        } else {
          void makeCallBatch();
        }
      };
    }
    if (contacts && !isCampaignRunning) {
      return (payload: DialCallPayload) => {
        if (!payload?.number?.trim()) return;
        setIsCampaignRunning(true);
        setIsCampaignFinished(false);
        setCurrentIndex(0);
        if (payload.slot) {
          void makeCallBatch({
            number: payload.number.trim(),
            slot: payload.slot,
          });
        } else {
          void makeCallBatch();
        }
      };
    }
    return undefined;
  }, [
    dialerState,
    phone,
    manualSession,
    contacts,
    isCampaignRunning,
    oneOffPhoneString,
  ]);

  const handleContinue = () => {
    setShowContinueDialog(false);
    // Only set transition state for batch dialer, not one-off calls
    if (isBatchDial) {
      setIsStartingNextCall(true);
    }
    makeCallBatch();
  };

  const handleStopCampaign = () => {
    setIsCampaignRunning(false);
    setShowContinueDialog(false);
    setIsCampaignFinished(true);
    setStatus("Campaign manually stopped!");
    api.post("/campaign/stop-campaign");
  };

  const handleDialogClose = () => {
    setShowContinueDialog(false);
    makeCallBatch();
  };

  const handleResult = async (contact: Contact, result: string) => {
    await api.patch(`/contacts/${contact.id}`, {
      result,
      notes: contactNotes[contact.id] || "",
      timestamp: Date.now(),
      callSid: contact.callSid || null,
      dialedNumber: getContactPhoneDisplayString(contact),
    });
    const visibleId = manualSession?.id ?? sessionToShow?.id;
    if (visibleId && contact.id === visibleId) {
      setActivityTimelineRefreshKey((k) => k + 1);
    }
  };

  const maybeProceedWithNextBatch = () => {
    if (!isCampaignRunning) return;
    if (contacts && contacts.length > 0) {
      handleContinue();
      return;
    }
    if (!manualSession) {
      handleContinue();
    }
  };

  const hangUpNotKnown = () => {
    api.post("/campaign/stop-campaign");
    handleHangUpNotKnown();
    setCallStarted(false);
  };

  const hangUp = () => {
    api.post("/campaign/stop-campaign");
    handleHangUp();
    setCallStarted(false);
  };

  const callBarOnEndCall = phone && !manualSession ? hangUpNotKnown : hangUp;

  const hasEmbeddedCampaignPanel =
    !!manualSession ||
    (!!sessionToShow && resolvedMode === TelephonyConnection.SOFT_CALL);

  const showCallBar = !!(
    effectiveContactId ||
    phone ||
    isCampaignRunning ||
    sessionToShow
  );

  const headerBelowBatch =
    !contactId && !phone ? (
      <Stack direction="row" spacing={1.5} flexWrap="wrap" justifyContent="flex-start">
        <Button
          variant="contained"
          onClick={handleStartCampaign}
          disabled={!isSocketReady || isCampaignRunning}
          sx={{
            px: 3,
            textTransform: "none",
            fontWeight: 700,
            color: "#fff",
            backgroundColor: campaignV2.accent,
            boxShadow: campaignV2.ctaShadow,
            "&:hover": {
              background: campaignV2.accentDark,
              color: "#fff",
            },
            "&.Mui-disabled": {
              color: "rgba(255, 255, 255, 0.65)",
            },
          }}
        >
          Start campaign
        </Button>
        <Button
          variant="outlined"
          onClick={handleStopCampaign}
          disabled={!isCampaignRunning}
          sx={{
            px: 3,
            textTransform: "none",
            fontWeight: 700,
            borderColor: campaignV2.accent,
            color: campaignV2.accent,
            "&:hover": {
              borderColor: campaignV2.accentDark,
              bgcolor: campaignV2.subtleFill,
            },
          }}
        >
          Stop campaign
        </Button>
      </Stack>
    ) : null;

  const campaignAlerts =
    !isSocketReady || error ? (
      <Stack spacing={1.5} sx={{ width: "100%" }}>
        {!isSocketReady && (
          <Alert severity="warning">
            Reconnecting to real-time service… You can’t start a campaign until
            it’s ready.
          </Alert>
        )}
        {error && <Alert severity="error">{error}</Alert>}
      </Stack>
    ) : null;

  const callBarQueueNeighbors = useMemo(() => {
    if (!contacts?.length) {
      return { queuePreviousLabel: null as string | null, queueNextLabel: null as string | null };
    }

    const queueName = (c: { first_name?: string; last_name?: string }) =>
      `${c.first_name || ""} ${c.last_name || ""}`.trim() || "Contact";

    let refIndex = -1;
    if (sessionToShow?.id) {
      refIndex = contacts.findIndex((c: CallSession) => String(c.id) === String(sessionToShow.id));
    }
    if (refIndex < 0 && currentBatch.length > 0) {
      const indices = currentBatch
        .map((b) =>
          contacts.findIndex((c: CallSession) => String(c.id) === String(b.id)),
        )
        .filter((i) => i >= 0);
      if (indices.length) refIndex = Math.min(...indices);
    }
    if (refIndex < 0) {
      return { queuePreviousLabel: null, queueNextLabel: null };
    }

    return {
      queuePreviousLabel: refIndex > 0 ? queueName(contacts[refIndex - 1]) : null,
      queueNextLabel:
        refIndex < contacts.length - 1 ? queueName(contacts[refIndex + 1]) : null,
    };
  }, [contacts, sessionToShow, currentBatch]);

  const callBarProps = {
    mode: callBarMode,
    displayLabel: callBarDisplayLabel,
    session: (sessionToShow || singleSession || manualSession) as Contact | undefined,
    phone: oneOffPhoneString || undefined,
    onStartCall: callBarOnStartCall,
    onEndCall: callBarOnEndCall,
    callStartTime: callBarMode === "active" ? callStartTime : null,
    elapsedTime,
    hasAnsweredSession: !!answeredSession,
    handleNumpadClick,
    isStartCallDisabled: !isSocketReady,
    queuePreviousLabel: callBarQueueNeighbors.queuePreviousLabel,
    queueNextLabel: callBarQueueNeighbors.queueNextLabel,
  } as const;

  // TO DO -- in the campaign mode answeredSession is passed to two props
  // fix that redundancy in the whole component

  return (
    <Container
      maxWidth={false}
      sx={{ py: 3, bgcolor: campaignV2.pageBg, minHeight: "100%" }}
    >
      {contactDetailsLoading &&
        (contactId || contactIdFromUrl) &&
        !manualSession &&
        !(contacts && contacts.length > 0) && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            py={6}
            width="100%"
          >
            <CircularProgress />
          </Box>
        )}
      {!hasEmbeddedCampaignPanel && showCallBar && (
        <CallBar embedded={false} {...callBarProps} />
      )}
      <Stack spacing={3}>
        {!hasEmbeddedCampaignPanel && !contactId && !phone && headerBelowBatch}
        {!hasEmbeddedCampaignPanel && campaignAlerts}

        {phone != null && phone !== "" && !manualSession && (
          <MinimalCallPanel phone={oneOffPhoneString} />
        )}

        {manualSession && (
          <SingleCallCampaignPanel
            session={manualSession}
            answeredSession={answeredSession as Contact}
            headerRight={showCallBar ? <CallBar embedded {...callBarProps} /> : null}
            headerBelowCallBar={headerBelowBatch ?? undefined}
            headerAlerts={
              hasEmbeddedCampaignPanel && campaignAlerts ? campaignAlerts : undefined
            }
            timelineRefreshKey={activityTimelineRefreshKey}
            onStartCall={(payload) => {
              if (!payload?.number?.trim()) return;
              setIsCampaignRunning(true);
              setIsCampaignFinished(false);
              setCurrentIndex(0);
              if (payload.slot) {
                void makeCallBatch({
                  number: payload.number.trim(),
                  slot: payload.slot,
                });
              } else {
                void makeCallBatch();
              }
            }}
            onEndCall={hangUp}
            onAccountUpdated={async () => {
              const res = await api.get(`/contacts/${manualSession.id}`);
              setManualSession(res.data);
            }}
            onListMembershipChanged={async () => {
              const res = await api.get(`/contacts/${manualSession.id}`);
              setManualSession(res.data);
            }}
            manual={true}
            phone={oneOffPhoneString || undefined}
            callStarted={callStarted}
            isStartCallDisabled={!isSocketReady}
            handleNumpadClick={handleNumpadClick}
          />
        )}

        {!phone && !manualSession && (
          <>
            {/* STABLE DIALER CONTAINER - Always mounted to prevent layout jumps */}
            {/* Show contact panel when running OR when stopped (keep current contact in view) */}
            {sessionToShow && resolvedMode === TelephonyConnection.SOFT_CALL && (
              <SingleCallCampaignPanel
                session={sessionToShow}
                answeredSession={dialerState === "IN_CALL" ? (answeredSession as Contact) : null}
                headerRight={showCallBar ? <CallBar embedded {...callBarProps} /> : null}
                headerBelowCallBar={headerBelowBatch ?? undefined}
                headerAlerts={
              hasEmbeddedCampaignPanel && campaignAlerts ? campaignAlerts : undefined
            }
                timelineRefreshKey={activityTimelineRefreshKey}
                onEndCall={hangUp}
                onAccountUpdated={async () => {
                  const res = await api.get(`/contacts/${sessionToShow.id}`);
                  setCurrentBatch((prev) =>
                    prev.map((c) => (c.id === res.data.id ? res.data : c))
                  );
                }}
                onListMembershipChanged={async () => {
                  const res = await api.get(`/contacts/${sessionToShow.id}`);
                  setCurrentBatch((prev) =>
                    prev.map((c) => (c.id === res.data.id ? res.data : c))
                  );
                }}
                manual={false}
                callStarted={!isCampaignFinished && (dialerState === "DIALING" || dialerState === "IN_CALL")}
                handleNumpadClick={handleNumpadClick}
              />
            )}
            {/* Fallback: Show DialingCards only when truly idle (not transitioning) */}
            {!isCampaignFinished && 
             isCampaignRunning && 
             mode === TelephonyConnection.SOFT_CALL && 
             !singleSession && 
             dialerState === "IDLE" && 
             currentBatch.length > 0 && (
              <DialingCards
                sessions={getDialingSessionsWithStatuses(
                  currentBatch,
                  ringingSessions,
                  pendingResultContacts
                )}
              />
            )}
          </>
        )}

        {/* <AudioDevicesList devices={devices} /> */}
      </Stack>
      <ContinueDialog
        callResults={callResults}
        contactNotes={contactNotes}
        currentBatch={currentBatch}
        pendingResultContacts={pendingResultContacts}
        selectedResults={selectedResults}
        showContinueDialog={showContinueDialog}
        handleDialogClose={handleDialogClose}
        setSelectedResults={setSelectedResults}
        setPendingResultContacts={setPendingResultContacts}
        setShowContinueDialog={setShowContinueDialog}
        setIsCampaignFinished={setIsCampaignFinished}
        setIsCampaignRunning={setIsCampaignRunning}
        setContactNotes={setContactNotes}
        maybeProceedWithNextBatch={maybeProceedWithNextBatch}
        handleStopAndSkip={handleStopCampaign}
        handleResult={handleResult}
        isCampaign={!manualSession}
        answeredSessionId={lastAnsweredId}
        mode={mode}
        defaultDisposition={defaultDisposition}
        setIsStartingNextCall={setIsStartingNextCall}
      />
      
    </Container>
  );
};

export default Campaign;
