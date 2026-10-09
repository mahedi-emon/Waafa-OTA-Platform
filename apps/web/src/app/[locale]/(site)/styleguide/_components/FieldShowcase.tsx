"use client";

import { useState } from "react";
import { CheckIcon, SearchIcon } from "lucide-react";
import { Field, FieldDescription, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

/** Text fields in every state (Components board, Text fields; States board, Fields). */
function FieldShowcase() {
  const [otp, setOtp] = useState("482");

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Field>
        <Label htmlFor="sg-name" required>
          Full name
        </Label>
        <Input id="sg-name" defaultValue="Rahim Uddin" autoComplete="name" required />
      </Field>

      <Field>
        <Label htmlFor="sg-email" hint="(optional)">
          Email
        </Label>
        <Input id="sg-email" type="email" placeholder="you@example.com" autoComplete="email" />
      </Field>

      <Field data-invalid="true">
        <Label htmlFor="sg-passport">Passport number</Label>
        <Input
          id="sg-passport"
          defaultValue="A12"
          aria-invalid="true"
          aria-describedby="sg-passport-error"
        />
        <FieldError id="sg-passport-error">
          Enter all 9 characters, as printed on the bio page.
        </FieldError>
      </Field>

      <Field>
        <Label htmlFor="sg-promo">Promo code</Label>
        <Input
          id="sg-promo"
          defaultValue="WAAFA10"
          aria-describedby="sg-promo-status"
          className="border-success-600"
        />
        <p
          id="sg-promo-status"
          className="flex items-center gap-1.5 text-[13px] font-medium text-success-600"
        >
          <CheckIcon aria-hidden="true" className="size-4" /> Code applied, ৳500 off
        </p>
      </Field>

      <Field>
        <Label htmlFor="sg-time">Best time to call</Label>
        <Select defaultValue="evening">
          <SelectTrigger id="sg-time">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="morning">Morning, 10 am to 12 pm</SelectItem>
            <SelectItem value="afternoon">Afternoon, 12 pm to 4 pm</SelectItem>
            <SelectItem value="evening">Evening, 6 pm to 9 pm</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <Label htmlFor="sg-search">Search</Label>
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput id="sg-search" placeholder="City, airport or code" />
        </InputGroup>
      </Field>

      <Field className="md:col-span-2">
        <Label htmlFor="sg-notes" hint="(optional)">
          Notes for our expert
        </Label>
        <Textarea
          id="sg-notes"
          placeholder="Seat preference, meal needs, flexible dates…"
          aria-describedby="sg-notes-help"
        />
        <FieldDescription id="sg-notes-help">Never shown publicly. 0 / 500</FieldDescription>
      </Field>

      <Field>
        <Label htmlFor="sg-disabled">Booking reference</Label>
        <Input id="sg-disabled" defaultValue="FLT-261008-0042" disabled />
      </Field>

      <Field>
        <Label htmlFor="sg-otp">Verification code</Label>
        <InputOTP id="sg-otp" maxLength={6} value={otp} onChange={setOtp}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </Field>
    </div>
  );
}

export { FieldShowcase };
