/**
 * File validation utilities for secure file uploads
 */

// Allowed image MIME types and their magic bytes
const ALLOWED_IMAGE_TYPES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header (WebP starts with RIFF....WEBP)
} as const;

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFilename?: string;
}

/**
 * Validates a file for secure upload
 * - Checks file size
 * - Validates extension against whitelist
 * - Verifies magic bytes match declared type
 * - Sanitizes filename
 */
export async function validateImageFile(file: File): Promise<FileValidationResult> {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Il file deve essere inferiore a 5MB.' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'Il file è vuoto.' };
  }

  // Extract and validate extension
  const nameParts = file.name.split('.');
  if (nameParts.length < 2) {
    return { valid: false, error: 'Il file deve avere un\'estensione valida.' };
  }

  const extension = nameParts[nameParts.length - 1].toLowerCase();
  
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { 
      valid: false, 
      error: `Estensione non consentita. Usa: ${ALLOWED_EXTENSIONS.join(', ')}` 
    };
  }

  // Check for double extensions (e.g., file.php.jpg)
  if (nameParts.length > 2) {
    const suspiciousExtensions = ['php', 'exe', 'js', 'html', 'htm', 'svg', 'xml'];
    const hasDoubleExtension = nameParts.slice(0, -1).some(part => 
      suspiciousExtensions.includes(part.toLowerCase())
    );
    if (hasDoubleExtension) {
      return { valid: false, error: 'Nome file non valido.' };
    }
  }

  // Validate MIME type
  const declaredType = file.type;
  if (!Object.keys(ALLOWED_IMAGE_TYPES).includes(declaredType)) {
    return { 
      valid: false, 
      error: 'Tipo di file non consentito. Usa immagini JPG, PNG o WEBP.' 
    };
  }

  // Verify magic bytes match declared type
  const magicBytesValid = await verifyMagicBytes(file, declaredType as keyof typeof ALLOWED_IMAGE_TYPES);
  if (!magicBytesValid) {
    return { 
      valid: false, 
      error: 'Il contenuto del file non corrisponde al tipo dichiarato.' 
    };
  }

  // Sanitize filename
  const sanitizedFilename = sanitizeFilename(file.name, extension);

  return { valid: true, sanitizedFilename };
}

/**
 * Reads the first bytes of a file and verifies they match expected magic bytes
 */
async function verifyMagicBytes(
  file: File, 
  expectedType: keyof typeof ALLOWED_IMAGE_TYPES
): Promise<boolean> {
  const expectedBytes = ALLOWED_IMAGE_TYPES[expectedType];
  
  try {
    const buffer = await file.slice(0, expectedBytes.length).arrayBuffer();
    const fileBytes = new Uint8Array(buffer);
    
    // For WebP, we need to check RIFF header and also verify WEBP at offset 8
    if (expectedType === 'image/webp') {
      if (fileBytes.length < 4) return false;
      
      // Check RIFF header
      const riffMatch = expectedBytes.every((byte, index) => fileBytes[index] === byte);
      if (!riffMatch) return false;
      
      // Also check for WEBP signature at offset 8
      const webpBuffer = await file.slice(8, 12).arrayBuffer();
      const webpBytes = new Uint8Array(webpBuffer);
      const webpSignature = [0x57, 0x45, 0x42, 0x50]; // "WEBP"
      return webpSignature.every((byte, index) => webpBytes[index] === byte);
    }
    
    return expectedBytes.every((byte, index) => fileBytes[index] === byte);
  } catch {
    return false;
  }
}

/**
 * Sanitizes a filename by removing special characters and encoding
 */
function sanitizeFilename(originalName: string, extension: string): string {
  // Remove the extension and any path components
  const baseName = originalName
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace special chars with underscore
    .replace(/_+/g, '_') // Collapse multiple underscores
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
    .slice(0, 50); // Limit length
  
  // Generate a unique filename
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  
  return `${baseName || 'image'}_${timestamp}_${randomSuffix}.${extension}`;
}

/**
 * Get the Content-Type header for an extension
 */
export function getContentTypeForExtension(extension: string): string {
  const types: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
  };
  return types[extension.toLowerCase()] || 'application/octet-stream';
}
