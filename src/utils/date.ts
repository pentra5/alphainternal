/**
 * Convert a UTC datetime string from the backend to a local Date object.
 * Backend stores datetime.utcnow() but serializes without timezone info,
 * so we append 'Z' to tell JavaScript it's UTC.
 */
export function utcToLocal(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date();

  // WebKit (Safari/Tauri) crashes on 6-digit microseconds (e.g. .123456)
  // We trim it to 3 digits (milliseconds) max.
  let cleanDate = dateStr.replace(/(\.\d{3})\d+/, '$1');

  // If already has timezone info, parse directly
  if (cleanDate.endsWith('Z') || cleanDate.includes('+') || cleanDate.includes('-', 10)) {
    return new Date(cleanDate);
  }
  // Append Z to indicate UTC
  return new Date(cleanDate + 'Z');
}
