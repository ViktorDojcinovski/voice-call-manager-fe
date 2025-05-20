import { Contact } from "../types/contact";

interface Step {
  id: string;
  stepName: string;
  contacts: Contact[];
  defaultAction: string;
}

export { Step };
