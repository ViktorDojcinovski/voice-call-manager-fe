const schema = {
  title: "CALL MANAGEMENT",
  sections: [
    {
      title: "CONNECTION DEFINITION",
      fields: [
        {
          type: "checkbox",
          name: "connectionDefinition.callConnect",
          label: "After how many seconds a connect is a call",
          nestedField: {
            type: "number",
            name: "connectionDefinition.callTime",
            label: "Seconds",
          },
        },
        {
          type: "button",
          label: "Save",
          action: "submit",
        },
      ],
    },
    {
      title: "PREVENT MULTIPLE CALLS TO THE SAME CONTACT",
      fields: [
        {
          type: "checkbox",
          name: "preventMultiple.mode",
          label: "Ask confirmation for dialing same contact before",
          nestedField: {
            type: "number",
            name: "preventMultiple.preventTime",
            label: "Minutes",
          },
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

export { schema as callManagementSchema };
