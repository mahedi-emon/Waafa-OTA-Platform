import { BRAND_PALETTE, RIBBON_STOPS } from "@/components/brand/brandColors";

/** Palette specimens from globals.css (the only colours that exist in the app). */
function ColorSwatches() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {BRAND_PALETTE.map((swatch) => (
        <li
          key={swatch.name}
          className="overflow-hidden rounded-md border border-mist-200 bg-white"
        >
          <div className={`h-16 ${swatch.className}`} />
          <div className="px-3 py-2.5">
            <p className="text-sm font-semibold text-navy-900">{swatch.name}</p>
            <p className="font-mono text-xs text-mist-600">{swatch.hex}</p>
            <p className="mt-1 text-xs text-mist-600">{swatch.use}</p>
          </div>
        </li>
      ))}
      <li className="col-span-2 overflow-hidden rounded-md border border-mist-200 bg-white sm:col-span-3 lg:col-span-6">
        <div className="h-16 bg-(image:--ribbon)" />
        <p className="px-3 py-2.5 text-sm font-semibold text-navy-900">
          Ribbon gradient, 120°: {RIBBON_STOPS.join(" → ")}
        </p>
      </li>
    </ul>
  );
}

export { ColorSwatches };
