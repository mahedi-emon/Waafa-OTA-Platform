// Each lucide-react icon module also exports its SVG data (issue 236, components/icons/serverIcon.tsx).
declare module "lucide-react/dist/esm/icons/*.mjs" {
  type LucideIconData = {
    name: string;
    node: ReadonlyArray<readonly [string, Record<string, string | number>]>;
  };
  export const __iconData: LucideIconData;
}
