import { CheckIcon } from "lucide-react";
import { GoldTriangle } from "@/components/brand/GoldTriangle";
import { Badge } from "@/components/ui/badge";

const stock = [
  { label: "In stock", dot: "bg-success-600", text: "text-success-600" },
  { label: "Low stock", dot: "bg-warning-700", text: "text-warning-700" },
  { label: "Out of stock", dot: "bg-mist-400", text: "text-mist-600" },
  { label: "Pre-order", dot: "bg-electric-600", text: "text-electric-600" },
] as const;

/** Badges and stock states (Components board, Chips, badges & marks). Colour always comes with words. */
function BadgeShowcase() {
  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="premium">
          <GoldTriangle />
          Best seller
        </Badge>
        <Badge variant="brand">Group departure</Badge>
        <Badge variant="success">
          <CheckIcon />
          Refundable
        </Badge>
        <Badge variant="warning">9 seats left</Badge>
        <Badge variant="danger">Sold out</Badge>
        <Badge variant="neutral">4D / 3N</Badge>
        <Badge variant="discount">-12%</Badge>
        <Badge variant="outline">Sample data</Badge>
      </div>
      <ul className="flex flex-wrap items-center gap-5">
        {stock.map((item) => (
          <li
            key={item.label}
            className={`flex items-center gap-1.5 text-[13px] font-semibold ${item.text}`}
          >
            <span aria-hidden="true" className={`size-2 rounded-full ${item.dot}`} />
            {item.label}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-navy-900 p-4">
        <Badge variant="glass">Group fare</Badge>
        <Badge variant="glass">Photo</Badge>
      </div>
    </div>
  );
}

export { BadgeShowcase };
