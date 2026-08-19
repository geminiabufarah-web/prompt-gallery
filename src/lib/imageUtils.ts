import { ImageCompressionSettings } from '../types';

/**
 * Image processing utilities for in-browser thumbnail generation and format conversion to WebP.
 * Compresses and converts images client-side before uploading to optimize bandwidth and storage.
 */

export const DEFAULT_COMPRESSION_SETTINGS: ImageCompressionSettings = {
  quality: 0.85,
  maxWidth: 2048,
  thumbnailQuality: 0.80,
};

export const COMPRESSION_STORAGE_KEY = 'prompt_gallery_compression_settings';

export function getSavedCompressionSettings(): ImageCompressionSettings {
  try {
    const raw = localStorage.getItem(COMPRESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        quality: typeof parsed.quality === 'number' ? parsed.quality : DEFAULT_COMPRESSION_SETTINGS.quality,
        maxWidth: typeof parsed.maxWidth === 'number' ? parsed.maxWidth : DEFAULT_COMPRESSION_SETTINGS.maxWidth,
        thumbnailQuality: typeof parsed.thumbnailQuality === 'number' ? parsed.thumbnailQuality : DEFAULT_COMPRESSION_SETTINGS.thumbnailQuality,
      };
    }
  } catch (err) {
    console.warn('Failed to load saved compression settings:', err);
  }
  return DEFAULT_COMPRESSION_SETTINGS;
}

export function saveCompressionSettings(settings: ImageCompressionSettings): void {
  try {
    localStorage.setItem(COMPRESSION_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save compression settings:', err);
  }
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Loads an image from File, Blob, or URL into an HTMLImageElement
 */
function loadImage(fileOrUrl: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('فشل في قراءة ملف الصورة'));

    if (typeof fileOrUrl === 'string') {
      img.src = fileOrUrl;
    } else {
      img.src = URL.createObjectURL(fileOrUrl);
    }
  });
}

/**
 * Compresses and converts any image format to WebP with custom maximum dimensions and quality.
 *
 * @param fileOrUrl - The source image File, Blob, or URL
 * @param maxWidth - Maximum allowed width in pixels (0 means keep original width)
 * @param maxHeight - Maximum allowed height in pixels (0 means keep original height)
 * @param quality - WebP compression quality from 0.0 to 1.0 (default: 0.85)
 */
export async function compressAndConvertToWebP(
  fileOrUrl: File | Blob | string,
  maxWidth: number = 2048,
  maxHeight: number = 2048,
  quality: number = 0.85
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  const img = await loadImage(fileOrUrl);

  let { width, height } = img;

  // Maintain aspect ratio if image dimensions exceed maximums (when maxWidth/maxHeight > 0)
  if ((maxWidth > 0 && width > maxWidth) || (maxHeight > 0 && height > maxHeight)) {
    const targetMaxWidth = maxWidth > 0 ? maxWidth : width;
    const targetMaxHeight = maxHeight > 0 ? maxHeight : height;
    const ratio = Math.min(targetMaxWidth / width, targetMaxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context is not available');
  }

  // High quality interpolation
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  const clampedQuality = Math.max(0.1, Math.min(1.0, quality));
  const dataUrl = canvas.toDataURL('image/webp', clampedQuality);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) {
          resolve(b);
        } else {
          reject(new Error('Failed to create WebP blob'));
        }
      },
      'image/webp',
      clampedQuality
    );
  });

  return { blob, dataUrl, width, height };
}

/**
 * Generates a lightweight WebP thumbnail (default 400x400 max, 80% quality) for grid and card views.
 */
export async function createThumbnail(
  fileOrUrl: File | Blob | string,
  maxWidth: number = 400,
  maxHeight: number = 400,
  quality: number = 0.80
): Promise<{ blob: Blob; dataUrl: string }> {
  const res = await compressAndConvertToWebP(fileOrUrl, maxWidth, maxHeight, quality);
  return { blob: res.blob, dataUrl: res.dataUrl };
}
