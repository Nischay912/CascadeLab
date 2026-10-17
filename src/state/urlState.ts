import LZString from 'lz-string';
import { ArchitectureSpec, validateArchitecture } from '../schema/architecture';

/**
 * Encodes an ArchitectureSpec into a compact URL-safe hash string using lz-string.
 */
export function encodeArchitectureToHash(spec: ArchitectureSpec): string {
  const jsonStr = JSON.stringify(spec);
  const compressed = LZString.compressToEncodedURIComponent(jsonStr);
  return compressed;
}

/**
 * Decodes an encoded hash string back into a validated ArchitectureSpec.
 * Returns null if hash is invalid or missing.
 */
export function decodeArchitectureFromHash(hash: string): ArchitectureSpec | null {
  try {
    const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
    if (!cleanHash) return null;

    const decompressed = LZString.decompressFromEncodedURIComponent(cleanHash);
    if (!decompressed) return null;

    const parsed = JSON.parse(decompressed);
    const validation = validateArchitecture(parsed);
    if (validation.success && validation.data) {
      return validation.data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Updates the browser's URL hash without reloading the page.
 */
export function syncHashToUrl(spec: ArchitectureSpec): void {
  try {
    const hash = encodeArchitectureToHash(spec);
    window.history.replaceState(null, '', `#${hash}`);
  } catch {
    // Graceful fallback for non-browser environments (e.g. tests)
  }
}
