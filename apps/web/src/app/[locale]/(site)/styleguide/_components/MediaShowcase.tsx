import { SmartImage } from "@/components/media/SmartImage";
import { SmartVideo } from "@/components/media/SmartVideo";
import routesPoster from "@/assets/media/routes-from-dhaka.webp";
import internationalLogo from "@/assets/brand/waafa-international.png";

/**
 * SmartVideo with the "Routes from Dhaka" motion graphic (usable as-is per the Motion board) and SmartImage
 * in a reserved 4:3 frame. Destination photos arrive with issue #5.
 */
function MediaShowcase() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <SmartVideo
        sources={{ webm: "/media/routes-from-dhaka.webm", mp4: "/media/routes-from-dhaka.mp4" }}
        poster={routesPoster}
        alt="Animated map of flight routes from Dhaka"
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
