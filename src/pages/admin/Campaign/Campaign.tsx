import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Stack, Container } from "@mui/material";
import { TelephonyConnection } from "voice-javascript-common";

import api from "../../../utils/axiosInstance";
import useAppStore from "../../../store/useAppStore";

import DialingCards from "./components/DialingCards";
import SingleCallCampaignPanel from "./components/SingleCallCampaign";
import { useCampaign } from "./useCampaign";
import { useSocketReady } from "./useSocketReady";
import { SimpleButton } from "../../../components/UI";
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

const Campaign = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    contacts,
    mode,
    contactId,
    phone,
    defaultDisposition,
    autoStart,
    listId,
  } = (location.state || {}) as LocationState;
  const oneOffPhoneString = useMemo(
    () => coerceRouteStatePhoneToString(phone),
    [phone]
  );
  const { phoneState } = useAuth();
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

  const shouldRedirect = !socket || !user;

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
  const [callStarted, setCallStarted] = useState(false);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const [error, setError] = useState<string | null>(null);
  const [isStartingNextCall, setIsStartingNextCall] = useState(false);
  const hasAutoStartedRef = useRef(false);
  const preDialAudioRef = useRef<HTMLAudioElement | null>(null);
  const hasSeenCallActivityRef = useRef(false);

  useEffect(() => {
    if (contactId && !contacts && !mode) {
      api.get(`/contacts/${contactId}`).then((res) => {
        setManualSession(res.data);
      });
    }
  }, [contactId]);


  // State management for the dialog box
  const [contactNotes, setContactNotes] = useState<Record<string, string>>({});
  const [selectedResults, setSelectedResults] = useState<
    Record<string, string>
  >({});

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
    userId: user!.id ?? "",
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

  useEffect(() => {
    if (shouldRedirect)
      navigate("/dashboard", { replace: true, state: { from: location } });
  }, [shouldRedirect, navigate, location]);

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
    } else if (contactId) {
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
  };

  const maybeProceedWithNextBatch = () => {
    if (!manualSession && isCampaignRunning) {
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

  // TO DO -- in the campaign mode answeredSession is passed to two props
  // fix that redundancy in the whole component

  return (
    <Container sx={{ py: 4 }}>
      {!isSocketReady && (
        <Alert severity="warning">
          Reconnecting to real-time service… You can’t start a campaign until
          it’s ready.
        </Alert>
      )}
      {/* CallBar: hidden only when Start campaign is the active state (batch mode, campaign not started) */}
      {(contactId || phone || isCampaignRunning || sessionToShow) && (
        <CallBar
          mode={callBarMode}
          displayLabel={callBarDisplayLabel}
          session={(sessionToShow || singleSession || manualSession) as Contact | undefined}
          phone={oneOffPhoneString || undefined}
          onStartCall={callBarOnStartCall}
          onEndCall={callBarOnEndCall}
          callStartTime={callBarMode === "active" ? callStartTime : null}
          elapsedTime={elapsedTime}
          hasAnsweredSession={!!answeredSession}
          handleNumpadClick={handleNumpadClick}
          isStartCallDisabled={!isSocketReady}
        />
      )}
      <Stack spacing={3}>
      {!contactId && !phone && (
          <Stack direction="row" spacing={1} justifyContent="center">
            <SimpleButton
              label="Start campaign"
              onClick={handleStartCampaign}
              disabled={!isSocketReady || isCampaignRunning}
            />
            <SimpleButton
              label="Stop campaign"
              onClick={handleStopCampaign}
              disabled={!isCampaignRunning}
            />
          </Stack>
        )}
        {/* "Starting next call..." only for batch/power dialer, not one-off calls */}
        {/* {isStartingNextCall && isBatchDial && (
          <Alert severity="info" sx={{ mt: 3 }}>
            Starting next call...
          </Alert>
        )} */}
        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {phone != null && phone !== "" && !manualSession && (
          <MinimalCallPanel phone={oneOffPhoneString} />
        )}

        {manualSession && (
          <SingleCallCampaignPanel
            session={manualSession}
            answeredSession={answeredSession as Contact}
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
            {sessionToShow && mode === TelephonyConnection.SOFT_CALL && (
              <SingleCallCampaignPanel
                session={sessionToShow}
                answeredSession={dialerState === "IN_CALL" ? (answeredSession as Contact) : null}
                onEndCall={hangUp}
                onAccountUpdated={async () => {
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
