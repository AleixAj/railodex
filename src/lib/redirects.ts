/**
 * Where to send someone after logging in. Only paths inside this site are allowed,
 * so a crafted link like /login?next=https://evil.example can't bounce people elsewhere.
 */
export function safeNext(value: unknown): string {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  if (value.startsWith("/login") || value.startsWith("/auth")) return "/";
  return value;
}
