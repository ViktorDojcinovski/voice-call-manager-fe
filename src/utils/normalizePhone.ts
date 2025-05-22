import { CountryCode, parsePhoneNumberFromString } from "libphonenumber-js";

const normalizePhone = (phone: string, defaultCountry: string = "US") => {
  const phoneNumber = parsePhoneNumberFromString(
    phone,
    defaultCountry as CountryCode
  );
  return phoneNumber?.isValid() ? phoneNumber.number : null; // returns E.164 or null
};

export { normalizePhone };
