import { SmartImage } from "@/components/media/SmartImage";
import { SmartVideo } from "@/components/media/SmartVideo";
import internationalLogo from "@/assets/brand/waafa-international.png";

/**
 * SmartVideo with the real hero loop (Mixkit footage, phone files under 768 px) and SmartImage in a reserved 4:3
 * frame. Pages take their media from the data layer; this specimen points at the files directly.
 */
function MediaShowcase() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <SmartVideo
        sources={{
          webm: "/media/video/hero-sky.webm",
          mp4: "/media/video/hero-sky.mp4",
          webmMobile: "/media/video/hero-sky-m.webm",
          mp4Mobile: "/media/video/hero-sky-m.mp4",
        }}
        poster="/media/video/hero-sky.webp"
        alt="Aircraft wing above scattered clouds under a pink and pale-blue sunset sky"
        sizes="(min-width: 1024px) 640px, 100vw"
        className="aspect-video rounded-xl"
      />
      <SmartImage
        src={internationalLogo}
        alt="WAAFA International logo"
        ratio="4/3"
        sizes="(min-width: 1024px) 640px, 100vw"
        frameClassName="rounded-xl bg-white border border-mist-200"
        className="object-contain p-10"
      />
    </div>
  );
}

export { MediaShowcase };
