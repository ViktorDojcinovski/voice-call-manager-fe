import { useState, useEffect, useCallback, useRef } from "react";
import { Device, Call } from "@twilio/voice-sdk";
import { Socket } from "socket.io-client";

import { initTwilio } from "../../utils/initTwilio";
import { initSocket } from "../../utils/initSocket";

import { CallSession, Contact } from "../../types/contact";
import { AudioDevice } from "../../interfaces/audio-device";
import { normalizePhone } from "../../utils/normalizePhone";
import { getAudioDevices } from "../../utils/audioDevice";

interface useTwilioCampaignProps {
  userId: string;
}

const TwilioFinalStatuses = [
  "completed",
  "busy",
  "no-answer",
  "canceled",
  "failed",
];

export const useTwilioCampaign = ({ userId }: useTwilioCampaignProps) => {
  // State management
  const [twilioDevice, setTwilioDevice] = useState<Device | null>(null);
  // Web Sockets
  const [socket, setSocket] = useState<Socket | null>(null);

  // TO-DO check if status type is always equal to call result type from Settings!
  const [status, setStatus] = useState<string>("Not connected");
  const [devices, setDevices] = useState<AudioDevice[] | null>(null);
  const [inputVolume, setInputVolume] = useState<number>(0);
  const [outputVolume, setOutputVolume] = useState<number>(0);

  const [ringingSessions, setRingingSessions] = useState<CallSession[]>([]);
  const [answeredSession, setAnsweredSession] = useState<Contact | null>(null);

  const [currentBatch, setCurrentBatch] = useState<CallSession[]>([]);
  const [isCampaignRunning, setIsCampaignRunning] = useState(false);
  const [isCampaignFinished, setIsCampaignFinished] = useState(false);
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [pendingResultContacts, setPendingResultContacts] = useState<
    CallSession[]
  >([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Refs
  const twilioDeviceRef = useRef<Device | null>(null);
  const answeredSessionRef = useRef<Contact | null>(null);
  const activeCallRef = useRef<Call | null>(null);
  const callToContactMap = useRef(new Map<Call, CallSession>());
  const currentBatchRef = useRef<Contact[]>([]);
  const ringtoneAudioRef = useRef<HTMLAudioElement | null>(null);

  // Get Twilio devices
  const getDevices = useCallback(async () => {
    if (twilioDeviceRef.current) {
      const devices = await getAudioDevices(twilioDeviceRef.current);
      setDevices(devices);
    }
  }, []);

  // Bind call event callbacks
  const bindCallEventHandlers = (call: Call, contact: CallSession) => {
    callToContactMap.current.set(call, contact);

    call.on("volume", (inputVolume: number, outputVolume: number) => {
      setInputVolume(inputVolume);
      setOutputVolume(outputVolume);
    });

    call.on("disconnect", () => {
      if (activeCallRef.current === call) {
        //handleHangUp();
      }
    });
  };

  // Handle hangUp
  const handleHangUp = () => {
    const call = activeCallRef.current as Call;
    if (!call) {
      console.warn("No active call to hang up.");
      return;
    }

    const associatedContact = callToContactMap.current.get(call);
    if (associatedContact) {
      setPendingResultContacts((prev) => {
        const alreadyAdded = prev.some((c) => c._id === associatedContact._id);
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
    const contact = currentBatch.find(
      (c) => normalizePhone(c.mobile_phone) === normalizePhone(to)
    );
    if (!contact) return;

    if (status === "ringing") {
      setRingingSessions((prev) => {
        const already = prev.some((c) => c._id === contact._id);
        return already ? prev : [...prev, { ...contact, status }];
      });
    }

    if (status === "in-progress") {
      // Remove from ringing
      setRingingSessions((prev) => prev.filter((c) => c._id !== contact._id));
      // Set current active call
      setAnsweredSession(contact);
    }

    if (TwilioFinalStatuses.includes(status)) {
      const isWinner =
        answeredSessionRef.current &&
        normalizePhone(answeredSessionRef.current.mobile_phone) ===
          normalizePhone(to);
      if (isWinner && activeCallRef.current) {
        // The WebRTC side is still up → this "completed" is just Twilio handing off. Ignore it.
        return;
      }

      setRingingSessions((prev) => prev.filter((c) => c._id !== contact._id));
      setPendingResultContacts((prev) => {
        const alreadyAdded = prev.some((c) => c._id === contact._id);
        return alreadyAdded ? prev : [...prev, contact];
      });

      // If this is the one that answered, clear the active session
      if (isWinner) {
        setAnsweredSession(null);
      }
    }
  };

  // Effects
  useEffect(() => {
    if (ringingSessions.length > 0 && !answeredSession) {
      if (!ringtoneAudioRef.current) {
        ringtoneAudioRef.current = new Audio("/ringtone.wav");
        ringtoneAudioRef.current.loop = true; // repeat until stopped
      }
      ringtoneAudioRef.current.play().catch(() => {
        // autoplay policy: can prompt user, or ignore if rejected
      });
    } else {
      if (ringtoneAudioRef.current) {
        ringtoneAudioRef.current.pause();
        ringtoneAudioRef.current.currentTime = 0;
        ringtoneAudioRef.current = null;
      }
    }
  }, [ringingSessions.length, answeredSession]);

  useEffect(() => {
    answeredSessionRef.current = answeredSession;
  }, [answeredSession]);

  useEffect(() => {
    if (!socket) return;
    const roomEvent = `call-status-user-${userId}`;

    socket.on(roomEvent, handleCallStatus);
    return () => {
      socket.off(roomEvent, handleCallStatus);
    };
  }, [socket, currentBatch, pendingResultContacts, userId]);

  useEffect(() => {
    if (twilioDevice) {
      getDevices();
    }
  }, [twilioDevice, getDevices]);

  useEffect(() => {
    let newSocket: Socket<any, any>;
    const onIncomingHandler = (call: Call) => {
      const paramsString = call.parameters?.Params;
      const parsedParams = new URLSearchParams(paramsString);
      const contactId = parsedParams.get("contactId");

      const contactToBind = currentBatchRef.current.find(
        (contact) => contact._id === contactId
      ) as CallSession;
      if (!contactToBind) {
        console.warn("Could not bind call: no contact found for call params");
        return;
      }
      activeCallRef.current = call;

      bindCallEventHandlers(call, contactToBind!);
      call.accept();
      setStatus("Call started");
    };
    const onRegisteredHandler = () => {
      setStatus("Device ready to make calls!");
    };
    const onErrorHandler = (error: Error) => {
      console.log("Twilio.Device Error: " + error.message);
    };

    (async () => {
      try {
        // Init Twilio
        const device = await initTwilio(
          onIncomingHandler,
          onRegisteredHandler,
          onErrorHandler
        );

        setTwilioDevice(device);
        twilioDeviceRef.current = device;
        device.register();
      } catch (error) {
        setStatus("Twilio Device error");
        console.error(error);
      }
    })();

    try {
      // Init Web Socket
      newSocket = initSocket(userId);
      setSocket(newSocket);
    } catch (error) {
      setStatus("WebSocket connection error");
      console.error(error);
    }

    return () => {
      // Clean twilio ref
      if (twilioDeviceRef.current) {
        twilioDeviceRef.current.destroy();
      }

      // Clean web socket connection
      if (newSocket) {
        newSocket.disconnect();
      }

      // Clean audio ref
      if (ringtoneAudioRef.current) {
        ringtoneAudioRef.current.pause();
        ringtoneAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (currentBatch.length === 0) return;

    const allContactsHandled = currentBatch.every((contact) =>
      pendingResultContacts.some((r) => r._id === contact._id)
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
  ]);

  return {
    status,
    inputVolume,
    outputVolume,
    currentIndex,
    isCampaignRunning,
    isCampaignFinished,
    showContinueDialog,
    ringingSessions,
    answeredSession,
    pendingResultContacts,
    currentBatch,
    currentBatchRef,
    setCurrentBatch,
    setIsCampaignRunning,
    setIsCampaignFinished,
    setCurrentIndex,
    setPendingResultContacts,
    setShowContinueDialog,
    setStatus,
    setRingingSessions,
    handleHangUp,
  };
};
