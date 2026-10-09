"use client";

import type { ReactNode } from "react";
import { m, type Variants } from "motion/react";
import { REVEAL_VIEWPORT } from "./tokens";

const tags = { div: m.div, ul: m.ul, ol: m.ol, section: m.section } as const;

const containerVariants: Variants = { hidden: {}, shown: {} };

type StaggerProps = {
  children: ReactNode;
  as?: keyof typeof tags;
  className?: string;
};

/**
 * A group whose StaggerItem children reveal one after another (50 ms apart, at most eight) when the
 * group scrolls into view, once. Each StaggerItem carries its own index, so the cap is exact.
 */
function Stagger({ children, as = "div", className }: StaggerProps) {
  const Tag = tags[as];

  return (
    <Tag
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="shown"
      viewport={REVEAL_VIEWPORT}
    >
      {children}
    </Tag>
  );
}

export { Stagger };
