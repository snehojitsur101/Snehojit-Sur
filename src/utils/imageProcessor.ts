import { CropArea, DocumentFilter, ImageAdjustments } from '../types';

/**
 * Loads an image from a URL or base64 into an HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!src || typeof src !== 'string') {
      return reject(new Error('Invalid image source'));
    }

    const img = new Image();

    // Only set crossOrigin for remote http(s) URLs, not for data: or blob: URLs
    if (src.startsWith('http://') || src.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      resolve(img);
    };

    img.onerror = () => {
      // If failed with crossOrigin, retry once without crossOrigin
      if (img.crossOrigin) {
        const retry = new Image();
        retry.onload = () => resolve(retry);
        retry.onerror = () => reject(new Error('Failed to load image source'));
        retry.src = src;
      } else {
        reject(new Error('Failed to load image source'));
      }
    };

    img.src = src;
  });
}

/**
 * Reads a File object into a base64 Data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Auto-detects document edges using luminance gradient edge analysis
 */
export async function autoDetectDocumentEdges(sourceUrl: string): Promise<CropArea> {
  try {
    const img = await loadImage(sourceUrl);
    const sampleW = 200;
    const sampleH = Math.round((200 / img.naturalWidth) * img.naturalHeight) || 200;

    const canvas = document.createElement('canvas');
    canvas.width = sampleW;
    canvas.height = sampleH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { x: 0, y: 0, width: 1, height: 1 };

    ctx.drawImage(img, 0, 0, sampleW, sampleH);
    const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
    const data = imgData.data;

    // Helper to get pixel luminance
    const getL = (x: number, y: number) => {
      const idx = (y * sampleW + x) * 4;
      return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    };

    let minX = 0;
    let maxX = sampleW - 1;
    let minY = 0;
    let maxY = sampleH - 1;

    // Scan Top
    for (let y = 0; y < Math.floor(sampleH * 0.35); y++) {
      let variance = 0;
      for (let x = 10; x < sampleW - 10; x += 5) {
        variance += Math.abs(getL(x, y) - getL(x, Math.min(sampleH - 1, y + 4)));
      }
      if (variance > (sampleW / 5) * 18) {
        minY = y;
        break;
      }
    }

    // Scan Bottom
    for (let y = sampleH - 1; y > Math.floor(sampleH * 0.65); y--) {
      let variance = 0;
      for (let x = 10; x < sampleW - 10; x += 5) {
        variance += Math.abs(getL(x, y) - getL(x, Math.max(0, y - 4)));
      }
      if (variance > (sampleW / 5) * 18) {
        maxY = y;
        break;
      }
    }

    // Scan Left
    for (let x = 0; x < Math.floor(sampleW * 0.35); x++) {
      let variance = 0;
      for (let y = 10; y < sampleH - 10; y += 5) {
        variance += Math.abs(getL(x, y) - getL(Math.min(sampleW - 1, x + 4), y));
      }
      if (variance > (sampleH / 5) * 18) {
        minX = x;
        break;
      }
    }

    // Scan Right
    for (let x = sampleW - 1; x > Math.floor(sampleW * 0.65); x--) {
      let variance = 0;
      for (let y = 10; y < sampleH - 10; y += 5) {
        variance += Math.abs(getL(x, y) - getL(Math.max(0, x - 4), y));
      }
      if (variance > (sampleH / 5) * 18) {
        maxX = x;
        break;
      }
    }

    const normX = Math.max(0, Math.min(0.25, minX / sampleW));
    const normY = Math.max(0, Math.min(0.25, minY / sampleH));
    const normMaxX = Math.min(1, Math.max(0.75, (maxX + 1) / sampleW));
    const normMaxY = Math.min(1, Math.max(0.75, (maxY + 1) / sampleH));

    const width = Math.max(0.4, normMaxX - normX);
    const height = Math.max(0.4, normMaxY - normY);

    return {
      x: Number(normX.toFixed(3)),
      y: Number(normY.toFixed(3)),
      width: Number(width.toFixed(3)),
      height: Number(height.toFixed(3)),
    };
  } catch (err) {
    console.warn('Auto edge detection fallback applied:', err);
    return { x: 0, y: 0, width: 1, height: 1 };
  }
}

/**
 * Creates a fast thumbnail data URL
 */
