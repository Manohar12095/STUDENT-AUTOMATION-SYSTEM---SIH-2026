import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.EMBEDDING_ENCRYPTION_KEY || '4a8f3c2e1b9d7f6a5c4e3b2a1f9e8d7c6b5a4f3e2d1c9b8a7f6e5d4c3b2a1f90';
const ENCRYPTION_IV = process.env.EMBEDDING_ENCRYPTION_IV || '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d';

/**
 * Encrypts sensitive face embeddings (or data) using AES-256-CBC.
 */
export function encryptEmbedding(data: any): string {
  try {
    const key = Buffer.from(ENCRYPTION_KEY.substring(0, 64), 'hex');
    const iv = Buffer.from(ENCRYPTION_IV.substring(0, 32), 'hex');
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return JSON.stringify(data);
  }
}

/**
 * Decrypts AES-256-CBC encrypted face embeddings.
 */
export function decryptEmbedding(encryptedHex: string): any {
  try {
    const key = Buffer.from(ENCRYPTION_KEY.substring(0, 64), 'hex');
    const iv = Buffer.from(ENCRYPTION_IV.substring(0, 32), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (error) {
    // If not encrypted or failed, try parsing directly
    try {
      return JSON.parse(encryptedHex);
    } catch {
      return null;
    }
  }
}
