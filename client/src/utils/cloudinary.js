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
