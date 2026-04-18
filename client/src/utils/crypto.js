// Web Crypto API utility for Vault E2E Encryption

const SALT_PREFIX = 'diary_vault_salt_';

function bufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derive Key from 6-digit PIN + email/ID
export async function deriveKey(pin, userId) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveKey', 'deriveBits']
  );
  
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(SALT_PREFIX + userId),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, // not extractable
    ['encrypt', 'decrypt']
  );
}

// Encrypt a string -> returns base64 "iv.ciphertext"
export async function encryptText(text, key) {
  if (!text) return text;
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(text)
  );
  
  const b64Iv = bufferToBase64(iv.buffer);
  const b64Cipher = bufferToBase64(cipherBuffer);
  
  return `${b64Iv}.${b64Cipher}`;
}

// Decrypt a string -> returns original text
export async function decryptText(encryptedString, key) {
  if (!encryptedString || !encryptedString.includes('.')) return encryptedString;
  try {
    const [b64Iv, b64Cipher] = encryptedString.split('.');
    
    const ivArray = new Uint8Array(base64ToBuffer(b64Iv));
    const cipherBuffer = base64ToBuffer(b64Cipher);
    
    const plainBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivArray },
      key,
      cipherBuffer
    );
    
    const dec = new TextDecoder();
    return dec.decode(plainBuffer);
  } catch (e) {
    console.error('Decryption failed', e);
    return '*** DECRYPTION FAILED ***';
  }
}

// Encrypt Blob -> returns combined iv+cipher Blob
export async function encryptBlob(fileBlob, key) {
  const arrayBuffer = await fileBlob.arrayBuffer();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    arrayBuffer
  );
  
  return new Blob([iv, cipherBuffer], { type: 'application/octet-stream' });
}

// Decrypt Blob -> returns original Blob
export async function decryptBlob(encryptedBlob, key, mimeType = 'image/jpeg') {
  const arrayBuffer = await encryptedBlob.arrayBuffer();
  
  const iv = arrayBuffer.slice(0, 12);
  const cipherBuffer = arrayBuffer.slice(12);
  
  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    cipherBuffer
  );
  
  const bytes = new Uint8Array(plainBuffer);
  let resolvedType = mimeType;
  if (bytes.length > 4) {
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      resolvedType = 'application/pdf'; // %PDF
    } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      resolvedType = 'image/png';
    } else if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      resolvedType = 'image/jpeg';
    }
  }
  
  return new Blob([plainBuffer], { type: resolvedType });
}
