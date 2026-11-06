export const AUTH_CHANGED_EVENT = "psimply:auth-changed";

export function notifyAuthChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}
