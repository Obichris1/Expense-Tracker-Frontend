import { AxiosError } from "axios";

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    // Backend explicitly sent a message — trust it
    const serverMessage = error.response?.data?.message;
    if (typeof serverMessage === "string" && serverMessage.trim()) {
      return serverMessage;
    }

    // No response at all — network / CORS / server down
    if (!error.response) {
      return "Can't reach the server. Check your connection and try again.";
    }

    // Response came back but no message field — fall back on status
    switch (error.response.status) {
      case 400:
        return "Some fields look invalid. Please check and try again.";
      case 401:
        return "Invalid email or password.";
      case 403:
        return "You don't have permission to do that.";
      case 429:
        return "Too many attempts. Please wait a moment and try again.";
      case 500:
      case 502:
      case 503:
        return "Server error. Please try again in a moment.";
      default:
        return "Something went wrong. Please try again.";
    }
  }

  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}