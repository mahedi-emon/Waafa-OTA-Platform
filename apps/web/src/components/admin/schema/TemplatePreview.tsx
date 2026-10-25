type TemplatePreviewProps = {
  channel: string;
  subject: string;
  body: string;
  words: { title: string; note: string; subject: string; from: string; length: string };
};

/** A message as it will arrive, with sample details: an email card, or an SMS bubble with its length (D0 R9). */
function TemplatePreview({ channel, subject, body, words }: TemplatePreviewProps) {
  const short = channel === "sms" || channel === "whatsapp";
  return (
    <figure className="mt-1 rounded-2xl border border-mist-200 bg-mist-25 p-4">
      <figcaption className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[13px] font-semibold text-navy-900">{words.title}</span>
        <span className="text-[12.5px] text-mist-600">{words.note}</span>
      </figcaption>
      {short ? (
        <div className="flex flex-col items-start gap-1.5">
          <p className="max-w-sm rounded-2xl rounded-bl-md bg-white px-4 py-2.5 text-[14.5px] leading-relaxed whitespace-pre-line text-ink-900 shadow-xs ring-1 ring-mist-200">
            {body}
          </p>
          <span className="text-[12.5px] text-mist-600 tabular-nums">{words.length}</span>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white ring-1 ring-mist-200">
          <div className="border-b border-mist-100 px-4 py-2.5">
            <p className="text-[12.5px] text-mist-600">{words.from}</p>
            <p className="text-[14.5px] font-semibold text-navy-900">
              <span className="sr-only">{words.subject}: </span>
              {subject}
            </p>
          </div>
          <p className="px-4 py-3 text-[14.5px] leading-relaxed whitespace-pre-line text-ink-900">
            {body}
          </p>
        </div>
      )}
    </figure>
  );
}

export { TemplatePreview };
