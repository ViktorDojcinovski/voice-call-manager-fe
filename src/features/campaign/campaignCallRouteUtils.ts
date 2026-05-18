import { CallSession, Contact } from "../../types/contact";

export interface CampaignLocationState {
  contacts?: Contact[];
  mode?: import("voice-javascript-common").TelephonyConnection;
  contactId?: string;
  phone?: string | unknown;
  defaultDisposition?: string;
  autoStart?: boolean;
  listId?: string;
}

/** Read `contactId` from the hash only (direct load: `/#/path?contactId=`). */
export function getContactIdFromHashOnly(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const raw = window.location.hash.replace(/^#/, "");
  const q = raw.indexOf("?");
  if (q >= 0) {
    const v = new URLSearchParams(raw.slice(q)).get("contactId")?.trim();
    if (v) return v;
  }
  const m = window.location.hash.match(/[?&]contactId=([^&]+)/);
  if (m?.[1]) {
    try {
      return decodeURIComponent(m[1]).trim();
    } catch {
      return m[1].trim();
    }
  }
  return undefined;
}

export function getCampaignContactIdFromLocation(location: {
  search: string;
}): string | undefined {
  const fromRouter = new URLSearchParams(location.search).get("contactId");
  if (fromRouter) return fromRouter.trim();

  if (typeof window === "undefined") return undefined;

  const beforeHash = new URLSearchParams(window.location.search).get("contactId");
  if (beforeHash) return beforeHash.trim();

  return getContactIdFromHashOnly();
}

export function getCampaignSearchString(location: { search: string }): string {
  if (location.search) return location.search;
  if (typeof window === "undefined") return "";
  const raw = window.location.hash.replace(/^#/, "");
  const q = raw.indexOf("?");
  return q >= 0 ? raw.slice(q) : "";
}

export function getContactRecordId(
  c: CallSession | Contact | null | undefined
): string {
  if (!c || typeof c !== "object") return "";
  const o = c as Record<string, unknown>;
  const raw = o.id ?? o._id;
  return raw != null ? String(raw) : "";
}

export function normalizeContactPayload(data: unknown): CallSession {
  const o = (data && typeof data === "object" ? data : {}) as Record<
    string,
    unknown
  >;
  const id = o.id ?? o._id;
  return { ...o, id: id != null ? String(id) : undefined } as CallSession;
}
