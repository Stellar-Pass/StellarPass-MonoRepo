import crypto from 'crypto';

/**
 * Generate an Ed25519 keypair for QR signing.
 */
export function generateKeypair(): { publicKey: Buffer; privateKey: Buffer } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'der' },
  });
  return { publicKey: publicKey as Buffer, privateKey: privateKey as Buffer };
}

/**
 * Sign data with an Ed25519 private key (DER-encoded).
 */
export function signData(data: string, privateKeyDer: Buffer): Buffer {
  const privateKey = crypto.createPrivateKey({
    key: privateKeyDer,
    format: 'der',
    type: 'pkcs8',
  });
  const signature = crypto.sign(null, Buffer.from(data, 'utf-8'), privateKey);
  return signature;
}

/**
 * Verify an Ed25519 signature with a public key (DER-encoded).
 */
export function verifySignature(
  data: string,
  signature: Buffer,
  publicKeyDer: Buffer,
): boolean {
  const publicKey = crypto.createPublicKey({
    key: publicKeyDer,
    format: 'der',
    type: 'spki',
  });
  return crypto.verify(null, Buffer.from(data, 'utf-8'), publicKey, signature);
}

/**
 * Generate a random hex secret for webhooks or QR tokens.
 */
export function generateSecret(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Derive a Stellar-compatible keypair seed from a private key buffer.
 * Returns the raw 32-byte seed suitable for stellar-sdk Keypair.
 */
export function extractEd25519Seed(privateKeyDer: Buffer): Buffer {
  // PKCS8 DER for Ed25519: last 32 bytes are the seed
  return privateKeyDer.subarray(privateKeyDer.length - 32);
}
