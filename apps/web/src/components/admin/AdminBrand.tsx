import Image from "next/image";
import { LogoLockup } from "@/components/brand/LogoLockup";
import { LOGO_QUALITY } from "@/lib/media/imageQuality";
import markImage from "@/assets/brand/waafa-mark.png";

type AdminBrandProps = { name: string; sub: string; markLabel: string };

/**
 * The sidebar head: the page's one WAAFA logo on a white tile (the logo only sits on light backgrounds, D9), with
 * "Waafa Admin" under it. When the sidebar folds to icons only the W mark stays, still on white. Server-rendered.
 */
function AdminBrand({ name, sub, markLabel }: AdminBrandProps) {
  return (
    <div className="flex flex-col gap-2 px-2 pt-2 pb-1">
      <span className="flex w-fit rounded-xl bg-white px-3 py-2 group-data-[collapsible=icon]:hidden">
        <LogoLockup tagline={false} asLink={false} />
      </span>
      <span className="hidden size-8 items-center justify-center rounded-lg bg-white group-data-[collapsible=icon]:flex">
        <Image
          src={markImage}
          alt={markLabel}
          width={66}
          height={40}
          quality={LOGO_QUALITY}
          className="h-4 w-[26px] object-contain"
        />
      </span>
      <span className="flex min-w-0 flex-col px-1 group-data-[collapsible=icon]:hidden">
        <b className="truncate font-display text-[15px] font-extrabold text-white">{name}</b>
        <small className="truncate text-[12px] text-mist-400">{sub}</small>
      </span>
    </div>
  );
}

export { AdminBrand };
