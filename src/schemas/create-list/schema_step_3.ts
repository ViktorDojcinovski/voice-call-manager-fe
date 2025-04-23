import { ButtonAction } from "../../enums/form-buttons-actions";

const schema = {
  title: "LIST EXIT STARTEGY CONFIGURATION",
  sections: [
    {
      title: "Exit startegy",
      fields: [
        {
          type: "text",
          name: "exitStrategy",
          label: "Exit strategy",
          required: true,
        },
        {
          type: "text",
          name: "exitStrategyDescription",
          label: "Description",
          required: true,
        },
      ],
    },
    {
      title: "STEPS",
      fields: [
        {
          type: "dynamic", // custom dynamic field group
          name: "steps",
          label: "Steps",
          addButtonLabel: "Add Step",
          nestedFields: [
            {
              type: "text",
              name: "gap",
              label: "Gap",
              required: true,
            },
            {
              type: "select",
              name: "gapUnit",
              label: "Gap unit",
              options: [
                { label: "Seconds", value: "seconds" },
                { label: "Minutes", value: "minutes" },
                { label: "Hours", value: "hours" },
              ],
              required: true,
            },
            {
              type: "text",
              name: "stepName",
              label: "Step name",
              required: true,
            },
            {
              type: "select",
              name: "stepPriority",
              label: "Step priority",
              options: [
                { label: "High", value: "high" },
                { label: "Medium", value: "medium" },
                { label: "Low", value: "low" },
              ],
            },
          ],
        },
      ],
    },
    {
      fields: [
        {
          type: "button",
          label: "Submit",
          action: ButtonAction.SUBMIT,
        },
        {
          type: "button",
          label: "Previous",
          action: ButtonAction.PREVIOUS,
        },
      ],
    },
  ],
};

export { schema as listExitStrategySchema };
