const schema = {
  title: "CALL RECORDINGS MANAGEMENT",
  sections: [
    {
      title: "ENABLE CALL RECORDINGS",
      fields: [
        {
          type: "checkbox",
          name: "enableCallRecording",
          label: "Enable recording globally for every call",
        },
        {
          type: "button",
          label: "Save",
          action: "submit",
        },
      ],
    },
    {
      title: "EXCLUDE CALLS THAT START WITH",
      fields: [
        {
          type: "text",
          name: "excludePhonesStartingWith",
          label: "",
          placeholder: "Enter an expression here",
        },
        {
          type: "button",
          label: "Save",
          action: "submit",
        },
      ],
    },
    {
      title: "INCLUDE ONLY CALLS THAT START WITH",
      fields: [
        {
          type: "text",
          name: "includeOnlyPhonesStartingWith",
          label: "",
          placeholder: "Enter an expression here",
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

export { schema as recordingsManagementSchema };
