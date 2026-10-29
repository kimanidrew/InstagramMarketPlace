export type ErrorArea = "mpesa" | "auth" | "general";

function messageOf(input: unknown): string {
  if (typeof input === "string") return input.trim();
  if (input instanceof Error) return input.message.trim();
  if (input && typeof input === "object" && "message" in input) {
    const value = (input as { message?: unknown }).message;
    if (typeof value === "string") return value.trim();
  }
  return "";
}

/**
 * Converts provider, authentication, and application errors into safe,
 * plain-language messages suitable for customers. Never show raw exceptions
 * or credentials/provider diagnostics directly to users.
 */
export function userFriendlyError(input: unknown, area: ErrorArea = "general"): string {
  const raw = messageOf(input);
  const value = raw.toLowerCase();

  if (area !== "mpesa" && /m-?pesa|daraja|stk push|ds timeout|user cannot be reached/.test(value)) return userFriendlyError(input, "mpesa");
  if (area !== "auth" && /session expired|unauthori[sz]ed|jwt expired|invalid session|token expired/.test(value)) return userFriendlyError(input, "auth");

  if (area === "auth") {
    if (/invalid credentials|incorrect password|wrong password|email or password|user not found|password mismatch|authentication failed/.test(value)) {
      return "The email or password doesn't match our records. Check your details and try again.";
    }
    if (/session expired|unauthori[sz]ed|sign in required|not authenticated|jwt expired|invalid session|token expired/.test(value)) {
      return "Your session has expired. Please sign in again to continue.";
    }
    if (/^admin$|forbidden|access denied|not allowed|admin only|permission denied/.test(value)) {
      return "You don't have permission to do that. If you think this is a mistake, contact support.";
    }
    if (/already exists|unique constraint|p2002/.test(value)) {
      return "An account with these details already exists. Try signing in or use a different email address.";
    }
    if (/password.*8 characters|at least 8 characters/.test(value)) {
      return "Choose a password with at least 8 characters.";
    }
    if (/network|fetch failed|failed to fetch|timeout/.test(value)) {
      return "We couldn't connect securely just now. Check your connection and try again.";
    }
    return "We couldn't complete that account action. Please try again, and contact support if it keeps happening.";
  }

  if (area === "mpesa") {
    if (/1032|request cancelled|cancelled by user|canceled by user/.test(value)) {
      return "The M-Pesa request was cancelled. No payment was completed. You can try again when you're ready.";
    }
    if (/1037|ds timeout|timeout.*user|user.*cannot be reached|unable to reach.*phone|phone.*unreachable|timed out|timeout/.test(value)) {
      return "We couldn't confirm that the M-Pesa prompt reached your phone. Check your M-Pesa messages and balance before trying again. If money was deducted, please contact support.";
    }
    if (/2001|wrong pin|invalid pin|pin.*incorrect/.test(value)) {
      return "M-Pesa couldn't approve that PIN. Check your PIN and try again from your phone.";
    }
    if (/insufficient funds|not enough balance/.test(value)) {
      return "Your M-Pesa balance may be too low for this payment. Check your balance and try again.";
    }
    if (/invalid phone|valid kenyan m-pesa number|phone number/.test(value)) {
      return "Enter a valid Kenyan M-Pesa number, such as 0712 345 678.";
    }
    if (/not configured|missing mpesa|missing daraja|consumer key|consumer secret|passkey|shortcode|callback_url|https url|authenticate with m-pesa|oauth|daraja credentials/.test(value)) {
      return "M-Pesa payments are temporarily unavailable. Please try again later or contact support.";
    }
    if (/price changed|amount changed/.test(value)) {
      return "The price has been updated. Review the new total before continuing to payment.";
    }
    if (/already have.*payment|awaiting confirmation|pending confirmation/.test(value)) {
      return "You already have a payment awaiting confirmation. Check your phone and complete or cancel that request before starting another promotion.";
    }
    if (/payment.*failed|could not start|couldn't start|initiat.*payment|request failed|rejected/.test(value)) {
      return "We couldn't start your M-Pesa payment. Check your phone number and network, then try again. If you received a prompt or money was deducted, check your M-Pesa messages before retrying.";
    }
    return "We couldn't complete the M-Pesa request. Check your phone and network, then try again. If money was deducted, contact support before making another payment.";
  }

  if (!raw) return "Something went wrong. Please try again.";
  if (/sign in required|sign in before|unauthori[sz]ed|session expired|jwt expired/.test(value)) {
    return "Your session has expired. Please sign in again to continue.";
  }
  if (/forbidden|access denied|permission denied|admin only/.test(value)) {
    return "You don't have permission to do that.";
  }
  if (/failed to fetch|fetch failed|networkerror|network request failed|econnreset|etimedout|socket hang up/.test(value)) {
    return "We couldn't connect just now. Check your internet connection and try again.";
  }
  if (/internal server error|prisma|database|sqlstate|stack trace| at [\w.$]+ \(/.test(value)) {
    return "Something went wrong on our side. Please try again in a moment.";
  }
  return raw.length > 220 ? "We couldn't complete that request. Please try again or contact support." : raw;
}
