declare global {
  interface Window {
    __authRedirectHash?: string;
    __authRedirectSearch?: string;
  }
}

export function getAuthRedirectType(): string | null {
  const raw = `${window.__authRedirectHash ?? ""} ${window.__authRedirectSearch ?? ""}`;
  const match = /type=([\w_]+)/.exec(raw);
  return match ? match[1] : null;
}
