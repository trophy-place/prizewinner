/**
 * Create a timestamp for this moment, in milisseconds, since the Epoch.
 * This helper function ensures that the timestamp for the current moment is created consistently throughout the module.
 *
 * @returns A number of millisseconds since the epoch, January 1st, 1970.
 */
export function nowTimestamp() {
  return Date.now();
}
