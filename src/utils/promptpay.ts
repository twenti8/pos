/**
 * Thai PromptPay EMVCo QR Code Payload Generator (BOT Standard)
 * Supports:
 * - 10-digit Thai mobile number (e.g., 0812345678 -> 0066812345678, tag 01)
 * - 13-digit National ID / Tax ID (tag 02)
 * - 15-digit e-Wallet ID (tag 03)
 * Locks exact transaction amount in THB (ISO 4217: 764) with CRC-16/CCITT-FALSE.
 */

function formatTlv(tag: string, value: string): string {
  const length = String(value.length).padStart(2, '0');
  return `${tag}${length}${value}`;
}

export function sanitizePromptPayId(rawId: string): string {
  return rawId.replace(/[^0-9]/g, '');
}

export function isValidPromptPayId(rawId: string): boolean {
  const digits = sanitizePromptPayId(rawId);
  if (digits.length === 10 && digits.startsWith('0')) return true;
  if (digits.length === 11 && digits.startsWith('66')) return true;
  if (digits.length === 13) return true;
  if (digits.length === 15) return true;
  return false;
}

export function computeCrc16CcittFalse(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function generatePromptPayPayload(promptPayId: string, amount?: number): string {
  const digits = sanitizePromptPayId(promptPayId || '0000000000');

  let targetSubTag = '01';
  let targetValue = '';

  if (digits.length >= 15) {
    targetSubTag = '03';
    targetValue = digits.slice(0, 15);
  } else if (digits.length === 13) {
    targetSubTag = '02';
    targetValue = digits;
  } else {
    targetSubTag = '01';
    // Convert Thai mobile 0XXXXXXXXX -> 0066XXXXXXXXX (13 chars)
    const normalizedMobile = digits.startsWith('66')
      ? `00${digits}`
      : digits.startsWith('0')
        ? `0066${digits.slice(1)}`
        : `0066${digits}`;
    targetValue = normalizedMobile.slice(0, 13).padStart(13, '0');
  }

  const hasAmount = typeof amount === 'number' && Number.isFinite(amount) && amount > 0;
  const formattedAmount = hasAmount ? amount.toFixed(2) : '';

  const merchantAccountInfo = [
    formatTlv('00', 'A000000677010111'), // PromptPay AID
    formatTlv(targetSubTag, targetValue),
  ].join('');

  const payloadParts = [
    formatTlv('00', '01'), // Payload Format Indicator
    formatTlv('01', hasAmount ? '12' : '11'), // 12 = Dynamic (locked amount), 11 = Static
    formatTlv('29', merchantAccountInfo), // Merchant Account Information (PromptPay)
    formatTlv('53', '764'), // Transaction Currency (THB)
  ];

  if (hasAmount) {
    payloadParts.push(formatTlv('54', formattedAmount)); // Transaction Amount
  }

  payloadParts.push(formatTlv('58', 'TH')); // Country Code

  const payloadWithoutCrc = `${payloadParts.join('')}6304`;
  const crc = computeCrc16CcittFalse(payloadWithoutCrc);
  return `${payloadWithoutCrc}${crc}`;
}
