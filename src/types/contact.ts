type Action = {
  result: string;
  timestamp: string;
  subject?: string;
  _id: string; // MongoDB ObjectId is string when serialized
};

type ContactBase = {
  _id: string;
  userId: string;
  listId: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  mobile_phone: string;
  capacity?: string;
  actions: Action[];
  __v: number;
};

type Contact = ContactBase & {
  [key: string]: unknown; // allow future extensions safely
};

type CallSession = Contact & {
  status: string;
};

export { Contact, CallSession };
