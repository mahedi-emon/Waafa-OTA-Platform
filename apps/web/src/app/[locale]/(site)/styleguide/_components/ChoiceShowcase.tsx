"use client";

import { useState } from "react";
import { BuildingIcon, LockIcon, PlaneIcon, StampIcon, TreePalmIcon, XIcon } from "lucide-react";
import { formatTaka } from "@waafa/shared";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldLabel, FieldTitle } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const cabins = ["Economy", "Premium Economy", "Business", "First"] as const;

/** Checkboxes, radios, switches, option cards, chips, segmented controls, tabs and the price slider. */
function ChoiceShowcase() {
  const [budget, setBudget] = useState([20000, 90000]);

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
      <div className="grid grid-cols-1 content-start gap-4">
        <div className="flex items-center gap-3">
          <Checkbox id="sg-direct" defaultChecked />
          <Label htmlFor="sg-direct" className="text-[15px] font-normal text-ink-900">
            Direct flights only
          </Label>
        </div>
        <div className="flex items-center gap-3">
          <Checkbox id="sg-flex" />
          <Label htmlFor="sg-flex" className="text-[15px] font-normal text-ink-900">
            Flexible dates ±3 days
          </Label>
        </div>
        <RadioGroup defaultValue="call" aria-label="Preferred contact" className="mt-2">
          {["Call me", "WhatsApp", "Email"].map((label) => (
            <div key={label} className="flex items-center gap-3">
              <RadioGroupItem
                value={label === "Call me" ? "call" : label.toLowerCase()}
                id={`sg-contact-${label.toLowerCase().replace(/\s+/g, "-")}`}
              />
              <Label
                htmlFor={`sg-contact-${label.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-[15px] font-normal text-ink-900"
              >
                {label}
              </Label>
            </div>
          ))}
        </RadioGroup>
        <div className="mt-2 flex items-center justify-between gap-4">
          <Label htmlFor="sg-email-required" className="text-[15px] text-navy-900">
            Email required on queries
          </Label>
          <Switch id="sg-email-required" defaultChecked />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="sg-live" className="text-[15px] text-navy-900">
            Flights · Live mode
            <LockIcon aria-hidden="true" className="size-4 text-mist-500" />
          </Label>
          <Switch id="sg-live" disabled aria-describedby="sg-live-note" />
        </div>
        <p id="sg-live-note" className="text-[13px] text-mist-600">
          Locked until a flight provider passes its health check.
        </p>
      </div>

      <div className="grid grid-cols-1 content-start gap-6">
        <RadioGroup
          defaultValue="Economy"
          aria-label="Cabin class"
          className="grid-cols-1 gap-2.5 sm:grid-cols-2"
        >
          {cabins.map((cabin) => {
            const id = `sg-cabin-${cabin.toLowerCase().replace(/\s+/g, "-")}`;
            return (
              <FieldLabel key={cabin} htmlFor={id}>
                <Field orientation="horizontal">
                  {/* Radix radios are buttons: name them from the visible title, not the wrapping label. */}
                  <RadioGroupItem value={cabin} id={id} aria-labelledby={`${id}-title`} />
                  <FieldContent>
                    <FieldTitle id={`${id}-title`}>{cabin}</FieldTitle>
                  </FieldContent>
                </Field>
              </FieldLabel>
            );
          })}
        </RadioGroup>

        <div className="flex flex-wrap gap-2">
          <Toggle defaultPressed aria-label="Direct, 18 flights">
            Direct 18 <XIcon aria-hidden="true" />
          </Toggle>
          <Toggle>1 stop 42</Toggle>
          <Toggle>Morning 21</Toggle>
          <Toggle>Refundable 9</Toggle>
        </div>

        <ToggleGroup type="single" variant="segment" defaultValue="round" aria-label="Trip type">
          <ToggleGroupItem value="one">One-way</ToggleGroupItem>
          <ToggleGroupItem value="round">Round-trip</ToggleGroupItem>
          <ToggleGroupItem value="multi">Multi-city</ToggleGroupItem>
        </ToggleGroup>

        <Tabs defaultValue="flight">
          <TabsList aria-label="Search for">
            <TabsTrigger value="flight">
              <PlaneIcon /> Flight
            </TabsTrigger>
            <TabsTrigger value="hotel">
              <BuildingIcon /> Hotel
            </TabsTrigger>
            <TabsTrigger value="tour">
              <TreePalmIcon /> Tour
            </TabsTrigger>
            <TabsTrigger value="visa">
              <StampIcon /> Visa
            </TabsTrigger>
          </TabsList>
          <TabsContent value="flight" className="text-sm text-mist-600">
            Segmented tabs: mist track, white pill on the active tab.
          </TabsContent>
          <TabsContent value="hotel" className="text-sm text-mist-600">
            Hotel panel.
          </TabsContent>
          <TabsContent value="tour" className="text-sm text-mist-600">
            Tour panel.
          </TabsContent>
          <TabsContent value="visa" className="text-sm text-mist-600">
            Visa panel.
          </TabsContent>
        </Tabs>

        <Tabs defaultValue="overview">
          <TabsList variant="line" aria-label="Package sections">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
            <TabsTrigger value="prices">Prices</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="text-sm text-mist-600">
            Line tabs: the 3 px ribbon marks the active section.
          </TabsContent>
          <TabsContent value="itinerary" className="text-sm text-mist-600">
            Day by day plan.
          </TabsContent>
          <TabsContent value="prices" className="text-sm text-mist-600">
            Price per person by room sharing.
          </TabsContent>
        </Tabs>

        <div className="grid gap-3">
          <Label id="sg-budget-label">Budget per person</Label>
          <Slider
            aria-labelledby="sg-budget-label"
            min={5000}
            max={200000}
            step={1000}
            value={budget}
            onValueChange={setBudget}
          />
          <p className="text-sm font-semibold text-navy-900 tabular-nums">
            {formatTaka(budget[0] ?? 0)} to {formatTaka(budget[1] ?? 0)}
          </p>
        </div>
      </div>
    </div>
  );
}

export { ChoiceShowcase };
