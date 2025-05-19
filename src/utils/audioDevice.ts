import { Device } from "@twilio/voice-sdk";

import { AudioDevice } from "../interfaces/audio-device";

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

export { getAudioDevices };
