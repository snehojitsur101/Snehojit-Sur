import { DocumentFilter, ImageAdjustments } from '../types';

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

  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Applies full adjustments & filters to an image and returns processed Data URL
 */
export async function processImage(
  sourceUrl: string,
  settings: ImageAdjustments,
  maxOutputDimension?: number
): Promise<string> {
  const img = await loadImage(sourceUrl);
  let origWidth = img.naturalWidth || img.width;
  let origHeight = img.naturalHeight || img.height;

  // Scale down if requested for performance
  let scaleFactor = 1;
  if (maxOutputDimension && (origWidth > maxOutputDimension || origHeight > maxOutputDimension)) {
    scaleFactor = maxOutputDimension / Math.max(origWidth, origHeight);
  }
  const targetW = Math.round(origWidth * scaleFactor);
  const targetH = Math.round(origHeight * scaleFactor);

  const rot = (settings.rotation % 360 + 360) % 360;
  const isRotated90or270 = rot === 90 || rot === 270;

  const canvas = document.createElement('canvas');
  canvas.width = isRotated90or270 ? targetH : targetW;
  canvas.height = isRotated90or270 ? targetW : targetH;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return sourceUrl;

  // Handle Rotation
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH);
  ctx.restore();

  // If no filters & no adjustments, return fast
  const isDefaultSettings =
    settings.filter === 'original' &&
    settings.brightness === 0 &&
    settings.contrast === 0 &&
    settings.saturation === 100 &&
    settings.sharpness === 0;

  if (isDefaultSettings) {
    return canvas.toDataURL('image/jpeg', 0.95);
  }

  // Get pixel buffer for pixel-level enhancement
  let imageData: ImageData | null = null;
  try {
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch (err) {
    console.warn('Canvas pixel manipulation bypassed due to security context:', err);
    return canvas.toDataURL('image/jpeg', 0.95);
  }

  const data = imageData.data;
  const len = data.length;

  const bFactor = settings.brightness * 2.55; // -255 to +255
  const cFactor = (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast));
  const sFactor = settings.saturation / 100;
  const filter = settings.filter;

  // 1. Pixel processing loop
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
      b = cFactor * (b - 128) + 128;
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
      // Magic Color Document Filter:
      // Whiten grayish background shadows while intensifying ink/text
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luminance > 165) {
        // Highlight background boost to clean white
        const boost = (luminance - 165) / 90;
        r = r + (255 - r) * boost * 0.85;
        g = g + (255 - g) * boost * 0.85;
        b = b + (255 - b) * boost * 0.85;
      } else {
        // Darken text/ink slightly for crisp contrast
        r = r * 0.92;
        g = g * 0.92;
        b = b * 0.92;
      }
      // slight vibrance
      const avg = (r + g + b) / 3;
      r = r + (r - avg) * 0.2;
      g = g + (g - avg) * 0.2;
      b = b + (b - avg) * 0.2;
    } else if (filter === 'bw_clean') {
      // Clean B&W Flatbed Scanner Filter
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      let val = gray;
      // High steep thresholding with gentle anti-aliased knee
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
      // High Contrast Greyscale for Faded Receipts
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      // S-curve contrast
      const normalized = gray / 255;
      const curved = Math.pow(normalized, 1.35) * 255;
      const boosted = curved > 180 ? 255 : curved < 70 ? 0 : curved;
      r = boosted;
      g = boosted;
      b = boosted;
    } else if (filter === 'faded_fix') {
      // Fix Faded & Uneven Lighting
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      // Adaptive gamma
      const gamma = 1.6;
      let corrected = 255 * Math.pow(gray / 255, 1 / gamma);
      if (corrected > 210) corrected = 255;
      r = corrected;
      g = corrected;
      b = corrected;
    }

    // Clamp 0..255
    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  // 2. Sharpness Filter (3x3 Convolution) if sharpness > 0 or sharp_photo
  const sharpnessVal = filter === 'sharp_photo' ? Math.max(settings.sharpness, 45) : settings.sharpness;
  if (sharpnessVal > 0) {
    applySharpness(imageData, sharpnessVal / 100);
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.95);
}

/**
 * 3x3 convolution unsharp mask
 */
function applySharpness(imageData: ImageData, amount: number) {
  const w = imageData.width;
  const h = imageData.height;
  const src = new Uint8ClampedArray(imageData.data);
  const dst = imageData.data;

  // Kernel: [ 0, -k, 0, -k, 1+4k, -k, 0, -k, 0 ]
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
