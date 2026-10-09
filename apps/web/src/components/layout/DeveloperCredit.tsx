/**
 * Developer credit (FR-FTR-06, correction 10): rendered from code, never from admin data, far right of the footer
 * bottom bar on desktop and last, centred, on phones.
 */
function DeveloperCredit({ label }: { label: string }) {
  return (
    <p className="text-[13.5px] text-mist-600">
      {label}{" "}
      <a
        href="https://www.mahedihasanemon.site/"
        target="_blank"
        rel="noopener"
        className="font-semibold text-navy-900 underline decoration-mist-400 underline-offset-4 transition-colors duration-150 hover:decoration-navy-900 focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        Mahedi Hasan Emon
      </a>
    </p>
  );
}

export { DeveloperCredit };
