import { ImageResponse } from "next/og";
import { RIBBON_STOPS } from "@/components/brand/brandColors";
import { getVisaCountry, listVisaCountries } from "@/lib/data/visa";

export const SIZE = { width: 1200, height: 630 } as const;

export async function generateStaticParams() {
  const countries = await listVisaCountries();
  return countries
    .filter((country) => !country.cover)
    .map((country) => ({ slug: `${country.slug}.png` }));
}

/**
 * The share image for a visa country without its own photo (issue 287): the country's name in the brand colours, no
 * picture at all (real photos only, so nothing is drawn). Countries with a photo share that photo instead.
 */
export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  // "india.png": the extension keeps the address out of the locale proxy, like the sitemap files.
  const { slug } = await context.params;
  const country = slug.endsWith(".png") ? await getVisaCountry(slug.slice(0, -4)) : null;
  if (!country) return new Response("Not found", { status: 404 });
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: `linear-gradient(135deg, ${RIBBON_STOPS[0]} 0%, ${RIBBON_STOPS[1]} 70%, ${RIBBON_STOPS[2]} 100%)`,
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 6 }}>WAAFA</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ fontSize: 30, color: RIBBON_STOPS[3] }}>Visa processing from Dhaka</div>
        <div
          style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.05 }}
        >{`${country.name} visa`}</div>
      </div>
      <div style={{ fontSize: 28, opacity: 0.85 }}>waafasworld.com</div>
    </div>,
    SIZE,
  );
}
