/**
 * Formats a phone number for display
 * Converts "8648445391" to "(864) 844-5391"
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");
  
  // Format based on length
  if (cleaned.length === 10) {
    // US format: (XXX) XXX-XXXX
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === "1") {
    // US format with country code: +1 (XXX) XXX-XXXX
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length > 10) {
    // International format: show as-is with + prefix
    return `+${cleaned}`;
  } else if (cleaned.length > 6) {
    // Partial US format: XXX-XXXX
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  } else if (cleaned.length > 3) {
    // Very partial: XXX-X...
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  
  // Return as-is if less than 4 digits
  return cleaned;
}

/**
 * Normalizes a phone number for storage
 * Removes all non-digit characters except leading +
 */
export function normalizePhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "";
  
  const trimmed = phone.trim();
  
  // Keep leading + for international numbers
  if (trimmed.startsWith("+")) {
    return "+" + trimmed.slice(1).replace(/\D/g, "");
  }
  
  // Remove all non-digits for US numbers
  return trimmed.replace(/\D/g, "");
}
