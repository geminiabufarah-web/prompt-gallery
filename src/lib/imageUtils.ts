/**
 * Image processing utilities for in-browser thumbnail generation and format conversion
 */

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function createThumbnail(
  fileOrUrl: File | string,
  maxWidth: number = 400,
  maxHeight: number = 400,
  quality: number = 0.85
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Maintain aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Smooth scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/webp', quality);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, dataUrl });
          } else {
            reject(new Error('Failed to create thumbnail blob'));
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image for thumbnail creation'));

    if (typeof fileOrUrl === 'string') {
      img.src = fileOrUrl;
    } else {
      const url = URL.createObjectURL(fileOrUrl);
      img.src = url;
    }
  });
}
