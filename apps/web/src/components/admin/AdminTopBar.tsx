"use client";

import { useState, type ReactNode } from "react";
import { ExternalLink, KeyRound, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import type { AdminNavGroup } from "@/lib/admin/navigation";
import { signOut } from "@/lib/admin/sessionActions";
import { AdminCommand } from "./AdminCommand";
import { AdminNav } from "./AdminNav";

type AdminTopBarProps = {
  groups: AdminNavGroup[];
  labels: Record<string, string>;
  staff: { name: string; initials: string; role: string };
  /** The sidebar head, rendered on the server (the logo needs server translations). */
  brand: ReactNode;
  brandSub: string;
  strings: {
    menu: string;
    nav: string;
    viewSite: string;
    account: string;
    signOut: string;
    command: {
      search: string;
      searchShort: string;
      title: string;
      empty: string;
      pages: string;
      find: string;
      openReference: string;
      referenceHint: string;
    };
  };
};

/**
 * The admin top bar (AdminTop board): the menu on phones (the sidebar in a sheet), the command palette, View site and
 * the account menu with sign-out.
 */
function AdminTopBar({ groups, labels, staff, brand, brandSub, strings }: AdminTopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-mist-200 bg-white/95 px-4 backdrop-blur-sm lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label={strings.menu}
        onClick={() => setMenuOpen(true)}
      >
        <Menu aria-hidden="true" />
      </Button>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="left"
          className="w-[288px] gap-0 overflow-y-auto border-0 bg-navy-900 p-0 text-white"
        >
          <SheetTitle className="sr-only">{strings.nav}</SheetTitle>
          <SheetDescription className="sr-only">{brandSub}</SheetDescription>
          {brand}
          <AdminNav
            groups={groups}
            labels={labels}
            label={strings.nav}
            onNavigate={() => setMenuOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1">
        <AdminCommand groups={groups} labels={labels} strings={strings.command} />
      </div>

      <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
        <a href="/" target="_blank" rel="noopener noreferrer">
          <ExternalLink aria-hidden="true" className="size-4" />
          {strings.viewSite}
        </a>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`${strings.account}: ${staff.name}`}
            className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-electric-600 text-sm font-bold text-white focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            {staff.initials}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate font-semibold text-navy-900">{staff.name}</span>
            <span className="truncate text-xs font-normal text-mist-600">{staff.role}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/admin/account" prefetch={false}>
              <KeyRound aria-hidden="true" />
              {strings.account}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/" target="_blank" rel="noopener noreferrer" className="sm:hidden">
              <ExternalLink aria-hidden="true" />
              {strings.viewSite}
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <form action={signOut}>
            <DropdownMenuItem asChild>
              <button type="submit" className="w-full">
                <LogOut aria-hidden="true" />
                {strings.signOut}
              </button>
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

export { AdminTopBar };
