import QRCode from 'qrcode';
import crypto from 'crypto';
import { signData, verifySignature } from './crypto';
import type { QRPayload } from '@stellar-pass/shared';

// Re-export with local alias for backward compatibility
export type QRPayloadData = QRPayload;

/**
 * Build a QR payload string (JSON) with a signature appended.
 */
export function buildQRPayload(
  data: QRPayloadData,
  privateKeyDer: Buffer,
): string {
  const json = JSON.stringify(data);
  const signature = signData(json, privateKeyDer);
  return JSON.stringify({
    data,
    sig: signature.toString('base64'),
  });
}

/**
 * Parse and verify a QR payload string.
 * Returns the payload data if valid, throws if tampered or expired.
 */
export function verifyQRPayload(
  payload: string,
  publicKeyDer: Buffer,
): QRPayloadData {
  const parsed = JSON.parse(payload) as { data: QRPayloadData; sig: string };
  const signature = Buffer.from(parsed.sig, 'base64');
  const json = JSON.stringify(parsed.data);
  const valid = verifySignature(json, signature, publicKeyDer);

  if (!valid) {
    throw new Error('QR signature verification failed');
  }

  if (Date.now() / 1000 > parsed.data.expires_at) {
    throw new Error('QR code has expired');
  }

  return parsed.data;
}

/**
 * Generate a QR code as a data URL (base64 PNG).
 */
export async function generateQRDataURL(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 300,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
}

/**
 * Generate a unique nonce for QR payloads.
 */
export function generateNonce(): string {
  return crypto.randomUUID();
}
