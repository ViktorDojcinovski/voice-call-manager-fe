import { useState, useEffect, useRef } from "react";
import { Call } from "@twilio/voice-sdk";
import { Socket } from "socket.io-client";
import { normalizePhone, TwilioFinalStatus } from "voice-javascript-common";

import { CallSession, Contact } from "../../../types/contact";
import { getContactPrimaryPhone } from "../../../utils/getContactPrimaryPhone";
import { useAuth } from "../../../contexts/AuthContext";

interface useTwilioCampaignProps {
  userId: string;
  socket: Socket;
  enabled?: boolean;
  callEventHandlers: {
    volumeHandler: (inputVolume: number, outputVolume: number) => void;
    hangUpHandler: () => void;
  };
}

export const useCampaign = ({
  userId,
  socket,
  enabled = false,
  callEventHandlers,
}: useTwilioCampaignProps) => {
  const [status, setStatus] = useState<string>("");
  const [ringingSessions, setRingingSessions] = useState<CallSession[]>([]);
  const [answeredSession, setAnsweredSession] = useState<
    Contact | boolean | null
  >(null);

  const [currentBatch, setCurrentBatch] = useState<CallSession[]>([]);
  const [isCampaignRunning, setIsCampaignRunning] = useState(false);
  const [isCampaignFinished, setIsCampaignFinished] = useState(false);
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [pendingResultContacts, setPendingResultContacts] = useState<
    CallSession[]
  >([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastAnsweredId, setLastAnsweredId] = useState<string | null>(null);

  const { phoneState } = useAuth();
  const { twilioDevice, setIncomingHandler, triggerInboundCall } = phoneState;

  // Refs
  const answeredSessionRef = useRef<Contact | boolean | null>(null);
  const activeCallRef = useRef<Call | null>(null);
  const callToContactMap = useRef(new Map<Call, CallSession>());
  const currentBatchRef = useRef<Contact[]>([]);

  // Handle hangUp
  const handleHangUpNotKnown = () => {
    const call = activeCallRef.current as Call;
    if (!call) {
      console.warn("No active call to hang up.");
      return;
    }

    setAnsweredSession(null);
    activeCallRef.current = null;
  };

  const handleHangUp = () => {
    const call = activeCallRef.current as Call;
    if (!call) {
      console.warn("No active call to hang up.");
      return;
    }

    const associatedContact = callToContactMap.current.get(call);
    if (associatedContact) {
      setPendingResultContacts((prev) => {
        const alreadyAdded = prev.some((c) => c.id === associatedContact.id);
        return alreadyAdded ? prev : [...prev, associatedContact];
      });
    }

    // Clean up the map
    callToContactMap.current.delete(call);

    setAnsweredSession(null);
    activeCallRef.current = null;
    setShowContinueDialog(true);
  };

  // Handle Call status
  const handleCallStatus = ({ to, status }: { to: string; status: string }) => {
    const contact = currentBatch.find((c) => {
      const primary = getContactPrimaryPhone(c) ?? c.primaryPhone;
      return primary && normalizePhone(primary) === normalizePhone(to);
    });

    if (contact && status === "ringing") {
      setRingingSessions((prev) => {
        const already = prev.some((c) => c.id === contact.id);
        return already ? prev : [...prev, { ...contact, status }];
      });
    }

    if (contact && status === "in-progress") {
      // Remove from ringing
      setRingingSessions((prev) => prev.filter((c) => c.id !== contact.id));
      // Set current active call
      setAnsweredSession(contact);
      setLastAnsweredId(contact.id);
    } else if (!contact && status === "in-progress") {
      setAnsweredSession(true);
    }

    if (
      contact &&
      Object.values(TwilioFinalStatus).includes(status as TwilioFinalStatus)
    ) {
      const isWinner =
        (answeredSessionRef.current as Contact) &&
        (() => {
          const c = answeredSessionRef.current as Contact;
          const primary = getContactPrimaryPhone(c) ?? c.primaryPhone;
          return primary && normalizePhone(primary) === normalizePhone(to);
        })();
      if (isWinner && activeCallRef.current) {
        // The WebRTC side is still up → this "completed" is just Twilio handing off. Ignore it.
        return;
      }

      setRingingSessions((prev) => prev.filter((c) => c.id !== contact.id));
      setPendingResultContacts((prev) => {
        const alreadyAdded = prev.some((c) => c.id === contact.id);
        return alreadyAdded ? prev : [...prev, contact];
      });

      // If this is the one that answered, clear the active session
      if (isWinner) {
        setAnsweredSession(null);
      }
    } else if (
      !contact &&
      Object.values(TwilioFinalStatus).includes(status as TwilioFinalStatus)
    ) {
      setAnsweredSession(null);
    }
  };

  const handleNumpadClick = (digit: string) => {
    const call = activeCallRef.current;
    if (!call) {
      console.warn("No active call to send digit");
      return;
    }

    call.sendDigits(digit);
  };

  const bindCallEventHandlers = (
    call: Call,
    contact: CallSession | null = null
  ) => {
    if (contact) {
      callToContactMap.current.set(call, contact);
    }
    call.on("volume", callEventHandlers.volumeHandler);
    // TO DO -- change to hangUpHandler
    call.on("disconnect", () => {
      if (activeCallRef.current === call) {
        handleHangUp();
      }
    });
  };

  // Effects
  useEffect(() => {
    if (!twilioDevice || !setIncomingHandler) return;

    if (!enabled) {
      setIncomingHandler(null);
      return;
    }

    const onIncomingHandler = (call: Call) => {
      const params = new URLSearchParams(call.parameters?.Params || "");
      const contactId = params.get("contactId");
      const isOutbound = params.get("outbound") === "true";
      const callSid = params.get("callSid");

      if (!isOutbound) {
        triggerInboundCall?.(call);
        return;
      }

      if (contactId) {
        const contact = currentBatchRef.current.find(
          (c) => c.id === contactId
        ) as CallSession;

        if (contact && callSid) {
          contact.callSid = callSid;
        }

        setCurrentBatch((prev) =>
          prev.map((c) => (c.id === contact.id ? { ...c, callSid } : c))
        );

        activeCallRef.current = call;
        bindCallEventHandlers(call, contact);
        call.accept();
        setStatus("Outbound call accepted");
      } else {
        activeCallRef.current = call;
        bindCallEventHandlers(call);
        call.accept();
        setStatus("Outbound call accepted");
      }
    };

    setIncomingHandler(() => onIncomingHandler);

    return () => {
      setIncomingHandler(null);
    };
  }, [twilioDevice, enabled, triggerInboundCall]);

  useEffect(() => {
    answeredSessionRef.current = answeredSession;
  }, [answeredSession]);

  useEffect(() => {
    if (!enabled) return;
    if (!socket || !userId) return;
    const roomEvent = `call-status-user-${userId}`;

    socket.on(roomEvent, handleCallStatus);
    return () => {
      socket.off(roomEvent, handleCallStatus);
    };
  }, [socket, currentBatch, pendingResultContacts, userId, enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (currentBatch.length === 0) return;

    const allContactsHandled = currentBatch.every((contact) =>
      pendingResultContacts.some((r) => r.id === contact.id)
    );

    if (
      isCampaignRunning &&
      allContactsHandled &&
      ringingSessions.length === 0 &&
      answeredSession === null
    ) {
      setShowContinueDialog(true);
    }
  }, [
    isCampaignRunning,
    ringingSessions,
    answeredSession,
    pendingResultContacts,
    currentBatch,
    enabled,
  ]);

  return {
    status,
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
    setStatus,
    setCurrentBatch,
    setIsCampaignRunning,
    setIsCampaignFinished,
    setCurrentIndex,
    setPendingResultContacts,
    setShowContinueDialog,
    setRingingSessions,
    handleHangUp,
    handleHangUpNotKnown,
    handleNumpadClick,
  };
};
