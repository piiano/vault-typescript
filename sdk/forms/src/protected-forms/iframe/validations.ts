const regexp = {
  objectId: /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
  ccExpiration: /^(0[1-9]|1[0-2])\/([0-9]{2}|[0-9]{4})$/,
  cvv: /^[0-9]{3,4}$/,
  ban: /^[0-9]{5,17}$/,
  usZipCode: /^[0-9]{5}([ -][0-9]{4})?$/,
  ssn: /^[0-9]{3}[ -]?(0[1-9]|[1-9][0-9])[ -]?([1-9][0-9]{3}|[0-9][1-9][0-9]{2}|[0-9]{2}[1-9][0-9]|[0-9]{3}[1-9])$/,
  phoneNumber: /^\+?[1-9]?[0-9]{7,14}$/,
  usBankRouting: /^(([0-9]{9})|([0-9]{4}\/[0-9]{4})|(([0-9]{2})-([0-9]{4})\/([0-9]{4})))$/,
};

export const validations: Record<string, (value: string) => string | null> = {
  STRING: noValidation,
  LONGTEXT: noValidation,
  NAME: noValidation,
  GENDER: noValidation,
  ADDRESS: noValidation,
  CC_HOLDER_NAME: noValidation,
  BLOB: noValidation,
  // We rely on builtin browser's validation for emails, so we don't need to validate it here.
  EMAIL: noValidation,
  EMAIL_STRICT: noValidation,
  OBJECT_ID: (value) => (regexp.objectId.test(value) ? null : 'Invalid Object ID'),
  URL: (value) => (isValidURL(value) ? null : 'Invalid URL'),
  PHONE_NUMBER: (value) => (isValidPhoneNumber(value) ? null : 'Invalid phone number'),
  ZIP_CODE_US: (value) => (regexp.usZipCode.test(value) ? null : 'Invalid zip code'),
  SSN: (value) => (value.length === 11 && regexp.ssn.test(value) ? null : 'Invalid SSN'),
  BAN: (value) => (regexp.ban.test(value) ? null : 'Invalid BAN'),
  TIMESTAMP: (value) => (!isNaN(Date.parse(value)) ? null : 'Invalid timestamp'),
  DATE: (value) => (isValidDate(value) ? null : 'Invalid date'),
  DATE_OF_BIRTH: (value) => (isValidDate(value) ? null : 'Invalid date'),
  CC_NUMBER: (value) => (isValidCardNumber(value) ? null : 'Invalid card number'),
  CC_EXPIRATION_STRING: (value) => (regexp.ccExpiration.test(value) ? null : 'Invalid card expiration'),
  CC_CVV: (value) => (regexp.cvv.test(value) ? null : 'Invalid CVV'),
  US_BANK_ROUTING: (value) => (regexp.usBankRouting.test(value) ? null : 'Invalid routing number'),
  US_BANK_ACCOUNT_NUMBER: (value) => (value !== '' ? null : 'Invalid routing number'),
  TENANT_ID: (value) => (!value.includes(',') ? null : 'Invalid tenant ID'),
};

export function noValidation() {
  return null;
}

function isValidPhoneNumber(value: string) {
  const normalized = value.replace(/-/g, '');
  return regexp.phoneNumber.test(normalized);
}

function isValidURL(value: string) {
  try {
    new URL(value);
    return true;
  } catch (_) {
    return false;
  }
}

function isValidDate(value: string) {
  return new Date(value).toISOString().split('T')[0] === value;
}

function isValidCardNumber(value: string): boolean {
  if (/( {2}|-{2})/.test(value)) {
    return false;
  }

  const normalized = value.replace(/([ -])+/g, '');
  if (!/^[0-9]{13,19}$/.test(normalized)) {
    return false;
  }

  return luhnCheck(normalized);
}

function luhnCheck(cardNumber: string): boolean {
  let checksum = 0;

  const numberLen = cardNumber.length;
  for (let i = numberLen - 1; i >= 0; i -= 2) {
    const n = Number(cardNumber.charAt(i));
    checksum += n;
  }
  for (let i = numberLen - 2; i >= 0; i -= 2) {
    let n = Number(cardNumber.charAt(i));
    n *= 2;
    if (n > 9) {
      n -= 9;
    }
    checksum += n;
  }

  return checksum % 10 == 0;
}
