import type { HotelAmenity } from "@waafa/shared";
import { AirVent } from "@/components/icons/server/AirVent";
import { BellRing } from "@/components/icons/server/BellRing";
import { CarFront } from "@/components/icons/server/CarFront";
import { Coffee } from "@/components/icons/server/Coffee";
import { Dumbbell } from "@/components/icons/server/Dumbbell";
import { Flower2 } from "@/components/icons/server/Flower2";
import { Moon } from "@/components/icons/server/Moon";
import { SquareParking } from "@/components/icons/server/SquareParking";
import { Sunset } from "@/components/icons/server/Sunset";
import { TreePalm } from "@/components/icons/server/TreePalm";
import { Users } from "@/components/icons/server/Users";
import { UtensilsCrossed } from "@/components/icons/server/UtensilsCrossed";
import { Waves } from "@/components/icons/server/Waves";
import { Wifi } from "@/components/icons/server/Wifi";

const ICONS = {
  wifi: Wifi,
  breakfast: Coffee,
  pool: Waves,
  beach: TreePalm,
  "sea-view": Sunset,
  spa: Flower2,
  gym: Dumbbell,
  restaurant: UtensilsCrossed,
  "room-service": BellRing,
  "air-conditioning": AirVent,
  parking: SquareParking,
  "airport-transfer": CarFront,
  "family-rooms": Users,
  "prayer-room": Moon,
} satisfies Record<HotelAmenity, unknown>;

/** The icon beside an amenity of a curated hotel (FR-HTL-02); the words come from the page's messages. */
export function HotelAmenityIcon({
  amenity,
  className,
}: {
  amenity: HotelAmenity;
  className?: string;
}) {
  const Icon = ICONS[amenity];
  return <Icon aria-hidden="true" className={className} />;
}
