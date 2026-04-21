/**
 * Convert a UTC datetime string from the backend to a local Date object.
 * Backend stores datetime.utcnow() but serializes without timezone info,
 * so we append 'Z' to tell JavaScript it's UTC.
 */
export function utcToLocal(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date();
  // If already has timezone info, parse directly
  if (dateStr.endsWith('Z') || dateStr.includes('+') || dateStr.includes('-', 10)) {
    return new Date(dateStr);
  }
  // Append Z to indicate UTC
  return new Date(dateStr + 'Z');
}
