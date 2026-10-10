import "server-only";
import sanitizeHtml from "sanitize-html";

/*
 * Admin rich text allow-list (CLAUDE.md: RichText is one of the two places that set raw HTML). Headings start at h3
 * because pages own their h1 and section h2s; simple tables (cost lists, policy schedules) are allowed; links keep http, https, mailto and tel only and open safely.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "em",
    "b",
    "i",
    "u",
    "a",
    "ul",
    "ol",
    "li",
    "h3",
    "h4",
    "blockquote",
    "hr",
    "table",
    "caption",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    th: ["scope", "colspan", "rowspan"],
    td: ["colspan", "rowspan"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  transformTags: {
    h1: "h3",
    h2: "h3",
    a: (tagName, attribs) => {
      const href = attribs.href ?? "";
      const safe: sanitizeHtml.Attributes = { href };
      if (/^https?:\/\//i.test(href)) {
        safe.target = "_blank";
        safe.rel = "noopener noreferrer";
      }
      return { tagName, attribs: safe };
    },
  },
};

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}
