import { TelephonyConnection, PowerDialerMode } from "voice-javascript-common";

const schema = {
  title: "POWER DIALER MANAGEMENT",
  sections: [
    {
      title: "TELEPHONY CONNECTION",
      fields: [
        {
          type: "radio",
          name: "telephonyConnection",
          label: "TELEPHONY CONNECTION",
          options: [
            { label: "Soft Call", value: TelephonyConnection.SOFT_CALL },
            {
              label: "Parallel Dialing",
              value: TelephonyConnection.PARALLEL_CALL,
            },
          ],
        },
        {
          type: "button",
          label: "Save",
          action: "submit",
        },
      ],
    },
    {
      title: "POWER DIALER CONFIGURATION",
      fields: [
        {
          type: "radio",
          name: "powerDialer.mode",
          label: "POWER DIALER",
          options: [
            {
              label: "Call next record after ending call",
              value: PowerDialerMode.NEXT_AFTER_CALL,
            },
            {
              label: "Wait how many seconds before calling",
              value: PowerDialerMode.WAIT_SECONDS_BEFORE_CALLING,
              nestedField: {
                type: "number",
                name: "powerDialer.waitTime",
                label: "Seconds",
              },
            },
            {
              label:
                "Call next record when currently performed action is finished",
              value: PowerDialerMode.CALL_AFTER_PERFORMED_ACTION,
            },
          ],
        },
        {
          type: "button",
          label: "Save",
          action: "submit",
        },
      ],
    },
  ],
};

export { schema as powerDialerManagementSchema };
