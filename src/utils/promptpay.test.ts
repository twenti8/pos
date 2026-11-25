import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCrc16CcittFalse,
  generatePromptPayPayload,
  isValidPromptPayId,
  sanitizePromptPayId,
} from './promptpay';

test('CRC-16/CCITT-FALSE matches standard test vector 123456789', () => {
  assert.equal(computeCrc16CcittFalse('123456789'), '29B1');
});

test('sanitizePromptPayId strips dashes and spaces', () => {
  assert.equal(sanitizePromptPayId('081-234-5678'), '0812345678');
  assert.equal(sanitizePromptPayId('1-1007-00123-45-6'), '1100700123456');
});

test('isValidPromptPayId validates Thai mobile, national ID, and e-wallet formats', () => {
  assert.equal(isValidPromptPayId('0812345678'), true);
  assert.equal(isValidPromptPayId('081-234-5678'), true);
  assert.equal(isValidPromptPayId('1100700123456'), true);
  assert.equal(isValidPromptPayId('140000123456789'), true);
  assert.equal(isValidPromptPayId('12345'), false);
});

test('generatePromptPayPayload encodes 10-digit mobile with exact dynamic amount and valid CRC', () => {
  const payload = generatePromptPayPayload('081-234-5678', 315);
  assert.ok(payload.startsWith('000201010212'), 'Dynamic QR must use POI method 12');
  assert.ok(payload.includes('A000000677010111'), 'Must contain PromptPay AID');
  assert.ok(payload.includes('01130066812345678'), 'Mobile must normalize to 0066XXXXXXXXX under tag 01');
  assert.ok(payload.includes('5303764'), 'Currency must be THB (764)');
  assert.ok(payload.includes('5406315.00'), 'Amount must be locked to 315.00');
  assert.ok(payload.includes('5802TH'), 'Country must be TH');

  const body = payload.slice(0, -4);
  const checksum = payload.slice(-4);
  assert.equal(checksum, computeCrc16CcittFalse(body));
});

test('generatePromptPayPayload encodes 13-digit National ID under sub-tag 02', () => {
  const payload = generatePromptPayPayload('1100700123456', 95.5);
  assert.ok(payload.includes('02131100700123456'), '13-digit ID must use sub-tag 02');
  assert.ok(payload.includes('540595.50'), 'Amount must be formatted with 2 decimals');
  const body = payload.slice(0, -4);
  assert.equal(payload.slice(-4), computeCrc16CcittFalse(body));
});
