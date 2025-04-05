import { useState, useEffect, useCallback } from "react";
import { Device, Call } from "@twilio/voice-sdk";
import api from "../utils/axiosInstance";

interface AudioDevice {
  id: string;
  label: string;
  isActive: boolean;
  type: string;
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
  if (twilioDevice) {
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
  selectedDevices: Set<string>,
  type: string
): Promise<AudioDevice[]> {
  let devices: AudioDevice[] = [];
  device.audio.availableOutputDevices.forEach((device, id) => {
    let isActive = selectedDevices.size === 0 && id === "default";
    selectedDevices.forEach((selectedDevice) => {
      if (selectedDevice === id) {
        isActive = true;
      }
    });

    devices.push({ id, label: device.label, isActive, type });
  });

  return devices;
}

const TwilioDevice = () => {
  const [twilioDevice, setTwilioDevice] = useState<Device | null>(null);
  const [status, setStatus] = useState<string>("Not connected");
  const [devices, setDevices] = useState<AudioDevice[] | null>(null);
  const [inputVolume, setInputVolume] = useState<number>(0);
  const [outputVolume, setOutputVolume] = useState<number>(0);

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
      const res = await api.post("/users/token", {});

      if (!Device) {
        throw new Error("Twilio is not loaded properly!");
      }

      const twilioDevice = new Device(res.data.token, {
        logLevel: 1,
        codecPreferences: ["opus", "pcmu"],
      });

      twilioDevice.on("incoming", (call: Call) => {
        setStatus("Incoming call...");
        bindVolumeIndicators(call);
        call.accept();
      });

      twilioDevice.on("registered", () => {
        setStatus("Twilio device ready to make calls!");
      });

      twilioDevice.on("error", (error: Error) => {
        console.log("Twilio.Device Error: " + error.message);
      });

      setTwilioDevice(twilioDevice);
      twilioDevice.register();
    };

    initTwilio();
  }, []);

  return (
    <>
      <h1>Dialer</h1>
      <h2>Device</h2>
      <p>Status: {status}</p>
      <button
        onClick={() =>
          api.post("/users/call-campaign", {
            phoneNumbers: [],
          })
        }
      >
        Start campaign
      </button>
      <button
        onClick={() => {
          api.post("/users/stop-campaign", {});
        }}
      >
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
    </>
  );
};

export default TwilioDevice;
