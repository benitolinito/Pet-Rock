import { parsePhoneNumberFromString } from "libphonenumber-js";

export function normalizePhoneNumber(input: string, defaultCountry = "US") {
  const parsed = parsePhoneNumberFromString(input, defaultCountry);

  if (!parsed?.isValid()) {
    throw new Error("Invalid phone number.");
  }

  return parsed.number;
}
