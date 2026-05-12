import { getCountries, getCountryCallingCode } from 'libphonenumber-js';

export type CountryCodeOption = {
  iso: string;
  name: string;
  dialCode: string;
  label: string;
};

const regionNames =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

export const COUNTRY_CODE_OPTIONS: CountryCodeOption[] = getCountries().map((iso) => {
  const dialCode = `+${getCountryCallingCode(iso)}`;
  const name = regionNames?.of(iso) || iso;
  return {
    iso,
    name,
    dialCode,
    label: `${name} (${iso}) ${dialCode}`,
  };
});

export const COUNTRY_DIAL_CODES_DESC = Array.from(
  new Set(COUNTRY_CODE_OPTIONS.map((option) => option.dialCode))
).sort((a, b) => b.length - a.length);
