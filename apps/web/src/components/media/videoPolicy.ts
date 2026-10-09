/** The subset of the Network Information API that SmartVideo reads (not available in every browser). */
export type ConnectionInfo = {
  saveData?: boolean;
  effectiveType?: string;
};

const SLOW_CONNECTIONS = new Set(["slow-2g", "2g", "3g"]);

/**
 * Whether a decorative loop may start (MOTION.md §2, SmartVideo): never under reduced motion, never when the
 * visitor asked to save data, and never on a slow connection. Unknown connection info allows playback.
 */
export function canAutoplayVideo(
  connection: ConnectionInfo | undefined,
  prefersReducedMotion: boolean,
): boolean {
  if (prefersReducedMotion) return false;
  if (connection?.saveData) return false;
  if (connection?.effectiveType && SLOW_CONNECTIONS.has(connection.effectiveType)) return false;
  return true;
}
