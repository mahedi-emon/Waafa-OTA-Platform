type ProgressRingProps = {
  value: number;
  total: number;
  /** What the ring counts, read by screen readers ("3 of 8 documents received"). */
  label: string;
  size?: number;
};

/**
 * A small ring that fills as a checklist does (visa documents, ADMIN.md §8.3). The arc eases on change; reduced
 * motion shows the new value at once.
 */
function ProgressRing({ value, total, label, size = 44 }: ProgressRingProps) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const length = 2 * Math.PI * radius;
  const share = total > 0 ? Math.min(1, Math.max(0, value / total)) : 0;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      className="shrink-0 -rotate-90"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        className="stroke-mist-200"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={length}
        strokeDashoffset={length * (1 - share)}
        className={
          share >= 1
            ? "stroke-success-700 transition-[stroke-dashoffset] duration-300 ease-out motion-reduce:transition-none"
            : "stroke-electric-600 transition-[stroke-dashoffset] duration-300 ease-out motion-reduce:transition-none"
        }
      />
    </svg>
  );
}

export { ProgressRing };
