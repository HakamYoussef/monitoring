import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);
const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

function bufferEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH).toString('hex');
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  const [salt, storedKeyHex] = hashed.split(':');
  if (!salt || !storedKeyHex) {
    return false;
  }

  try {
    const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
    const storedKey = Buffer.from(storedKeyHex, 'hex');
    return bufferEqual(derivedKey, storedKey);
  } catch (error) {
    console.error('Password verification failed:', error);
    return false;
  }
}
