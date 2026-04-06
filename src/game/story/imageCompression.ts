/**
 * Browser-side image compression utility
 * Compresses images to JPEG at specified quality before saving to content pool
 */

const DEFAULT_QUALITY = 0.90; // 90% JPEG quality
const MAX_DIMENSION = 512; // Max width/height for portraits

/**
 * Compress an image URL to a smaller JPEG data URL
 * @param imageUrl - The source image URL
 * @param quality - JPEG quality (0-1), defaults to 0.90
 * @param maxDimension - Max width/height, defaults to 512
 * @returns Compressed data URL or original URL if compression fails
 */
export async function compressImageUrl(
  imageUrl: string,
  quality: number = DEFAULT_QUALITY,
  maxDimension: number = MAX_DIMENSION
): Promise<string> {
  // Skip if already a data URL (already compressed)
  if (imageUrl.startsWith('data:')) {
    return imageUrl;
  }

  try {
    // Load the image
    const img = await loadImage(imageUrl);
    
    // Calculate scaled dimensions
    let width = img.width;
    let height = img.height;
    
    if (width > maxDimension || height > maxDimension) {
      const ratio = Math.min(maxDimension / width, maxDimension / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }
    
    // Create canvas and draw scaled image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('[Compress] Canvas context unavailable');
      return imageUrl;
    }
    
    ctx.drawImage(img, 0, 0, width, height);
    
    // Compress to JPEG
    const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
    
    // Log compression stats
    const compressedSize = compressedDataUrl.length;
    
    console.log(`[Compress] ${width}x${height} @ ${quality * 100}% quality`);
    console.log(`[Compress] Data URL size: ${(compressedSize / 1024).toFixed(1)}KB`);
    
    return compressedDataUrl;
  } catch (error) {
    console.warn('[Compress] Failed to compress image:', error);
    return imageUrl;
  }
}

/**
 * Load an image from URL and return as HTMLImageElement
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Enable CORS for CDN images
    
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    
    img.src = url;
  });
}

/**
 * Compress image to blob for upload
 * @returns Blob of compressed JPEG
 */
export async function compressImageToBlob(
  imageUrl: string,
  quality: number = DEFAULT_QUALITY,
  maxDimension: number = MAX_DIMENSION
): Promise<Blob | null> {
  if (imageUrl.startsWith('data:')) {
    // Convert data URL to blob
    const response = await fetch(imageUrl);
    return response.blob();
  }

  try {
    const img = await loadImage(imageUrl);
    
    let width = img.width;
    let height = img.height;
    
    if (width > maxDimension || height > maxDimension) {
      const ratio = Math.min(maxDimension / width, maxDimension / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(img, 0, 0, width, height);
    
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/jpeg',
        quality
      );
    });
  } catch (error) {
    console.warn('[Compress] Failed to compress to blob:', error);
    return null;
  }
}

/**
 * Get estimated file size of a data URL in KB
 */
export function getDataUrlSizeKB(dataUrl: string): number {
  // Data URLs are base64 encoded, so actual binary size is ~75% of string length
  const base64Length = dataUrl.split(',')[1]?.length || 0;
  return Math.round((base64Length * 0.75) / 1024);
}
