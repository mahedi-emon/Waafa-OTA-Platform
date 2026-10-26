import { createElement, type SVGProps } from "react";
import { cn } from "cn";

/** lucide-react's icon data: the name and the SVG children, as each icon module exports it (`__iconData`). */
export type LucideIconData = {
  name: string;
  node: ReadonlyArray<readonly [string, Record<string, string | number>]>;
};

export type ServerIconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & {
  size?: number | string;
  absoluteStrokeWidth?: boolean;
};

/**
 * A lucide icon drawn on the server (issue 236). lucide-react's icons are client components (its Icon reads a React
 * context), so every icon in a Server Component became a client reference the browser had to hydrate: 165 on the home
 * page. This renders the same SVG (same viewBox, stroke, classes and aria-hidden rule) with no client code. Client
 * components keep importing from lucide-react.
 */
export function serverIcon(data: LucideIconData) {
  function ServerIcon({
    size = 24,
    color = "currentColor",
    strokeWidth = 2,
    absoluteStrokeWidth = false,
    className,
    children,
    ...rest
  }: ServerIconProps) {
    const labelled = Object.keys(rest).some(
      (key) => key.startsWith("aria-") || key === "role" || key === "title",
    );
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={absoluteStrokeWidth ? (Number(strokeWidth) * 24) / Number(size) : strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("lucide", `lucide-${data.name}`, className)}
        {...(!children && !labelled ? { "aria-hidden": "true" } : {})}
        {...rest}
      >
        {data.node.map(([tag, attrs]) => createElement(tag, attrs))}
        {children}
      </svg>
    );
  }
  ServerIcon.displayName = data.name;
  return ServerIcon;
}
