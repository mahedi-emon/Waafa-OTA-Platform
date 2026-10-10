import { LogoLockup } from "@/components/brand/LogoLockup";

type AdminBrandProps = { name: string; sub: string };

/**
 * The sidebar head (AdminSide board): the page's one WAAFA logo, on a white tile because the logo is only ever shown
 * on light backgrounds (D9), then "Waafa Admin" and the two brands. Rendered on the server.
 */
function AdminBrand({ name, sub }: AdminBrandProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-white/10 px-5 py-4">
      <span className="inline-flex w-fit rounded-xl bg-white px-3 py-2">
        <LogoLockup tagline={false} asLink={false} />
      </span>
      <span className="flex min-w-0 flex-col">
        <b className="truncate font-display text-[15px] font-extrabold text-white">{name}</b>
        <small className="truncate text-[12px] text-white/60">{sub}</small>
      </span>
    </div>
  );
}

export { AdminBrand };
