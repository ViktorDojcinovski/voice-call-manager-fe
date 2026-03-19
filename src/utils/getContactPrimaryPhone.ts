type PhoneEntry = {
  number?: string | null;
  isBad?: boolean;
  isFavourite?: boolean;
};

type PhoneObj = {
  mobile?: PhoneEntry;
  company?: PhoneEntry;
  other?: PhoneEntry;
};

/**
 * Returns the primary (dialable) phone number.
 * Selection order: isFavourite first, then mobile -> company -> other.
 */
export function getContactPrimaryPhone(contact: {
  phone?: unknown;
  primaryPhone?: string;
}): string | null {
  if (contact.primaryPhone?.trim()) return contact.primaryPhone.trim();

  const p = contact.phone;
  if (!p) return null;
  if (typeof p === "object" && p !== null) {
    const obj = p as PhoneObj;
    const entries = [
      { ...obj.mobile, key: "mobile" },
      { ...obj.company, key: "company" },
      { ...obj.other, key: "other" },
    ].filter((e) => e?.number?.trim());
    const favourite = entries.find((e) => e.isFavourite);
    if (favourite?.number) return favourite.number.trim();
    return entries[0]?.number?.trim() ?? null;
  }
  return typeof p === "string" && p.trim() ? p.trim() : null;
}
