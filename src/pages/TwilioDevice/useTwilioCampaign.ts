import { useState, useEffect, useCallback, useRef } from "react";
import { Device, Call } from "@twilio/voice-sdk";
import { io, Socket } from "socket.io-client";

import api from "../../utils/axiosInstance";

import { CallSession } from "../../types/session";
import { Contact } from "../../types/contact";
import { AudioDevice } from "../../interfaces/audio-device";
import { normalizePhone } from "../../utils/normalizePhone";
import config from "../../config";

interface useTwilioCampaignProps {
  getDevices: () => Promise<void>;
  bindVolumeIndicators: (call: Call) => void;
  userId: string;
}

export const useTwilioCampaign = ({
  getDevices,
  bindVolumeIndicators,
  userId,
}: useTwilioCampaignProps) => {
  // State management
  const [twilioDevice, setTwilioDevice] = useState<Device | null>(null);
  // Web Sockets
  const [socket, setSocket] = useState<Socket | null>(null);

  // TO-DO check if status type is always equal to call result type from Settings!
  const [status, setStatus] = useState<string>("Not connected");
  const [devices, setDevices] = useState<AudioDevice[] | null>(null);
  const [inputVolume, setInputVolume] = useState<number>(0);
  const [outputVolume, setOutputVolume] = useState<number>(0);
  // sessions variable Deprecated - REMOVE
  const [sessions, setSessions] = useState<CallSession[]>([]);

  const [ringingSessions, setRingingSessions] = useState<Contact[]>([]);
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
  const answeredSessionRef = useRef<Contact | null>(null);

  // Callbacks

  // Effects
  useEffect(() => {
    answeredSessionRef.current = answeredSession;
  }, [answeredSession]);

  useEffect(() => {
    const newSocket = io(config.backendUrl, {
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

    const handleCallStatus = ({
      to,
      status,
    }: {
      to: string;
      status: string;
    }) => {
      const contact = currentBatch.find(
        (c) => normalizePhone(c.mobile_phone) === normalizePhone(to)
      );
      if (!contact) return;

      if (status === "ringing") {
        setRingingSessions((prev) => {
          const already = prev.some((c) => c._id === contact._id);
          return already ? prev : [...prev, contact];
        });
      }

      if (status === "in-progress") {
        // Remove from dialing
        setRingingSessions((prev) => prev.filter((c) => c._id !== contact._id));
        // Set current active call
        setAnsweredSession(contact);
      }

      if (["completed", "busy", "no-answer", "canceled"].includes(status)) {
        setRingingSessions((prev) => prev.filter((c) => c._id !== contact._id));

        // If this is the one that answered, clear the active session
        if (
          answeredSessionRef.current &&
          normalizePhone(answeredSessionRef.current.mobile_phone) ===
            normalizePhone(to)
        ) {
          setAnsweredSession(null);
        }

        // Add to pending results
        setPendingResultContacts((prev) => {
          const alreadyAdded = prev.some((c) => c._id === contact._id);
          return alreadyAdded ? prev : [...prev, contact];
        });
      }
    };

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
        setStatus("Incoming call...");
        bindVolumeIndicators(call);
        call.accept();
      });

      newTwilioDevice.on("registered", () => {
        setStatus("Twilio device ready to make calls!");
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

    if (
      isCampaignRunning &&
      allContactsHandled &&
      ringingSessions.length === 0 &&
      answeredSession === null
    ) {
      setShowContinueDialog(true);
    }
  }, [ringingSessions, answeredSession, pendingResultContacts, currentBatch]);

  return {
    twilioDevice,
    status,
    sessions,
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
    setDevices,
    setSessions,
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
  };
};
