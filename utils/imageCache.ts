export const imageCache: Record<string,string> = {};

export function getCachedImage(key: string): string | undefined {
  return imageCache[key];
}

export function cacheImage(key: string, url: string) {
  imageCache[key] = url;
} 