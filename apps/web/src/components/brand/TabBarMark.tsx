import Image from "next/image";
import markImage from "@/assets/brand/waafa-mark.png";
import { LOGO_QUALITY } from "@/lib/media/imageQuality";

/**
 * The W on the tab bar's raised Waafas World disc (a navigation icon, correction 4). Rendered on the server and
 * handed to the client TabBar, so no page ships next/image's client code for it (issue 236).
 */
function TabBarMark() {
  return (
    <Image
      src={markImage}
      alt=""
      width={33}
      height={20}
      quality={LOGO_QUALITY}
      className="h-5 w-[33px]"
    />
  );
}

export { TabBarMark };
