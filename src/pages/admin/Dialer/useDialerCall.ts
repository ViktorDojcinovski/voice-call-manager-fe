import { useState, useEffect, useRef } from "react";
import { Call } from "@twilio/voice-sdk";

import api from "../../../utils/axiosInstance";
import { useAuth } from "../../../contexts/AuthContext";
import useAppStore from "../../../store/useAppStore";
import { useSocketReady } from "../Campaign/useSocketReady";
import { Contact } from "../../../types/contact";

export const useDialerCall = (phone: string) => {
  const { phoneState } = useAuth();
  const {
    socket,
    twilioDevice,
    setIncomingHandler,
    triggerInboundCall,
    volumeHandler,
  } = phoneState;
  const user = useAppStore((s) => s.user);
  const userId = user?.id;

  const { ready: isSocketReady } = useSocketReady(socket ?? undefined, userId);

  const [callStarted, setCallStarted] = useState(false);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const [answered, setAnswered] = useState(false);

  const activeCallRef = useRef<Call | null>(null);
  const volumeHandlerRef = useRef(volumeHandler);
  volumeHandlerRef.current = volumeHandler;

  // Elapsed time timer
  useEffect(() => {
    let int: NodeJS.Timeout;
    if (answered && callStartTime) {
      int = setInterval(() => {
        const diff = Math.floor(
          (Date.now() - callStartTime.getTime()) / 1000
        );
        const mm = String(Math.floor(diff / 60)).padStart(2, "0");
        const ss = String(diff % 60).padStart(2, "0");
        setElapsedTime(`${mm}:${ss}`);
      }, 1000);
    } else {
      setElapsedTime("00:00");
    }
    return () => clearInterval(int!);
  }, [callStartTime, answered]);

  // Socket: call status (ringing, in-progress)
  useEffect(() => {
    if (!socket || !userId || !phone) return;

    const normalize = (s: string) => (s || "").replace(/\D/g, "").slice(-10);
    const roomEvent = `call-status-user-${userId}`;
    const handleCallStatus = ({
      to,
      status,
    }: {
      to: string;
      status: string;
    }) => {
      if (normalize(to) !== normalize(phone)) return;
      if (status === "in-progress") {
        setAnswered(true);
        setCallStartTime((prev) => prev || new Date());
      }
    };

    socket.on(roomEvent, handleCallStatus);
    return () => socket.off(roomEvent, handleCallStatus);
  }, [socket, userId, phone]);

  // Incoming handler for outbound call (with or without contactId)
  useEffect(() => {
    if (!twilioDevice || !setIncomingHandler) return;

    const onIncoming = (call: Call) => {
      const params = new URLSearchParams(call.parameters?.Params || "");
      const isOutbound = params.get("outbound") === "true";

      if (!isOutbound) {
        triggerInboundCall?.(call);
        return;
      }

      activeCallRef.current = call;
      call.on("volume", (i, o) => volumeHandlerRef.current(i, o));
      call.on("disconnect", () => {
        if (activeCallRef.current === call) {
          activeCallRef.current = null;
          setCallStarted(false);
          setAnswered(false);
          setCallStartTime(null);
        }
      });
      call.accept();
    };

    setIncomingHandler(() => onIncoming);
    return () => setIncomingHandler(null);
  }, [twilioDevice, setIncomingHandler, triggerInboundCall]);

  const startCall = async () => {
    if (!isSocketReady || !phone.trim()) return;
    try {
      await api.post("/campaign/call-notknown", { phone });
      setCallStarted(true);
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Failed to start call. Please try again.";
      throw new Error(msg);
    }
  };

  const startCallWithContact = async (contact: Contact) => {
    if (!isSocketReady) return;
    try {
      const { data: batchContacts } = await api.post("/contacts/batch", {
        ids: [contact.id],
      });
      await api.post("/campaign/call-campaign", {
        contacts: batchContacts,
      });
      setCallStarted(true);
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.message ||
        err.message ||
        "Failed to start call. Please try again.";
      throw new Error(msg);
    }
  };

  const hangUp = async () => {
    const call = activeCallRef.current;
    if (call) {
      call.disconnect();
      activeCallRef.current = null;
    }
    await api.post("/campaign/stop-campaign").catch(() => {});
    setCallStarted(false);
    setAnswered(false);
    setCallStartTime(null);
  };

  const handleNumpadClick = (digit: string) => {
    const call = activeCallRef.current;
    if (call) call.sendDigits(digit);
  };

  return {
    startCall,
    startCallWithContact,
    hangUp,
    callStarted,
    callStartTime,
    elapsedTime,
    answered,
    isSocketReady,
    handleNumpadClick,
  };
};
