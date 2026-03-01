/**
 * Upload Validation (WR-WC-039)
 *
 * Validates file uploads by MIME type, size, and file name safety.
 * Prevents malicious file uploads including type confusion attacks
 * (e.g., serving a PHP file with a .jpg extension) and double-extension tricks.
 *
 * @example
 * const result = validateUpload({ type: file.type, size: file.size, name: file.name }, "image");
 * if (!result.valid) {
 *   return NextResponse.json({ error: result.error }, { status: 400 });
 * }
 * const safeName = sanitizeFileName(file.name);
 */

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
];

const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "text/csv",
  "application/zip",
];

const MAX_FILE_SIZES: Record<string, number> = {
  image: 10 * 1024 * 1024,    // 10MB
  video: 500 * 1024 * 1024,   // 500MB
  document: 50 * 1024 * 1024, // 50MB
};

/**
 * Extensions that are dangerous if present anywhere except the final extension.
 * These indicate potential double-extension attacks (e.g., malware.php.jpg).
 */
const DANGEROUS_EXTENSIONS = [
  "php",
  "exe",
  "sh",
  "bat",
  "cmd",
  "ps1",
  "js",
  "html",
  "htm",
];

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a file upload by MIME type, size, and name safety.
 *
 * @param file - File metadata (type, size, name)
 * @param allowedCategory - The category of allowed file types
 * @returns Validation result with an error message if invalid
 */
export function validateUpload(
  file: { type: string; size: number; name: string },
  allowedCategory: "image" | "video" | "document" | "any" = "any"
): UploadValidationResult {
  const allowedTypes =
    allowedCategory === "any"
      ? [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_DOCUMENT_TYPES]
      : allowedCategory === "image"
      ? ALLOWED_IMAGE_TYPES
      : allowedCategory === "video"
      ? ALLOWED_VIDEO_TYPES
      : ALLOWED_DOCUMENT_TYPES;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  const maxSize =
    allowedCategory === "any"
      ? Math.max(...Object.values(MAX_FILE_SIZES))
      : MAX_FILE_SIZES[allowedCategory];

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${maxSize / 1024 / 1024}MB`,
    };
  }

  // Reject zero-byte files
  if (file.size === 0) {
    return {
      valid: false,
      error: "File is empty",
    };
  }

  // Check for double extensions (e.g., file.php.jpg)
  // A safe file has at most one dot separating name from extension.
  const parts = file.name.split(".");
  if (parts.length > 2) {
    const prefixParts = parts.slice(0, -1); // all parts except the final extension
    if (
      prefixParts.some((part) =>
        DANGEROUS_EXTENSIONS.includes(part.toLowerCase())
      )
    ) {
      return {
        valid: false,
        error: "Suspicious file name detected",
      };
    }
  }

  return { valid: true };
}

/**
 * Sanitize a file name for safe storage.
 *
 * - Replaces characters outside [a-zA-Z0-9._-] with underscores
 * - Collapses multiple consecutive dots (path traversal prevention)
 * - Truncates to 255 characters (filesystem limit)
 *
 * @param name - The original file name
 * @returns A sanitized file name safe for use in storage paths
 */
export function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .slice(0, 255);
}
