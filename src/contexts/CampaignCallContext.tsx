import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { TelephonyConnection } from "voice-javascript-common";

import api from "../utils/axiosInstance";
import useAppStore from "../store/useAppStore";
import { useCampaign } from "../pages/admin/Campaign/useCampaign";
import { useSocketReady } from "../pages/admin/Campaign/useSocketReady";
import { useRingingTone } from "../pages/admin/Campaign/useRingingTone";
import { CallSession, Contact } from "../types/contact";
import {
  coerceRouteStatePhoneToString,
  getContactPhoneDisplayString,
  type DialCallPayload,
  type PhoneSlot,
} from "../utils/getContactPrimaryPhone";
import { CallResult } from "../types/call-results";
import ContinueDialog from "../pages/admin/Campaign/components/ContinueDIalog";
import {
  getSingleDialingSessionWithStatus,
} from "../utils/getDialingSessionsWithStatuses";
import { useAuth } from "./AuthContext";
import { useSnackbar } from "../hooks/useSnackbar";
import type { CallBarMode } from "../pages/admin/Campaign/components/molecules/CallBar";
import GlobalCampaignPreviewDrawer from "../components/GlobalCampaignPreviewDrawer";
import {
  type CampaignLocationState,
  getCampaignContactIdFromLocation,
  getCampaignSearchString,
  getContactIdFromHashOnly,
  getContactRecordId,
  normalizeContactPayload,
} from "../features/campaign/campaignCallRouteUtils";

export type { CampaignLocationState };

export interface CampaignCallBarProps {
  mode: CallBarMode;
  displayLabel: string;
  session?: Contact;
  phone?: string;
  onStartCall?: (payload: DialCallPayload) => void;
  onEndCall: () => void;
  callStartTime: Date | null;
  elapsedTime: string;
  hasAnsweredSession: boolean;
  handleNumpadClick: (char: string) => void;
  isStartCallDisabled: boolean;
  queuePreviousLabel: string | null;
  queueNextLabel: string | null;
}

interface CampaignCallContextValue {
  hasActiveSession: boolean;
  showCallBar: boolean;
  callBarProps: CampaignCallBarProps;
  isPreviewDrawerOpen: boolean;
  openPreviewDrawer: () => void;
  closePreviewDrawer: () => void;
  openInCampaign: () => void;
  startFromNavigation: (state: CampaignLocationState) => void;
  endSession: () => void;
  sessionConfig: CampaignLocationState;
  manualSession: CallSession | null;
  setManualSession: React.Dispatch<React.SetStateAction<CallSession | null>>;
  sessionToShow: CallSession | null;
  answeredSession: Contact | boolean | null;
  contactDetailsLoading: boolean;
  activityTimelineRefreshKey: number;
  callStarted: boolean;
  dialerState: "TRANSITIONING" | "IN_CALL" | "DIALING" | "IDLE";
  isCampaignRunning: boolean;
  isCampaignFinished: boolean;
  isSocketReady: boolean;
  error: string | null;
  oneOffPhoneString: string;
  phone: string | unknown | undefined;
  contacts: Contact[] | undefined;
  mode: TelephonyConnection | undefined;
  contactId: string | undefined;
  effectiveContactId: string | undefined;
  resolvedMode: TelephonyConnection;
  isOneOff: boolean;
  isBatchDial: boolean;
  currentBatch: CallSession[];
  ringingSessions: CallSession[];
  pendingResultContacts: CallSession[];
  singleSession: CallSession | null;
  handleStartCampaign: () => void;
  handleStopCampaign: () => void;
  hangUp: () => void;
  hangUpNotKnown: () => void;
  makeCallBatch: (override?: { number: string; slot: PhoneSlot }) => Promise<void>;
  handleNumpadClick: (char: string) => void;
  setCurrentBatch: React.Dispatch<React.SetStateAction<CallSession[]>>;
  setActivityTimelineRefreshKey: React.Dispatch<React.SetStateAction<number>>;
  refreshManualSession: () => Promise<void>;
  refreshSessionToShow: () => Promise<void>;
  onManualPanelStartCall: (payload: DialCallPayload) => void;
  defaultDisposition: string | undefined;
  listId: string | undefined;
  lastAnsweredId: string | null;
  showContinueDialog: boolean;
}

