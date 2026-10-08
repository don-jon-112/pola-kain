import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcrypt
 * @param {string} plainPassword
 * @returns {Promise<string>}
 */
export async function hashPassword(plainPassword) {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('Password tidak boleh kosong');
  }
  return await bcrypt.hash(plainPassword.trim(), SALT_ROUNDS);
}

/**
 * Verify a plain text password against a stored password (bcrypt hash or plain fallback)
 * @param {string} plainPassword
 * @param {string} storedPasswordOrHash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(plainPassword, storedPasswordOrHash) {
  if (!plainPassword || !storedPasswordOrHash) return false;
  const cleanPlain = plainPassword.trim();
  const cleanStored = String(storedPasswordOrHash).trim();

  // If stored password is a bcrypt hash ($2a$, $2b$, $2y$)
  if (/^\$2[aby]\$\d{2}\$/.test(cleanStored)) {
    try {
      return await bcrypt.compare(cleanPlain, cleanStored);
    } catch (err) {
      console.error('Error comparing bcrypt password:', err);
      return false;
    }
  }

  // Fallback for legacy unhashed passwords
  return cleanPlain === cleanStored;
}

/**
 * Check if a string is already a bcrypt hash
 * @param {string} str
 * @returns {boolean}
 */
export function isHashed(str) {
  return typeof str === 'string' && /^\$2[aby]\$\d{2}\$/.test(str.trim());
}

