import { cn } from "cn";

type QrCodeProps = {
  /** Rows of "1" (dark module) and "0" (light), from `qrRows` on the server. */
  rows: string[];
  label: string;
  className?: string;
};

/**
 * Draws a QR code as one SVG path (issue 234). The matrix is made on the server, so no QR library reaches the
 * browser; dark navy on white scans like black.
 */
function QrCode({ rows, label, className }: QrCodeProps) {
  const size = rows.length;
  let d = "";
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] !== "1") {
        x += 1;
        continue;
      }
      let run = 1;
      while (row[x + run] === "1") run += 1;
      d += `M${x} ${y}h${run}v1h-${run}z`;
      x += run;
    }
  });
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      className={cn("size-48 rounded-xl bg-white", className)}
    >
      <path d={d} className="fill-ink-950" />
    </svg>
  );
}

export { QrCode };
