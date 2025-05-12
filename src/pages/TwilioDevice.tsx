import { useState, useEffect, useCallback } from "react";
import { Device, Call } from "@twilio/voice-sdk";
import { useLocation } from "react-router-dom";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
} from "@mui/material";

import api from "../utils/axiosInstance";
import useAppStore from "../store/useAppStore";

enum TelephonyConnection {
  SOFT_CALL = "Soft call",
  PARALLEL_CALL = "Two Parallel calls",
  ADVANCED_PARALLEL_CALL = "Four Parallel calls",
}

interface AudioDevice {
  id: string;
  label: string;
  isActive: boolean;
  type: string;
}

interface LocationState {
  contacts: any[];
  mode: TelephonyConnection;
}

async function getAudioDevices(
  twilioDevice: Device | null
): Promise<AudioDevice[]> {
  await navigator.mediaDevices.getUserMedia({ audio: true });

  return updateAllAudioDevices(twilioDevice);
}

async function updateAllAudioDevices(
  twilioDevice: Device | null
): Promise<AudioDevice[]> {
  if (twilioDevice && twilioDevice.audio) {
    const speakerDevices = await updateDevices(
      twilioDevice,
      twilioDevice.audio.speakerDevices.get(),
      "speaker"
    );
    const ringtoneDevices = await updateDevices(
      twilioDevice,
      twilioDevice.audio.ringtoneDevices.get(),
      "ringtone"
    );

    return [...speakerDevices, ...ringtoneDevices];
  }
  return [];
}

async function updateDevices(
  device: Device,
  selectedDevices: Set<MediaDeviceInfo>,
  type: string
): Promise<AudioDevice[]> {
  let devices: AudioDevice[] = [];
  device.audio!.availableOutputDevices.forEach((outputDevice, id) => {
    let isActive = selectedDevices.size === 0 && id === "default";
    selectedDevices.forEach((selectedDevice) => {
      if (selectedDevice.deviceId === id) {
        isActive = true;
      }
    });

    devices.push({ id, label: outputDevice.label, isActive, type });
  });

  return devices;
}

