import { useState, useEffect, useCallback, useRef } from "react";
import { Device, Call } from "@twilio/voice-sdk";
import { io, Socket } from "socket.io-client";

import api from "../../utils/axiosInstance";

import { CallSession } from "../../types/session";
import { Contact } from "../../types/contact";
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
  const twilioDeviceRef = useRef<Device | null>(null);
  const answeredSessionRef = useRef<Contact | null>(null);
  const activeCallRef = useRef<Call | null>(null);
  const callToContactMap = useRef(new Map<Call, Contact>());

  // Get Twilio devices
  const getDevices = useCallback(async () => {
    if (twilioDeviceRef.current) {
      const devices = await getAudioDevices(twilioDeviceRef.current);
      setDevices(devices);
    }
  }, []);

  // Bind call event callbacks
  const bindCallEventHandlers = (call: Call, contact: Contact) => {
    // 1. Bind call to activeCallRef
    activeCallRef.current = call;
    // 2. Map call to contact in callToContactMap
    callToContactMap.current.set(call, contact);

    call.on("volume", (inputVolume: number, outputVolume: number) => {
      setInputVolume(inputVolume);
      setOutputVolume(outputVolume);
    });

    // 2. Disconnect event handler
    call.on("disconnect", () => {
      // 2.1
      activeCallRef.current = null;

      setAnsweredSession(null);

      // 3. Push the contact as pending-contact result
      // Lookup the contact associated with this call
      const associatedContact = callToContactMap.current.get(call);
      if (associatedContact) {
        setPendingResultContacts((prev) => [...prev, associatedContact]);
      }

      setShowContinueDialog(true);

      // Optionally clean up the map
      callToContactMap.current.delete(call);
    });
  };

  // Callbacks

  // Effects
  useEffect(() => {
    answeredSessionRef.current = answeredSession;
  }, [answeredSession]);

  useEffect(() => {
    twilioDeviceRef.current = twilioDevice;
  }, [twilioDevice]);

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

      console.log("to: ", to);
      console.log("status: ", status);
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
        setStatus("Call in progress...");

        // TO DO find the contact from the call
        console.log("currentBatch: ", currentBatch);
        console.log("call: ", call);

        const contactToBind = currentBatch.find(
          (contact: Contact) => contact.callSid === call.parameters.CallSid
        );
        console.log("contactToBind: ", contactToBind);
        bindCallEventHandlers(call, contactToBind!);
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

    console.log(
      "show dialog box: ",
      isCampaignRunning,
      allContactsHandled,
      ringingSessions,
      answeredSession
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
    activeCallRef,
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
    setAnsweredSession,
  };
};
