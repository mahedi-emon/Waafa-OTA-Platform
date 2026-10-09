const swatches = [
  {
    name: "midnight-950",
    hex: "#020D39",
    use: "Dark bands, admin sidebar",
    className: "bg-midnight-950",
  },
  { name: "navy-900", hex: "#00185B", use: "Headings, navy buttons", className: "bg-navy-900" },
  { name: "royal-800", hex: "#01278B", use: "Pressed", className: "bg-royal-800" },
  { name: "brand-700", hex: "#003FBE", use: "Hover, links", className: "bg-brand-700" },
  { name: "electric-600", hex: "#0053D7", use: "Primary, focus", className: "bg-electric-600" },
  { name: "sky-500", hex: "#0D8CEE", use: "Icons, charts", className: "bg-sky-500" },
  { name: "cyan-400", hex: "#39CCE9", use: "Highlights on dark", className: "bg-cyan-400" },
  { name: "gold-600", hex: "#A8782F", use: "Triangle marker only", className: "bg-gold-600" },
  { name: "silver-300", hex: "#D7D3D0", use: "Edges on dark", className: "bg-silver-300" },
  { name: "ink-900", hex: "#0E1424", use: "Text", className: "bg-ink-900" },
  { name: "mist-600", hex: "#556078", use: "Secondary text", className: "bg-mist-600" },
  { name: "mist-300", hex: "#CDD5E2", use: "Input borders", className: "bg-mist-300" },
  { name: "mist-200", hex: "#E3E8F0", use: "Hairlines", className: "bg-mist-200" },
  { name: "mist-50", hex: "#F6F8FB", use: "Panels, footer", className: "bg-mist-50" },
  { name: "success-600", hex: "#0B7A54", use: "Booked, in stock", className: "bg-success-600" },
  { name: "warning-700", hex: "#A15C07", use: "Pending, low stock", className: "bg-warning-700" },
  { name: "danger-600", hex: "#C2261D", use: "Errors", className: "bg-danger-600" },
  { name: "whatsapp-700", hex: "#0E7A47", use: "WhatsApp", className: "bg-whatsapp-700" },
] as const;

/** Palette specimens from globals.css (the only colours that exist in the app). */
function ColorSwatches() {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {swatches.map((swatch) => (
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
          Ribbon gradient, 120°: #020D39 → #003FBE → #0D8CEE → #39CCE9
        </p>
      </li>
    </ul>
  );
}

export { ColorSwatches };