const TwilioDevice = () => {
  const location = useLocation();
  const { contacts, mode } = (location.state || {}) as LocationState;

  const [twilioDevice, setTwilioDevice] = useState<Device | null>(null);
  const [status, setStatus] = useState<string>("Not connected");
  const [devices, setDevices] = useState<AudioDevice[] | null>(null);
  const [inputVolume, setInputVolume] = useState<number>(0);
  const [outputVolume, setOutputVolume] = useState<number>(0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCampaignRunning, setIsCampaignRunning] = useState(false);
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [isCampaignFinished, setIsCampaignFinished] = useState(false);
  // TO-DO change any to Contact or something
  const [currentBatch, setCurrentBatch] = useState<any[]>([]);

  const [selectedResults, setSelectedResults] = useState<
    Record<string, string>
  >({});
  const [pendingResultContacts, setPendingResultContacts] = useState<any[]>([]);

  const settings = useAppStore((state) => state.settings);
  if (!settings) {
    throw new Error("Missing settings!");
  }
  const phoneSettings = { ...settings["Phone Settings"] };

  console.log("phoneSettings: ", phoneSettings);

  // TO-DO switch to web sockets
  const pollCampaignStatus = useCallback(() => {
    const interval = setInterval(async () => {
      const res = await api.get("/campaign/campaign-status");

      if (res.data.activeCalls === 0 && !showContinueDialog) {
        clearInterval(interval);
        setShowContinueDialog(true);
      }
    }, 5000);
  }, [showContinueDialog]);

  const callsPerBatch = {
    [TelephonyConnection.SOFT_CALL]: 1,
    [TelephonyConnection.PARALLEL_CALL]: 2,
    [TelephonyConnection.ADVANCED_PARALLEL_CALL]: 4,
  }[mode];

  const getDevices = useCallback(async () => {
    const devices = await getAudioDevices(twilioDevice);
    setDevices(devices);
  }, [twilioDevice]);

  function bindVolumeIndicators(call: Call) {
    call.on("volume", (inputVolume: number, outputVolume: number) => {
      setInputVolume(inputVolume);
      setOutputVolume(outputVolume);
    });
  }

  useEffect(() => {
    if (twilioDevice) {
      getDevices();
    }
  }, [twilioDevice, getDevices]);

  useEffect(() => {
    const initTwilio = async () => {
      const res = await api.post("/twilio/token", {});
      const codecPreferences: any[] = ["opus", "pcmu"];
      const newTwilioDevice = new Device(res.data.token, {
        logLevel: 1,
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

  const disconnectHandler = (connection: Call) => {
    const contactPhone = connection.parameters?.To || connection.parameters?.to;
    const contact = currentBatch.find((c) => c.mobile_phone === contactPhone);
    if (contact && !pendingResultContacts.find((c) => c.id === contact.id)) {
      setPendingResultContacts((prev) => [...prev, contact]);
    }
  };

  useEffect(() => {
    if (twilioDevice) {
      twilioDevice.on("disconnect", disconnectHandler);

      return () => {
        twilioDevice.off("disconnect", disconnectHandler);
      };
    }
  }, [currentBatch]);

  const makeCallBatch = async () => {
    const slice = contacts.slice(currentIndex, currentIndex + callsPerBatch);
    if (slice.length === 0) {
      setIsCampaignFinished(true);
      setIsCampaignRunning(false);
      return;
    }
    // Fetch full contact details for current batch
    const res = await api.post("/contacts/batch", {
      ids: slice,
    });
    const batchContacts = res.data;

    setCurrentBatch(batchContacts);

    await api.post("/campaign/call-campaign", {
      // TO-DO change any to Contact
      phoneNumbers: batchContacts.map((contact: any) => contact.mobile_phone),
    });

    setStatus(`Calling ${batchContacts.length} contact(s)...`);
    setCurrentIndex((prev) => prev + callsPerBatch);

    // TO-DO rewrite this after importing settings and also receiving real-time signal from be
    // about the status of the calls
    pollCampaignStatus();
  };

  const handleStartCampaign = () => {
    setIsCampaignRunning(true);
    setIsCampaignFinished(false);
    setCurrentIndex(0);
    makeCallBatch();
  };

  const handleContinue = () => {
    if (!showContinueDialog) {
      setShowContinueDialog(false);
      makeCallBatch();
    }
  };

  const handleStopCampaign = () => {
    setIsCampaignRunning(false);
    setShowContinueDialog(false);
    setStatus("Campaign manually stopped!");
    api.post("/campaign/stop-campaign");
  };

  // TO-DO change any to Contact or something
  const saveResult = async (contact: any, result: string) => {
    await api.patch(`/contacts/${contact.id}`, {
      result,
      timestamp: Date.now(),
    });
  };

  const maybeProceedWithNextBatch = () => {
    if (isCampaignRunning) {
      handleContinue();
    }
  };

  return (
    <>
      <h1>Dialer</h1>
      <h2>Device</h2>
      <p>Status: {status}</p>
      <button onClick={handleStartCampaign} disabled={isCampaignRunning}>
        Start campaign
      </button>
      <button onClick={handleStopCampaign} disabled={!isCampaignRunning}>
        Stop campaign
      </button>
      <h2>Output speaker devices: </h2>
      <ul>
        {devices &&
          devices.map((device, i) => {
            return (
              <div key={i}>{device.isActive && <li>{device.label}</li>}</div>
            );
          })}
      </ul>
      <h2>Volumes</h2>
      <h3>Input volume: {inputVolume}</h3>
      <h3>Output volume: {outputVolume}</h3>

      {showContinueDialog && pendingResultContacts.length > 0 && (
        <Dialog open>
          <DialogTitle>Call Results</DialogTitle>
          <DialogContent>
            {pendingResultContacts.map((contact) => (
              <div key={contact.id} style={{ marginBottom: "1rem" }}>
                <p>
                  Call with <strong>{contact.name}</strong>
                </p>
                <Select
                  fullWidth
                  value={selectedResults[contact.id] || ""}
                  onChange={(e) =>
                    setSelectedResults((prev) => ({
                      ...prev,
                      [contact.id]: e.target.value,
                    }))
                  }
                >
                  {phoneSettings.callResults.map(
                    (result: { label: string; _id: string }) => (
                      <MenuItem key={result._id} value={result.label}>
                        {result.label}
                      </MenuItem>
                    )
                  )}
                </Select>
              </div>
            ))}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={async () => {
                for (const contact of pendingResultContacts) {
                  const result = selectedResults[contact.id];
                  if (result) {
                    await saveResult(contact, result);
                  }
                }
                setPendingResultContacts([]);
                setSelectedResults({});
                setShowContinueDialog(false);
                maybeProceedWithNextBatch();
              }}
              disabled={pendingResultContacts.some(
                (c) => !selectedResults[c.id]
              )}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {isCampaignFinished && <p>✅ Call campaign completed!</p>}
    </>
  );
};

export default TwilioDevice;
