const ERROR_MAP: Record<string, string> = {
  "A flight with this callsign already exists.":
    "This callsign is already in use. Please choose a different one.",
  "Flight not found":
    "This flight no longer exists. It may have been deleted.",
  "Unable to generate a unique squawk code":
    "No available squawk codes right now. Please try again.",
  "Not authenticated":
    "You need to sign in to do this.",
  "Called store without authentication":
    "You need to sign in to do this.",
  "Not authorized: admin only":
    "You don't have permission to do this.",
  "Not authorized: super admin only":
    "You don't have permission to do this.",
  "User not found":
    "That user could not be found.",
  "Cannot toggle your own controller status":
    "You can't change your own controller status.",
  "Cannot remove your own admin status":
    "You can't remove your own admin status.",
  "Cannot toggle your own admin status":
    "You can't change your own admin status.",
};

/**
 * Extracts a human-readable error message from a Convex error.
 * Convex errors often come wrapped like:
 *   "[CONVEX M(flights:create)] Uncaught Error: <message>"
 * This function extracts the inner message and maps it to a friendly string.
 */
export function getFriendlyError(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!error) return fallback;

  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : typeof error === "number" ||
            typeof error === "boolean" ||
            typeof error === "bigint"
          ? String(error)
          : fallback;

  // Try direct match first
  if (ERROR_MAP[raw]) return ERROR_MAP[raw];

  // Convex wraps errors — try to extract the inner message
  // Pattern: "Uncaught Error: <actual message>"
  const uncaughtMatch = /Uncaught Error:\s*(.+)/.exec(raw);
  if (uncaughtMatch?.[1]) {
    const inner = uncaughtMatch[1].trim();
    if (ERROR_MAP[inner]) return ERROR_MAP[inner];
    // If the inner message is already human-readable (sentence-like), use it
    if (inner.length < 200 && !inner.includes("\n")) return inner;
  }

  return fallback;
}
