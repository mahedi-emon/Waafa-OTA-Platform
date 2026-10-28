/** The worker writes the time to this Redis key every 30 seconds; the Status page reads it (issue 238). */
export const WORKER_HEARTBEAT_KEY = "waafa:worker:heartbeat";
export const HEARTBEAT_INTERVAL_MS = 30_000;
