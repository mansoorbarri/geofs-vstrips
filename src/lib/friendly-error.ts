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

function extractRawMessage(error: unknown): string | null {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (
    typeof error === "number" ||
    typeof error === "boolean" ||
    typeof error === "bigint"
  ) {
    return String(error);
  }

  if (error && typeof error === "object") {
    const message =
      "message" in error && typeof error.message === "string"
        ? error.message
        : "data" in error &&
            error.data &&
            typeof error.data === "object" &&
            "message" in error.data &&
            typeof error.data.message === "string"
          ? error.data.message
          : null;

    if (message) return message;
  }

  return null;
}

function stripConvexPrefixes(message: string): string {
  return message
    .replace(/^\[CONVEX [^\]]+\]\s*/i, "")
    .replace(/^Server Error\s*:?\s*/i, "")
    .trim();
}

function isHumanReadable(message: string): boolean {
  return message.length > 0 && message.length < 200 && !message.includes("\n");
}

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

  const raw = extractRawMessage(error);
  if (!raw) return fallback;

  const normalized = stripConvexPrefixes(raw);

  // Try direct match first
  if (ERROR_MAP[raw]) return ERROR_MAP[raw];
  if (ERROR_MAP[normalized]) return ERROR_MAP[normalized];

  // Convex wraps errors — try to extract the inner message
  // Pattern: "Uncaught Error: <actual message>"
  const uncaughtMatch =
    /Uncaught (?:Error|ConvexError):\s*([\s\S]+)/i.exec(normalized);
  if (uncaughtMatch?.[1]) {
    const inner = uncaughtMatch[1].trim();
    if (ERROR_MAP[inner]) return ERROR_MAP[inner];
    if (isHumanReadable(inner)) return inner;
  }

  if (isHumanReadable(normalized)) return normalized;

  return fallback;
}
