/** A URL with any `token` query value replaced, for logs (signed file links, issue 232). */
export function redactToken(url: string): string {
  return url.replace(/([?&]token=)[^&#]*/gi, "$1[redacted]");
}
