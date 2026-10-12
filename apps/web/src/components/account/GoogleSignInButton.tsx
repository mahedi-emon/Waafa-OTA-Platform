import { GoogleMark } from "@/components/brand/GoogleMark";
import { GOOGLE_START_PATH } from "@/lib/account/googleOAuth";

type GoogleSignInButtonProps = {
  label: string;
  /** Where to go after signing in (a path on this site). */
  next?: string;
};

/**
 * "Continue with Google" (issue 134), styled by Google's sign-in branding rules: white, a thin border, the
 * unaltered G and the words. A plain link: the start route sets the PKCE cookie and redirects to Google.
 */
function GoogleSignInButton({ label, next }: GoogleSignInButtonProps) {
  const href = next ? `${GOOGLE_START_PATH}?next=${encodeURIComponent(next)}` : GOOGLE_START_PATH;
  return (
    <a
      href={href}
      rel="nofollow"
      className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-full border border-mist-300 bg-white px-5 text-[16px] font-semibold text-ink-900 shadow-sm transition-colors duration-150 outline-none hover:bg-mist-50 focus-visible:ring-3 focus-visible:ring-ring/40"
    >
      <GoogleMark className="size-5 shrink-0" />
      {label}
    </a>
  );
}

export { GoogleSignInButton };
