import { TelephonyConnection, PowerDialerMode } from "voice-javascript-common";
import * as z from "zod";

export const validationSchema = z.object({
  telephonyConnection: z.nativeEnum(TelephonyConnection, {
    required_error: "Telephony connection type is required",
  }),
  powerDialer: z.object({
    mode: z.nativeEnum(PowerDialerMode, {
      required_error: "Power Dialer mode is required",
    }),
    waitTime: z
      .number({
        invalid_type_error: "Wait seconds must be a number",
      })
      .min(0, "Wait seconds cannot be negative")
      .optional(),
  }),
});

export { validationSchema as powerDialerManagementValidationSchema };