const CampaignCallContext = createContext<CampaignCallContextValue | null>(null);

export function useCampaignCall(): CampaignCallContextValue {
  const ctx = useContext(CampaignCallContext);
  if (!ctx) {
    throw new Error("useCampaignCall must be used within CampaignCallProvider");
  }
  return ctx;
}

export function useCampaignCallOptional(): CampaignCallContextValue | null {
  return useContext(CampaignCallContext);
}

export function CampaignCallProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [bootContactIdFromHash] = useState(getContactIdFromHashOnly);
  const [sessionConfig, setSessionConfig] = useState<CampaignLocationState>({});
  const [isPreviewDrawerOpen, setIsPreviewDrawerOpen] = useState(false);

  const contactIdFromUrl =
    searchParams.get("contactId")?.trim() ||
    getCampaignContactIdFromLocation(location) ||
    bootContactIdFromHash;

  const {
    contacts: configContacts,
    mode,
    contactId: configContactId,
    phone,
    defaultDisposition,
    autoStart,
    listId,
  } = sessionConfig;

  const effectiveContactId = configContactId || contactIdFromUrl;
  const oneOffPhoneString = useMemo(
    () => coerceRouteStatePhoneToString(phone),
    [phone]
  );

  const { phoneState } = useAuth();
  const { socket, volumeHandler, hangUpHandler } = phoneState;
  const { enqueue } = useSnackbar();
  const { user, settings, setSettings } = useAppStore((state) => state);

  useEffect(() => {
    if (!user) return;
    if (settings) return;
    api
      .get("/settings")
      .then(({ data }) => setSettings(data))
      .catch((err) =>
        console.error("[CampaignCall] Failed to load settings:", err)
      );
  }, [user, settings, setSettings]);

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
  const [contactNotes, setContactNotes] = useState<Record<string, string>>({});
  const [selectedResults, setSelectedResults] = useState<
    Record<string, string>
  >({});
  const [activityTimelineRefreshKey, setActivityTimelineRefreshKey] =
    useState(0);

  const contacts = configContacts;

  const startFromNavigation = useCallback((state: CampaignLocationState) => {
    setSessionConfig((prev) => ({
      ...prev,
      ...(state.contacts !== undefined && { contacts: state.contacts }),
      ...(state.mode !== undefined && { mode: state.mode }),
      ...(state.contactId !== undefined && { contactId: state.contactId }),
      ...(state.phone !== undefined && { phone: state.phone }),
      ...(state.defaultDisposition !== undefined && {
        defaultDisposition: state.defaultDisposition,
      }),
      ...(state.autoStart !== undefined && { autoStart: state.autoStart }),
      ...(state.listId !== undefined && { listId: state.listId }),
    }));
  }, []);

  useEffect(() => {
    const s = location.state as CampaignLocationState | null;
    if (!s) return;
    if (
      s.contacts?.length ||
      s.contactId ||
      s.phone ||
      s.mode
    ) {
      startFromNavigation(s);
    }
  }, [location.state, startFromNavigation]);

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
  useEffect(() => {
    const id = (configContactId || contactIdFromUrl || "").trim();
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
        console.error("[CampaignCall] Failed to load contact:", err);
        enqueue("Could not load contact details.", { variant: "error" });
      })
      .finally(() => {
        if (gen === contactLoadGenRef.current) {
          setContactDetailsLoading(false);
        }
      });
  }, [
    configContactId,
    contactIdFromUrl,
    contacts,
    loadedContactIdKey,
    enqueue,
  ]);

  useEffect(() => {
    if (!configContactId || (contacts && contacts.length > 0)) return;
    const current = getCampaignContactIdFromLocation(location);
    if (current === configContactId) return;
    const base = getCampaignSearchString(location);
    const next = new URLSearchParams(
      base.startsWith("?") ? base.slice(1) : base
    );
    next.set("contactId", configContactId);
    navigate(
      {
        pathname: location.pathname,
        search: `?${next.toString()}`,
        hash: location.hash,
      },
      { replace: true, state: location.state }
    );
  }, [
    configContactId,
    contacts,
    location.hash,
    location.pathname,
    location.search,
    location.state,
    navigate,
  ]);

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

  useEffect(() => {
    if (callStarted) {
      setCallStartTime(new Date());
    }
  }, [callStarted]);

  useEffect(() => {
    let int: ReturnType<typeof setInterval>;
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

  const isOneOff = useMemo(() => {
    return !!(phone && !manualSession && !contacts && !mode);
  }, [phone, manualSession, contacts, mode]);

  const isBatchDial = useMemo(() => {
    return !!(contacts || (isCampaignRunning && mode));
  }, [contacts, isCampaignRunning, mode]);

  const dialerState = useMemo(() => {
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
  }, [
    isStartingNextCall,
    isBatchDial,
    answeredSession,
    callStarted,
    ringingSessions.length,
  ]);

  const prevCallStartedRef = useRef(false);
  useEffect(() => {
    if (callStarted && !prevCallStartedRef.current) {
      hasSeenCallActivityRef.current = false;
    }
    prevCallStartedRef.current = callStarted;
  }, [callStarted]);

  useEffect(() => {
    if (ringingSessions.length > 0 || answeredSession !== null) {
      hasSeenCallActivityRef.current = true;
    }
  }, [ringingSessions.length, answeredSession]);

  useEffect(() => {
    if (isOneOff) return;
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
    if (!listId || !contacts?.length) return;
    if (!isCampaignFinished) return;
    if (currentIndex < contacts.length) return;
    navigate("/lists", { replace: true });
  }, [listId, contacts, isCampaignFinished, currentIndex, navigate]);

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
  }, [
    isCampaignFinished,
    isCampaignRunning,
    currentBatch,
    lastAnsweredId,
    singleSession,
  ]);

  const callBarMode: CallBarMode = dialerState === "IDLE" ? "idle" : "active";

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
      return name
        ? `Campaign – ${name} (${contacts.length})`
        : `Campaign (${contacts.length} contacts)`;
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

  const makeCallNotKnown = async (phoneNum: string) => {
    if (!phoneNum?.trim()) return;
    if (guardNoSocket()) return;
    try {
      await api.post("/campaign/call-notknown", { phone: phoneNum });
      setCallStarted(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to start call. Please try again.";
      enqueue(errorMessage, { variant: "error" });
      setError(errorMessage);
    }
  };

  const makeCallBatch = async (override?: { number: string; slot: PhoneSlot }) => {
    if (guardNoSocket()) return;
    let slice: Contact[];
    if (contacts) {
      slice = contacts.slice(currentIndex, currentIndex + callsPerBatch);
      if (slice.length === 0) {
        setIsCampaignFinished(true);
        setRingingSessions([]);
        setIsCampaignRunning(false);
        setIsStartingNextCall(false);
        setCallStarted(false);
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
        batchContacts = [
          { ...c, dialToNumber: trimmed } as unknown as Contact,
        ];
      }

      const activeCalls = await api.post("/campaign/call-campaign", {
        contacts: batchContacts,
      });

      setCallStarted(true);

      const extendedBatchContactsWithSid = batchContacts.map(
        (batchContact: Contact) => {
          const call = activeCalls.data.find((activeCall: { phoneNumber: string; callSid: string }) => {
            const primary = getContactPhoneDisplayString(batchContact);
            return primary === activeCall.phoneNumber;
          });
          return { ...batchContact, callSid: call?.callSid };
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
    } catch (err: unknown) {
      if (preDialAudioRef.current) {
        preDialAudioRef.current.pause();
        preDialAudioRef.current.currentTime = 0;
        preDialAudioRef.current = null;
      }
      const error = err as { response?: { data?: { errors?: { message: string }[] } }; message?: string };
      const msg = error.response?.data?.errors?.[0]?.message;
      setError(typeof msg === "string" ? msg : error.message ?? "Call failed");
      setIsStartingNextCall(false);
    }
  };

  const handleStartCampaign = () => {
    setIsCampaignRunning(true);
    setIsCampaignFinished(false);
    setCurrentIndex(0);
    void makeCallBatch();
  };

  useEffect(() => {
    if (!autoStart || !isSocketReady || !settings || hasAutoStartedRef.current)
      return;
    if (guardNoSocket()) return;

    if (
      (manualSession || (contacts && contacts.length > 0)) &&
      !isCampaignRunning
    ) {
      hasAutoStartedRef.current = true;
      handleStartCampaign();
    }
  }, [
    autoStart,
    isSocketReady,
    settings,
    phone,
    manualSession,
    contacts,
    isCampaignRunning,
  ]);

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
    if (isBatchDial) {
      setIsStartingNextCall(true);
    }
    void makeCallBatch();
  };

  const handleStopCampaign = () => {
    setIsCampaignRunning(false);
    setShowContinueDialog(false);
    setIsCampaignFinished(true);
    setIsStartingNextCall(false);
    setCallStarted(false);
    setStatus("Campaign manually stopped!");
    api.post("/campaign/stop-campaign");
  };

  const handleDialogClose = () => {
    setShowContinueDialog(false);
    void makeCallBatch();
  };

  const handleResult = async (
    contact: Contact,
    result: string,
    notesOverride?: string
  ) => {
    await api.patch(`/contacts/${contact.id}`, {
      result,
      notes: notesOverride ?? contactNotes[contact.id] ?? "",
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

  const hasActiveCall = useMemo(
    () =>
      dialerState === "DIALING" ||
      dialerState === "IN_CALL" ||
      dialerState === "TRANSITIONING" ||
      ringingSessions.length > 0,
    [dialerState, ringingSessions.length]
  );

  const isBatchCampaign = !!(contacts && contacts.length > 0);

  const batchExhausted =
    isBatchCampaign && currentIndex >= (contacts?.length ?? 0);

  const campaignDone = useMemo(() => {
    if (isBatchCampaign) {
      return batchExhausted || (isCampaignFinished && !isCampaignRunning);
    }
    return isCampaignFinished;
  }, [
    isBatchCampaign,
    batchExhausted,
    isCampaignFinished,
    isCampaignRunning,
  ]);

  /** Batch loaded on /campaign before the first dial only */
  const awaitingBatchStart =
    isBatchCampaign &&
    !campaignDone &&
    !isCampaignRunning &&
    currentIndex === 0 &&
    currentBatch.length === 0 &&
    !hasActiveCall;

  const showCallBar = useMemo(() => {
    if (campaignDone && !hasActiveCall) return false;
    if (hasActiveCall || isCampaignRunning) return true;
    if (awaitingBatchStart) return true;

    return !!(
      (manualSession && !isBatchCampaign) ||
      (phone != null && phone !== "" && !manualSession) ||
      (effectiveContactId && !isBatchCampaign)
    );
  }, [
    campaignDone,
    hasActiveCall,
    isCampaignRunning,
    awaitingBatchStart,
    manualSession,
    phone,
    effectiveContactId,
    isBatchCampaign,
  ]);

  useEffect(() => {
    if (campaignDone && !hasActiveCall) {
      setIsStartingNextCall(false);
      setCallStarted(false);
    }
  }, [campaignDone, hasActiveCall]);

  const hasActiveSession = showCallBar;

  useEffect(() => {
    if (!showCallBar && isPreviewDrawerOpen) {
      setIsPreviewDrawerOpen(false);
    }
  }, [showCallBar, isPreviewDrawerOpen]);

  const callBarQueueNeighbors = useMemo(() => {
    if (!contacts?.length || contacts.length <= 1) {
      return {
        queuePreviousLabel: null as string | null,
        queueNextLabel: null as string | null,
      };
    }

    const queueName = (c: { first_name?: string; last_name?: string }) =>
      `${c.first_name || ""} ${c.last_name || ""}`.trim() || "Contact";

    let refIndex = -1;
    if (sessionToShow?.id) {
      refIndex = contacts.findIndex(
        (c: CallSession) => String(c.id) === String(sessionToShow.id)
      );
    }
    if (refIndex < 0 && currentBatch.length > 0) {
      const indices = currentBatch
        .map((b) =>
          contacts.findIndex((c: CallSession) => String(c.id) === String(b.id))
        )
        .filter((i) => i >= 0);
      if (indices.length) refIndex = Math.min(...indices);
    }
    if (refIndex < 0) {
      return { queuePreviousLabel: null, queueNextLabel: null };
    }

    return {
      queuePreviousLabel:
        refIndex > 0 ? queueName(contacts[refIndex - 1]) : null,
      queueNextLabel:
        refIndex < contacts.length - 1
          ? queueName(contacts[refIndex + 1])
          : null,
    };
  }, [contacts, sessionToShow, currentBatch]);

  const callBarProps: CampaignCallBarProps = {
    mode: callBarMode,
    displayLabel: callBarDisplayLabel,
    session: (sessionToShow || singleSession || manualSession) as
      | Contact
      | undefined,
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
  };

  const openPreviewDrawer = useCallback(() => setIsPreviewDrawerOpen(true), []);
  const closePreviewDrawer = useCallback(() => setIsPreviewDrawerOpen(false), []);

  const openInCampaign = useCallback(() => {
    const activeId =
      manualSession?.id ?? sessionToShow?.id ?? effectiveContactId;
    if (activeId) {
      navigate(`/campaign?contactId=${encodeURIComponent(activeId)}`);
    } else {
      navigate("/campaign");
    }
  }, [manualSession?.id, sessionToShow?.id, effectiveContactId, navigate]);

  const endSession = useCallback(() => {
    setSessionConfig({});
    setManualSession(null);
    setCallStarted(false);
    setIsCampaignRunning(false);
    setIsCampaignFinished(false);
    setCurrentBatch([]);
    setPendingResultContacts([]);
    setShowContinueDialog(false);
    hasAutoStartedRef.current = false;
  }, [
    setCurrentBatch,
    setIsCampaignFinished,
    setIsCampaignRunning,
    setPendingResultContacts,
    setShowContinueDialog,
  ]);

  const onManualPanelStartCall = (payload: DialCallPayload) => {
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

  const refreshManualSession = async () => {
    if (!manualSession?.id) return;
    const res = await api.get(`/contacts/${manualSession.id}`);
    setManualSession(res.data);
  };

  const refreshSessionToShow = async () => {
    if (!sessionToShow?.id) return;
    const res = await api.get(`/contacts/${sessionToShow.id}`);
    setCurrentBatch((prev) =>
      prev.map((c) => (c.id === res.data.id ? res.data : c))
    );
  };

  const value: CampaignCallContextValue = {
    hasActiveSession,
    showCallBar,
    callBarProps,
    isPreviewDrawerOpen,
    openPreviewDrawer,
    closePreviewDrawer,
    openInCampaign,
    startFromNavigation,
    endSession,
    sessionConfig,
    manualSession,
    setManualSession,
    sessionToShow,
    answeredSession,
    contactDetailsLoading,
    activityTimelineRefreshKey,
    callStarted,
    dialerState,
    isCampaignRunning,
    isCampaignFinished,
    isSocketReady,
    error,
    oneOffPhoneString,
    phone,
    contacts,
    mode,
    contactId: configContactId,
    effectiveContactId,
    resolvedMode,
    isOneOff,
    isBatchDial,
    currentBatch,
    ringingSessions,
    pendingResultContacts,
    singleSession,
    handleStartCampaign,
    handleStopCampaign,
    hangUp,
    hangUpNotKnown,
    makeCallBatch,
    handleNumpadClick,
    setCurrentBatch,
    setActivityTimelineRefreshKey,
    refreshManualSession,
    refreshSessionToShow,
    onManualPanelStartCall,
    defaultDisposition,
    listId,
    lastAnsweredId,
    showContinueDialog,
  };

  return (
    <CampaignCallContext.Provider value={value}>
      {children}
      <GlobalCampaignPreviewDrawer />
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
        defaultDisposition={defaultDisposition ?? ""}
        setIsStartingNextCall={setIsStartingNextCall}
      />
    </CampaignCallContext.Provider>
  );
}
