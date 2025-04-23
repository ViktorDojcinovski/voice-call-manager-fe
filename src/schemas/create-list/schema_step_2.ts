import { ButtonAction } from "../../enums/form-buttons-actions";
const schema = {
  title: "LIST FILTERS CONFIGURATION",
  sections: [
    {
      title: "FILTERS",
      fields: [
        {
          type: "dynamic", // custom dynamic field group
          name: "filters",
          label: "Filters",
          addButtonLabel: "Add Filter",
          nestedFields: [
            {
              type: "select",
              name: "field",
              label: "Field",
              options: [
                { label: "City", value: "city" },
                { label: "State", value: "state" },
                { label: "Country", value: "country" },
              ],
            },
            {
              type: "select",
              name: "operator",
              label: "Operator",
              options: [
                { label: "Equals", value: "equals" },
                { label: "Not Equals", value: "notEquals" },
                { label: "Contains", value: "contains" },
              ],
            },
            {
              type: "text",
              name: "value",
              label: "Value",
              placeholder: "Enter value",
            },
          ],
        },
      ],
    },
    {
      title: "CROSS FILTERS",
      fields: [
        {
          type: "dynamic", // another dynamic field group
          name: "crossFilters",
          label: "Cross Filters",
          addButtonLabel: "Add Cross Filter",
          nestedFields: [
            {
              type: "select",
              name: "taskField",
              label: "Task Field",
              options: [
                { label: "Due Date", value: "dueDate" },
                { label: "Priority", value: "priority" },
                { label: "Status", value: "status" },
              ],
            },
            {
              type: "select",
              name: "operator",
              label: "Operator",
              options: [
                { label: "Equals", value: "equals" },
                { label: "Not Equals", value: "notEquals" },
                { label: "Contains", value: "contains" },
              ],
            },
            {
              type: "text",
              name: "value",
              label: "Value",
              placeholder: "Enter value",
            },
          ],
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
        {
          type: "button",
          label: "Previous",
          action: ButtonAction.PREVIOUS,
        },
      ],
    },
  ],
};

export { schema as listFiltersSchema };
