// Each lucide-react icon module also exports its SVG data (issue 236, components/icons/serverIcon.tsx).
declare module "lucide-react/dist/esm/icons/*.mjs" {
  export const __iconData: import("@/components/icons/serverIcon").LucideIconData;
}
