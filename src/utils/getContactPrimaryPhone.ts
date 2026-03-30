import type { ContactPhone, PhoneEntry } from "../types/contact";

type PhoneObj = {
  mobile?: PhoneEntry;
  company?: PhoneEntry;
  other?: PhoneEntry;
};

function isDialable(entry?: PhoneEntry | null): boolean {
  return !!(entry?.number?.trim() && !entry.isBad);
}

/**
 * Picks the number to dial from structured phone data.
 * Order: non-bad favourite first, then mobile → company → other (skipping bad numbers).
 */
export function pickDialablePhoneFromPhoneObj(obj: PhoneObj): string | null {
  const slots = [
    { e: obj.mobile },
    { e: obj.company },
    { e: obj.other },
  ] as const;

  const fav = slots.find((s) => isDialable(s.e) && s.e?.isFavourite);
  if (fav?.e?.number) return fav.e.number.trim();

  for (const s of slots) {
    if (isDialable(s.e) && s.e?.number) return s.e.number.trim();
  }
  return null;
}

function hasAnyNumber(obj: PhoneObj): boolean {
  return [obj.mobile, obj.company, obj.other].some((e) => e?.number?.trim());
}

function legacyPrimaryPhoneString(contact: { primaryPhone?: unknown }): string | null {
  const p = contact.primaryPhone;
  if (typeof p === "string" && p.trim()) return p.trim();
  return null;
}

/** Explicit dial target (e.g. user picked a slot in campaign UI). Must win over primaryPhone. */
function explicitDialToNumber(contact: { dialToNumber?: unknown }): string | null {
  const d = contact.dialToNumber;
  if (typeof d === "string" && d.trim()) return d.trim();
  return null;
}

/**
 * Returns the primary (dialable) phone number for outbound calls.
 * Bad numbers are never returned. Order: favourite (if not bad), then mobile, company, other.
 * When `phone` is a structured object, it is the source of truth; `primaryPhone` is only used
 * as legacy fallback when it is a string and no slot has a value.
 */
export function getContactPrimaryPhone(contact: {
  phone?: unknown;
  primaryPhone?: unknown;
  dialToNumber?: unknown;
}): string | null {
  const explicit = explicitDialToNumber(contact);
  if (explicit) return explicit;

  const p = contact.phone;
  if (typeof p === "object" && p !== null) {
    const obj = p as PhoneObj;
    const picked = pickDialablePhoneFromPhoneObj(obj);
    if (picked !== null) return picked;
    if (!hasAnyNumber(obj)) {
      const legacy = legacyPrimaryPhoneString(contact);
      if (legacy) return legacy;
    }
    return null;
  }
  const legacy = legacyPrimaryPhoneString(contact);
  if (legacy) return legacy;
  if (typeof p === "string" && p.trim()) return p.trim();
  return null;
}

/**
 * Safe string for UI and comparisons. Never returns a non-string (avoids rendering `phone` objects).
 */
export function getContactPhoneDisplayString(contact: {
  phone?: unknown;
  primaryPhone?: unknown;
  dialToNumber?: unknown;
}): string {
  return getContactPrimaryPhone(contact) ?? "";
}

/**
 * Router state may pass `phone` as a dial string or as structured `{ mobile, company, other }`.
 */
export function coerceRouteStatePhoneToString(phone: unknown): string {
  if (phone == null || phone === "") return "";
  if (typeof phone === "string") return phone.trim();
  if (typeof phone === "object" && phone !== null) {
    return getContactPhoneDisplayString({ phone });
  }
  return "";
}

export type PhoneSlot = "mobile" | "company" | "other";

/** Payload from SplitDialCallButton: include `slot` when user picks a row in the menu. */
export type DialCallPayload = {
  number: string;
  slot?: PhoneSlot;
};

const SLOT_LABELS: Record<PhoneSlot, string> = {
  mobile: "Mobile",
  company: "Company",
  other: "Other",
};

/** Non-bad numbers with labels for call UI (mobile → company → other). */
export function getDialablePhoneMenuOptions(contact: {
  phone?: unknown;
}): { key: PhoneSlot; label: string; number: string }[] {
  const p = contact.phone;
  if (!p || typeof p !== "object") return [];
  const o = p as PhoneObj;
  const keys: PhoneSlot[] = ["mobile", "company", "other"];
  const out: { key: PhoneSlot; label: string; number: string }[] = [];
  for (const key of keys) {
    const e = o[key];
    if (e?.number?.trim() && !e.isBad) {
      out.push({ key, label: SLOT_LABELS[key], number: e.number.trim() });
    }
  }
  return out;
}

/** Single-slot phone payload so the campaign API dials exactly this number. */
export function phoneObjectWithSingleDialSlot(
  slot: PhoneSlot,
  number: string
): ContactPhone {
  const empty = (): PhoneEntry => ({
    number: null,
    isBad: false,
    isFavourite: false,
  });
  return {
    mobile:
      slot === "mobile"
        ? { number, isBad: false, isFavourite: true }
        : empty(),
    company:
      slot === "company"
        ? { number, isBad: false, isFavourite: true }
        : empty(),
    other:
      slot === "other" ? { number, isBad: false, isFavourite: true } : empty(),
  };
}
