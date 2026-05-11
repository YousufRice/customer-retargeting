// Minimal logger to reduce terminal noise
// Set LOG_LEVEL=debug in .env to re-enable detailed error logging

const logLevel = process.env.LOG_LEVEL || "silent";

export function logError(_context: string, _error: unknown) {
  if (logLevel === "debug") {
    // eslint-disable-next-line no-console
    console.error(_context, _error);
  }
}