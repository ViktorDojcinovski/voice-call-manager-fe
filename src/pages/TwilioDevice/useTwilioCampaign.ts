import { useState, useEffect, useCallback, useRef } from "react";
import { Device, Call } from "@twilio/voice-sdk";
import { io, Socket } from "socket.io-client";

import api from "../../utils/axiosInstance";

import { CallSession, Contact } from "../../types/contact";
import { AudioDevice } from "../../interfaces/audio-device";
import { normalizePhone } from "../../utils/normalizePhone";
import { getAudioDevices } from "../../utils/audioDevice";

import config from "../../config";

interface useTwilioCampaignProps {
  userId: string;
}

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

  const [currentBatch, setCurrentBatch] = useState<Contact[]>([]);
  const [isCampaignRunning, setIsCampaignRunning] = useState(false);
  const [isCampaignFinished, setIsCampaignFinished] = useState(false);
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [pendingResultContacts, setPendingResultContacts] = useState<Contact[]>(
    []
  );
  const [selectedResults, setSelectedResults] = useState<
    Record<string, string>
  >({});
  const [currentIndex, setCurrentIndex] = useState(0);

  // State management for the dialog box
  const [contactNotes, setContactNotes] = useState<Record<string, string>>({});

  // Refs
  const twilioDeviceRef = useRef<Device | null>(null);
  const answeredSessionRef = useRef<Contact | null>(null);
  const activeCallRef = useRef<Call | null>(null);
  const callToContactMap = useRef(new Map<Call, Contact>());
  const currentBatchRef = useRef<Contact[]>([]);

  const getDialingSessions = () => {
    return currentBatch.map((contact) => {
      const isRinging = ringingSessions.some((c) => c._id === contact._id);
      const isAnswered = answeredSession && answeredSession._id === contact._id;
      const isCompleted = pendingResultContacts.some(
        (c) => c._id === contact._id
      );
      let status = "Starting";
      if (isAnswered) {
        status = "In progress";
      } else if (isRinging) {
        status = "Ringing";
      } else if (isCompleted) {
        status = "Completed";
      }
      return {
        ...contact,
        status,
      };
    });
  };

  // Get Twilio devices
  const getDevices = useCallback(async () => {
    if (twilioDeviceRef.current) {
      const devices = await getAudioDevices(twilioDeviceRef.current);
      setDevices(devices);
    }
  }, []);

  // Bind call event callbacks
  const bindCallEventHandlers = (call: Call, contact: Contact) => {
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
        // [...prev, associatedContact]);
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

    if (
      ["completed", "busy", "no-answer", "canceled", "failed"].includes(status)
    ) {
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
    answeredSessionRef.current = answeredSession;
  }, [answeredSession]);

  useEffect(() => {
    twilioDeviceRef.current = twilioDevice;
  }, [twilioDevice]);

  useEffect(() => {
    const newSocket = io(config.backendDomain, {
      withCredentials: true,
    });
    newSocket.on("connect", () => {
      console.log("Connected to backend socket:", newSocket.id);
      newSocket.emit("join-room", { roomId: `user-${userId}` });
    });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

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
    const initTwilio = async () => {
      const identity = "webrtc_user";

      const { data } = await api.post("/twilio/token", { identity });
      const codecPreferences: any[] = ["opus", "pcmu"];
      const newTwilioDevice = new Device(data.token, {
        logLevel: "error",
        codecPreferences,
      });

      newTwilioDevice.on("incoming", (call: Call) => {
        const paramsString = call.parameters?.Params;
        const parsedParams = new URLSearchParams(paramsString);
        const contactId = parsedParams.get("contactId");

        const contactToBind = currentBatchRef.current.find(
          (contact) => contact._id === contactId
        );
        if (!contactToBind) {
          console.warn("Could not bind call: no contact found for call params");
          return;
        }
        activeCallRef.current = call;

        bindCallEventHandlers(call, contactToBind!);
        call.accept();
        setStatus("Call started");
      });

      newTwilioDevice.on("registered", () => {
        setStatus("Device ready to make calls!");
      });

      newTwilioDevice.on("error", (error: Error) => {
        console.log("Twilio.Device Error: " + error.message);
      });

      setTwilioDevice(newTwilioDevice);
      newTwilioDevice.register();
    };

    initTwilio();
  }, []);

  useEffect(() => {
    if (currentBatch.length === 0) return;

    const allContactsHandled = currentBatch.every((contact) =>
      pendingResultContacts.some((r) => r._id === contact._id)
    );

    // TO DO check again
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
    twilioDevice,
    status,
    inputVolume,
    outputVolume,
    devices,
    currentBatch,
    currentIndex,
    isCampaignRunning,
    isCampaignFinished,
    showContinueDialog,
    pendingResultContacts,
    selectedResults,
    contactNotes,
    ringingSessions,
    answeredSession,
    activeCallRef,
    currentBatchRef,
    setDevices,
    setInputVolume,
    setOutputVolume,
    setCurrentBatch,
    setIsCampaignRunning,
    setIsCampaignFinished,
    setSelectedResults,
    setCurrentIndex,
    setPendingResultContacts,
    setShowContinueDialog,
    setStatus,
    setContactNotes,
    setRingingSessions,
    setAnsweredSession,
    handleHangUp,
    getDialingSessions,
  };
};
