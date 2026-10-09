"use client";

import { formatTaka } from "@waafa/shared";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Kbd } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";

const slides = ["Bali", "Kuala Lumpur", "Sajek Valley", "Kathmandu", "Maldives"] as const;

/** Accordion, breadcrumb, avatars, card, carousel, separator and keyboard hints. */
function DataShowcase() {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
      <div className="grid grid-cols-1 content-start gap-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Tour packages</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Maldives island escape</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Accordion type="single" collapsible defaultValue="final">
          <AccordionItem value="final">
            <AccordionTrigger>Is the price final?</AccordionTrigger>
            <AccordionContent>
              Prices before booking are indicative. Our expert confirms availability and the exact
              fare, then you decide.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="pay">
            <AccordionTrigger>How do I pay?</AccordionTrigger>
            <AccordionContent>
              Bank transfer, bKash, Nagad or at our office in Motijheel. Card payments arrive once
              they are live.
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback>BG</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>EK</AvatarFallback>
          </Avatar>
          <Avatar size="lg">
            <AvatarFallback>AB</AvatarFallback>
          </Avatar>
          <Separator orientation="vertical" className="mx-2 h-8" />
          <span className="text-sm text-mist-600">
            Open the command palette with <Kbd>Ctrl</Kbd> <Kbd>K</Kbd>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 content-start gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Maldives island escape</CardTitle>
            <CardDescription>2N Maafushi · 1N Malé · speedboat transfers</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-[13px] font-semibold text-mist-600 uppercase">From</p>
            <p className="font-display text-xl font-extrabold text-navy-900 tabular-nums">
              {formatTaka(64900)}{" "}
              <span className="text-sm font-medium text-mist-600">/ person</span>
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="soft" size="sm">
              View
            </Button>
          </CardFooter>
        </Card>

        <Carousel opts={{ align: "start" }} className="px-12">
          <CarouselContent>
            {slides.map((slide) => (
              <CarouselItem key={slide} className="basis-2/3 sm:basis-1/2">
                <div className="grid h-28 place-items-end rounded-lg bg-(image:--ribbon) p-4 font-display text-lg font-bold text-white">
                  {slide}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0" />
          <CarouselNext className="right-0" />
        </Carousel>
      </div>
    </div>
  );
}

export { DataShowcase };
