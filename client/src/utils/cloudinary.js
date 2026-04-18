import { decryptBlob } from './crypto';

const sessionFileCache = new Map();

export function hasCachedFile(url) {
  return sessionFileCache.has(url);
}

export function getCachedFile(url) {
  return sessionFileCache.get(url);
}

export async function uploadEncryptedBlobToCloudinary(encryptedBlob) {
  const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary configuration missing. Please check .env file.");
  }

  const formData = new FormData();
  formData.append('file', encryptedBlob);
  formData.append('upload_preset', uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    throw new Error('Failed to upload to Cloudinary');
  }

  const data = await res.json();
  return data.secure_url;
}

export async function downloadEncryptedBlob(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to download encrypted file');
  return await res.blob();
}

const MAX_CACHE_SIZE = 15; // Protect mobile browsers from Out-Of-Memory exceptions

// Securely fetches, decrypts, and perfectly caches the object URL in RAM to instantly eliminate duplicate decryption times
export async function downloadAndDecryptFile(url, vaultKey) {
  if (sessionFileCache.has(url)) {
    return sessionFileCache.get(url);
  }
  
  const blob = await downloadEncryptedBlob(url);
  const decBlob = await decryptBlob(blob, vaultKey);
  
  const cachedResult = {
    objectUrl: URL.createObjectURL(decBlob),
    type: decBlob.type
  };
  
  // LRU Eviction: De-allocate the oldest RAM blob if we strictly exceed our cache limit
  if (sessionFileCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = sessionFileCache.keys().next().value;
    const oldestResult = sessionFileCache.get(oldestKey);
    URL.revokeObjectURL(oldestResult.objectUrl); // Vital for preventing production memory leaks
    sessionFileCache.delete(oldestKey);
  }
  
  sessionFileCache.set(url, cachedResult);
  return cachedResult;
}
