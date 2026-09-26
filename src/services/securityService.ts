import { db } from '../db/db';

export interface PasswordRecord {
  enabled: boolean;
  hash: string;
  salt: string;
  iterations: number;
  createdAt: string;
  updatedAt: string;
}

const PASSWORD_KEY = 'security_password';

export const securityService = {
  // Generate random salt
  generateSalt(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  // Hash password using PBKDF2
  async hashPassword(password: string, salt: string, iterations = 100000): Promise<string> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: enc.encode(salt),
        iterations: iterations,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );

    const exported = await crypto.subtle.exportKey("raw", key);
    const hashBuffer = new Uint8Array(exported);
    return Array.from(hashBuffer).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  // Get current password settings
  async getPasswordRecord(): Promise<PasswordRecord | null> {
    const setting = await db.settings.get(PASSWORD_KEY);
    if (!setting) return null;
    return setting.value as PasswordRecord;
  },

  // Check if password protection is enabled
  async isPasswordEnabled(): Promise<boolean> {
    const record = await this.getPasswordRecord();
    return record?.enabled === true;
  },

  // Verify entered password against stored hash
  async verifyPassword(password: string): Promise<boolean> {
    const record = await this.getPasswordRecord();
    if (!record || !record.enabled) return true; // If disabled, always true

    const hashToVerify = await this.hashPassword(password, record.salt, record.iterations);
    return hashToVerify === record.hash;
  },

  // Set new password
  async setPassword(password: string): Promise<void> {
    const salt = this.generateSalt();
    const iterations = 100000;
    const hash = await this.hashPassword(password, salt, iterations);

    const now = new Date().toISOString();
    const record: PasswordRecord = {
      enabled: true,
      hash,
      salt,
      iterations,
      createdAt: now,
      updatedAt: now,
    };

    await db.settings.put({
      key: PASSWORD_KEY,
      value: record,
      updatedAt: now
    });
  },

  // Disable password
  async disablePassword(): Promise<void> {
    const record = await this.getPasswordRecord();
    if (record) {
      record.enabled = false;
      record.updatedAt = new Date().toISOString();
      await db.settings.put({
        key: PASSWORD_KEY,
        value: record,
        updatedAt: record.updatedAt
      });
    }
  }
};