export async function createThumbnail(dataUrl: string, maxDimension = 320): Promise<string> {
  const img = await loadImage(dataUrl);
  let { width, height } = img;
  if (width > height) {
    if (width > maxDimension) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    }
  } else {
    if (height > maxDimension) {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Applies cropping, rotation, adjustments & filters to an image with Ultra-High Resolution preservation
 */
export async function processImage(
  sourceUrl: string,
  settings: ImageAdjustments,
  maxOutputDimension = 4096
): Promise<string> {
  const isDefaultSettings =
    settings.filter === 'original' &&
    (!settings.crop || (settings.crop.x === 0 && settings.crop.y === 0 && settings.crop.width === 1 && settings.crop.height === 1)) &&
    settings.rotation % 360 === 0 &&
    settings.brightness === 0 &&
    settings.contrast === 0 &&
    settings.saturation === 100 &&
    settings.sharpness === 0;

  // If no adjustments, crop, or rotation are applied, preserve 100% original lossless source without re-compression
  if (isDefaultSettings) {
    return sourceUrl;
  }

  const img = await loadImage(sourceUrl);
  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;

  // 1. Handle Cropping if defined
  let sourceX = 0;
  let sourceY = 0;
  let sourceW = origWidth;
  let sourceH = origHeight;

  if (settings.crop) {
    const c = settings.crop;
    sourceX = Math.max(0, Math.round(c.x * origWidth));
    sourceY = Math.max(0, Math.round(c.y * origHeight));
    sourceW = Math.min(origWidth - sourceX, Math.round(c.width * origWidth));
    sourceH = Math.min(origHeight - sourceY, Math.round(c.height * origHeight));
  }

  // Preserve maximum high quality up to 4K resolution
  let scaleFactor = 1;
  if (maxOutputDimension && (sourceW > maxOutputDimension || sourceH > maxOutputDimension)) {
    scaleFactor = maxOutputDimension / Math.max(sourceW, sourceH);
  }
  const targetW = Math.max(10, Math.round(sourceW * scaleFactor));
  const targetH = Math.max(10, Math.round(sourceH * scaleFactor));

  const rot = (settings.rotation % 360 + 360) % 360;
  const isRotated90or270 = rot === 90 || rot === 270;

  const canvas = document.createElement('canvas');
  canvas.width = isRotated90or270 ? targetH : targetW;
  canvas.height = isRotated90or270 ? targetW : targetH;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return sourceUrl;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Handle Rotation
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, -targetW / 2, -targetH / 2, targetW, targetH);
  ctx.restore();

  // If filter is original and only rotation/crop was done, export at maximum JPEG quality 0.98
  const isFilterOriginal =
    settings.filter === 'original' &&
    settings.brightness === 0 &&
    settings.contrast === 0 &&
    settings.saturation === 100 &&
    settings.sharpness === 0;

  if (isFilterOriginal) {
    return canvas.toDataURL('image/jpeg', 0.98);
  }

  // Get pixel buffer for pixel-level enhancement
  let imageData: ImageData | null = null;
  try {
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch (err) {
    console.warn('Canvas pixel manipulation bypassed due to security context:', err);
    return canvas.toDataURL('image/jpeg', 0.98);
  }

  const data = imageData.data;
  const len = data.length;

  const bFactor = settings.brightness * 2.55;
  const cFactor = (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast));
  const sFactor = settings.saturation / 100;
  const filter = settings.filter;

  // Pixel processing loop
  for (let i = 0; i < len; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Manual Brightness & Contrast
    if (settings.brightness !== 0) {
      r += bFactor;
      g += bFactor;
      b += bFactor;
    }

    if (settings.contrast !== 0) {
      r = cFactor * (r - 128) + 128;
      g = cFactor * (g - 128) + 128;
      b = cFactor * (g - 128) + 128;
    }

    // Manual Saturation
    if (settings.saturation !== 100 && filter !== 'bw_clean' && filter !== 'high_contrast') {
      const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
      r = gray + (r - gray) * sFactor;
      g = gray + (g - gray) * sFactor;
      b = gray + (b - gray) * sFactor;
    }

    // Specific Document Scanner Presets
    if (filter === 'magic_color') {
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luminance > 165) {
        const boost = (luminance - 165) / 90;
        r = r + (255 - r) * boost * 0.85;
        g = g + (255 - g) * boost * 0.85;
        b = b + (255 - b) * boost * 0.85;
      } else {
        r = r * 0.92;
        g = g * 0.92;
        b = b * 0.92;
      }
      const avg = (r + g + b) / 3;
      r = r + (r - avg) * 0.2;
      g = g + (g - avg) * 0.2;
      b = b + (b - avg) * 0.2;
    } else if (filter === 'bw_clean') {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      let val = gray;
      if (gray > 140) {
        val = 255;
      } else if (gray < 75) {
        val = 0;
      } else {
        val = ((gray - 75) / (140 - 75)) * 255;
      }
      r = val;
      g = val;
      b = val;
    } else if (filter === 'high_contrast') {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const normalized = gray / 255;
      const curved = Math.pow(normalized, 1.35) * 255;
      const boosted = curved > 180 ? 255 : curved < 70 ? 0 : curved;
      r = boosted;
      g = boosted;
      b = boosted;
    } else if (filter === 'faded_fix') {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const gamma = 1.6;
      let corrected = 255 * Math.pow(gray / 255, 1 / gamma);
      if (corrected > 210) corrected = 255;
      r = corrected;
      g = corrected;
      b = corrected;
    }

    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  // Sharpness Filter (3x3 Convolution) if sharpness > 0 or sharp_photo
  const sharpnessVal = filter === 'sharp_photo' ? Math.max(settings.sharpness, 45) : settings.sharpness;
  if (sharpnessVal > 0) {
    applySharpness(imageData, sharpnessVal / 100);
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.98);
}

/**
 * 3x3 convolution unsharp mask
 */
function applySharpness(imageData: ImageData, amount: number) {
  const w = imageData.width;
  const h = imageData.height;
  const src = new Uint8ClampedArray(imageData.data);
  const dst = imageData.data;

  const k = amount * 0.75;
  const center = 1 + 4 * k;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;

      for (let c = 0; c < 3; c++) {
        const top = src[((y - 1) * w + x) * 4 + c];
        const bottom = src[((y + 1) * w + x) * 4 + c];
        const left = src[(y * w + (x - 1)) * 4 + c];
        const right = src[(y * w + (x + 1)) * 4 + c];
        const mid = src[idx + c];

        const val = mid * center - (top + bottom + left + right) * k;
        dst[idx + c] = Math.max(0, Math.min(255, val));
      }
    }
  }
}
