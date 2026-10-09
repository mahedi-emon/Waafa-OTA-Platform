import { BrandLoader } from "@/components/brand/BrandLoader";
import { GoldTriangle } from "@/components/brand/GoldTriangle";
import { LogoLockup } from "@/components/brand/LogoLockup";
import { RibbonBand } from "@/components/brand/RibbonBand";
import { RibbonDivider } from "@/components/brand/RibbonDivider";
import { RibbonLine } from "@/components/brand/RibbonLine";
import { Badge } from "@/components/ui/badge";

/** Logo lockup on white and mist-50, the ribbon in its three uses, the gold triangle and the W loader. */
function BrandShowcase() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="grid gap-4 rounded-xl border border-mist-200 bg-white p-6">
        <p className="type-caption text-mist-600">Header lockup on white (tagline from 768 px)</p>
        <LogoLockup />
        <p className="type-caption text-mist-600">Compact (drawers, tight spots)</p>
        <LogoLockup tagline={false} />
      </div>
      <div className="grid gap-4 rounded-xl border border-mist-200 bg-mist-50 p-6">
        <p className="type-caption text-mist-600">
          Footer lockup on mist-50 (never on navy or photos)
        </p>
        <LogoLockup asLink={false} />
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="premium">
            <GoldTriangle />
            Best seller
          </Badge>
          <Badge variant="premium">
            <GoldTriangle />
            Featured
          </Badge>
          <Badge variant="premium">
            <GoldTriangle />
            Group departure
          </Badge>
        </div>
      </div>
      <div className="relative h-40 overflow-hidden rounded-xl bg-mist-50 lg:col-span-2">
        <RibbonBand className="absolute inset-x-0 bottom-0 h-3/4" />
      </div>
      <div className="grid gap-4 rounded-xl border border-mist-200 bg-white p-6">
        <p className="type-caption text-mist-600">Section divider and 3 px line</p>
        <RibbonDivider />
        <RibbonLine className="w-24" />
      </div>
      <div className="grid place-items-center rounded-xl bg-mist-50 p-6">
        <BrandLoader label="Finding fares…" />
      </div>
    </div>
  );
}

export { BrandShowcase };
