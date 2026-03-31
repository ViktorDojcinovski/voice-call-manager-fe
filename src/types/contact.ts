import { Contact as ContactBase } from "voice-javascript-common";

export type PhoneEntry = {
  number?: string | null;
  isBad?: boolean;
  isFavourite?: boolean;
};

export type ContactPhone = {
  mobile?: PhoneEntry;
  company?: PhoneEntry;
  other?: PhoneEntry;
};

type Contact = ContactBase & {
  account?: { id: string; companyName: string; website: string; description: string };
  phone?: ContactPhone;
  primaryPhone?: string;
  [key: string]: unknown;
};

type CallSession = Contact & {
  status: string;
};

export { Contact, CallSession };
