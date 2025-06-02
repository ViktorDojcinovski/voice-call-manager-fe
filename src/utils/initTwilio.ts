import { Device, Call } from "@twilio/voice-sdk";

import api from "./axiosInstance";

export const initTwilio = async (
  onIncomingHandler: (call: Call) => void,
  onRegisteredHandler: () => void,
  onErrorHandler: (error: Error) => void
) => {
  const identity = "webrtc_user";

  const { data } = await api.post("/twilio/token", { identity });
  const codecPreferences: any[] = ["opus", "pcmu"];
  const newTwilioDevice = new Device(data.token, {
    logLevel: "error",
    codecPreferences,
  });

  newTwilioDevice.on("incoming", onIncomingHandler);
  newTwilioDevice.on("registered", onRegisteredHandler);
  newTwilioDevice.on("error", onErrorHandler);

  return newTwilioDevice;
};
