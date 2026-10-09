"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, ChevronDownIcon, InfoIcon, MapPinIcon } from "lucide-react";
import { formatDayMonth } from "@waafa/shared";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const airports = [
  { code: "DAC", city: "Dhaka", name: "Hazrat Shahjalal International" },
  { code: "CGP", city: "Chattogram", name: "Shah Amanat International" },
  { code: "CXB", city: "Cox’s Bazar", name: "Cox’s Bazar Airport" },
  { code: "DXB", city: "Dubai", name: "Dubai International" },
  { code: "KUL", city: "Kuala Lumpur", name: "Kuala Lumpur International" },
] as const;

/** Dialogs, sheets, the phone drawer, popovers, tooltips, menus, the airport command list and the calendar. */
function OverlayShowcase() {
  const [range, setRange] = useState<DateRange | undefined>();

  return (
    <div className="flex flex-wrap items-start gap-3">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="secondary">Open dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fare rules</DialogTitle>
            <DialogDescription>
              Changes are allowed up to 24 hours before departure for a fee set by the airline. Our
              team confirms the exact amount before you pay.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="secondary">Leave this request?</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this request?</AlertDialogTitle>
            <AlertDialogDescription>
              You’ve filled in 2 of 3 steps. We keep a draft on this device for 7 days.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction variant="ghost">Leave</AlertDialogAction>
            <AlertDialogCancel variant="primary">Keep going</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="secondary">Open side sheet</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Your cart</SheetTitle>
            <SheetDescription>Desktop drawers slide in from the right.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>

      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="secondary">Open phone drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Travellers and class</DrawerTitle>
            <DrawerDescription>Drag down or tap Done to close.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button size="lg">Done</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="secondary">
            <MapPinIcon /> From: Dhaka (DAC) <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0">
          <Command>
            <CommandInput placeholder="City, airport or code" />
            <CommandList>
              <CommandEmpty>No airport matches. Try the city name.</CommandEmpty>
              <CommandGroup heading="Bangladesh and popular">
                {airports.map((airport) => (
                  <CommandItem
                    key={airport.code}
                    value={`${airport.city} ${airport.code} ${airport.name}`}
                  >
                    <span className="w-10 font-display font-extrabold text-navy-900">
                      {airport.code}
                    </span>
                    <span className="flex flex-col">
                      <span className="font-semibold text-navy-900">{airport.city}</span>
                      <span className="text-xs text-mist-600">{airport.name}</span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="secondary">
            <CalendarIcon />
            {range?.from
              ? `${formatDayMonth(range.from)}${range.to ? ` to ${formatDayMonth(range.to)}` : ""}`
              : "Pick dates"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <Calendar mode="range" numberOfMonths={1} selected={range} onSelect={setRange} />
        </PopoverContent>
      </Popover>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="What does indicative mean?">
            <InfoIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Our team confirms the final fare before you pay.</TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary">
            Sort: Recommended <ChevronDownIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Sort packages</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Recommended</DropdownMenuItem>
          <DropdownMenuItem>Price, low to high</DropdownMenuItem>
          <DropdownMenuItem>Duration, short first</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export { OverlayShowcase };
