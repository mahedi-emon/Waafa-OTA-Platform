import { CircleAlert } from "@/components/icons/server/CircleAlert";
import { LockKeyhole } from "@/components/icons/server/LockKeyhole";

type SignInMessageProps = {
  id?: string;
  tone: "danger" | "warning";
  title: string;
  body?: string;
};

/** The one alert a sign-in step shows: a wrong entry (danger) or a paused sign-in (warning). */
function SignInMessage({ id, tone, title, body }: SignInMessageProps) {
  if (tone === "warning") {
    return (
      <div
        role="alert"
        id={id}
        className="flex gap-3 rounded-2xl border border-warning-800/15 bg-warning-50 p-4 text-warning-800"
      >
        <LockKeyhole aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-semibold">{title}</p>
          {body ? <p className="mt-1 text-[14px] leading-relaxed">{body}</p> : null}
        </div>
      </div>
    );
  }
  return (
    <div
      role="alert"
      id={id}
      className="flex gap-2.5 rounded-2xl border border-danger-700/15 bg-danger-50 p-3.5 text-[14px] text-danger-700"
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-[18px] shrink-0" />
      <div>
        <p className="font-semibold">{title}</p>
        {body ? <p className="mt-0.5">{body}</p> : null}
      </div>
    </div>
  );
}

export { SignInMessage };
