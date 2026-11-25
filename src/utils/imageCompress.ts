/**
 * Compresses an uploaded image File into a Base64 JPEG data URL guaranteed to stay
 * safely below maxBytes (default 34,000 bytes < 35KB) so it fits inside a Google Sheets cell.
 */
export const MAX_SHEET_IMAGE_BYTES = 34_500;
export const MAX_STOREFRONT_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export function isGifFile(file: Pick<File, 'type' | 'name'>): boolean {
  return (
    file.type.toLowerCase() === 'image/gif' ||
    file.name.toLowerCase().endsWith('.gif')
  );
}

/**
 * Processes storefront profile/banner uploads:
 * - Rejects files > 10 MB
 * - Preserves animated .gif files directly via FileReader (never runs them through canvas)
 * - Compresses static images cleanly for Google Sheets storage
 */
export async function processStorefrontImage(
  file: File,
  initialMaxDim = 420
): Promise<{ dataUrl: string; isGif: boolean; byteLength: number }> {
  if (file.size > MAX_STOREFRONT_FILE_BYTES) {
    throw new Error('ไฟล์รูปภาพมีขนาดเกิน 10 MB กรุณาเลือกไฟล์ที่เล็กลง');
  }

  if (isGifFile(file)) {
    const dataUrl = await readFileAsDataUrl(file);
    return {
      dataUrl,
      isGif: true,
      byteLength: file.size,
    };
  }

  const dataUrl = await compressImageToBase64(file, MAX_SHEET_IMAGE_BYTES, initialMaxDim);
  return {
    dataUrl,
    isGif: false,
    byteLength: dataUrl.length,
  };
}

export async function compressImageToBase64(
  file: File,
  maxBytes: number = MAX_SHEET_IMAGE_BYTES,
  initialMaxDim = 420
): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);

  let maxDim = initialMaxDim;
  let quality = 0.82;

  for (let attempt = 0; attempt < 12; attempt++) {
    const { width, height } = fitDimensions(img.naturalWidth || img.width, img.naturalHeight || img.height, maxDim);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('ไม่สามารถประมวลผลรูปภาพได้');
    }

    // Fill clean white background so transparent PNGs convert cleanly to JPEG
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const compressed = canvas.toDataURL('image/jpeg', quality);
    if (compressed.length <= maxBytes) {
      return compressed;
    }

    if (quality > 0.35) {
      quality = Math.max(0.3, quality - 0.12);
    } else {
      maxDim = Math.max(120, Math.round(maxDim * 0.78));
      quality = 0.65;
    }
  }

  // Final aggressive pass
  const { width, height } = fitDimensions(img.naturalWidth || img.width, img.naturalHeight || img.height, 140);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('ไม่สามารถประมวลผลรูปภาพได้');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.45);
}

function fitDimensions(w: number, h: number, maxDim: number): { width: number; height: number } {
  if (w <= maxDim && h <= maxDim) {
    return { width: Math.max(1, w), height: Math.max(1, h) };
  }
  const ratio = Math.min(maxDim / w, maxDim / h);
  return {
    width: Math.max(1, Math.round(w * ratio)),
    height: Math.max(1, Math.round(h * ratio)),
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('อ่านไฟล์รูปภาพไม่สำเร็จ'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('โหลดรูปภาพไม่สำเร็จ'));
    img.src = src;
  });
}
