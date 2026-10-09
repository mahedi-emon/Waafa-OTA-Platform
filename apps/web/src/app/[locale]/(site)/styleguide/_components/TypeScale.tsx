import { formatTaka } from "@waafa/shared";

/** Type scale specimens (DESIGN.md §3); resize the window to see phone, tablet and desktop sizes. */
function TypeScale() {
  return (
    <div className="grid grid-cols-1 gap-6">
      <p className="type-display text-navy-900">Tell us where.</p>
      <p className="type-h1 text-navy-900">Tour packages from Dhaka</p>
      <p className="type-h2 text-navy-900">Popular destinations</p>
      <p className="type-h3 text-navy-900">Maldives island escape</p>
      <p className="max-w-[60ch] type-lead text-mist-600">
        Compared by our experts and confirmed with you on call or WhatsApp.
      </p>
      <p className="max-w-[60ch] text-base text-ink-900">
        Every search becomes a query our team answers, usually within 30 minutes in office hours.
      </p>
      <p className="type-label text-mist-700">Phone number</p>
      <p className="type-caption text-mist-600">
        Fares are indicative until confirmed by our team.
      </p>
      <p className="font-display text-2xl font-extrabold text-navy-900 tabular-nums">
        07:45 · {formatTaka(58500)} · FLT-261008-0042
      </p>
    </div>
  );
}

export { TypeScale };
