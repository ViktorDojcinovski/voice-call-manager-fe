import { ButtonAction } from "../../enums/form-buttons-actions";

const schema = {
  title: "LIST SETTINGS",
  sections: [
    {
      fields: [
        {
          type: "text",
          name: "listName",
          label: "List name",
          fullWidth: true,
          required: true,
        },
      ],
    },
    {
      title: "LIST PRIORITY",
      fields: [
        {
          type: "radio",
          name: "listPriority",
          label: "List priority",
          options: [
            { label: "High", value: "high" },
            { label: "Medium", value: "medium" },
            { label: "Low", value: "low" },
          ],
        },
      ],
    },
    {
      fields: [
        {
          type: "text",
          name: "listOwner",
          label: "List owner",
          disabled: true,
        },
      ],
    },
    {
      title: "LIST TYPE",
      fields: [
        {
          type: "radio",
          name: "listType",
          label: "List type",
          options: [
            { label: "Static", value: "static" },
            { label: "Dynamic", value: "dynamic" },
          ],
        },
      ],
    },
    {
      title: "ACTIVATE",
      fields: [
        {
          type: "checkbox",
          name: "listActive",
          label: "List active",
        },
      ],
    },
    {
      title: "RESTRICTIONS",
      fields: [
        {
          type: "checkbox",
          name: "restrictToOwnedLeads",
          label:
            "List users are allowed to work only with leads/contacts they own.",
        },
        {
          type: "checkbox",
          name: "restrictToOwnedAccounts",
          label:
            "List users are allowed to work only with contacts that belong to accounts they own.",
        },
      ],
    },
    {
      title: "LIST SHARING",
      fields: [
        {
          type: "radio",
          name: "listSharing",
          label: "List sharing",
          options: [
            { label: "Not Shared", value: "notShared" },
            { label: "Shared", value: "shared" },
          ],
        },
      ],
    },
    {
      title: "HAS EXIT CRITERIA AND EXIT SETTINGS",
      fields: [
        {
          type: "toggle",
          name: "hasExitCriteria",
        },
      ],
    },
    {
      title: "TAGS",
      fields: [
        {
          type: "text",
          name: "tags",
          label: "Tags",
        },
      ],
    },
    {
      fields: [
        {
          type: "button",
          label: "Next",
          action: ButtonAction.NEXT,
        },
      ],
    },
  ],
};

export { schema as listSettingsSchema };
