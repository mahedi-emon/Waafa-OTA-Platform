import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type TrustDeviceFieldProps = {
  label: string;
  hint: string;
};

/** "Trust this device for 30 days" (issue 234): no code on this browser until then. Off by default. */
function TrustDeviceField({ label, hint }: TrustDeviceFieldProps) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id="admin-trust"
        name="trust"
        className="mt-3"
        aria-describedby="admin-trust-hint"
      />
      <div className="flex flex-col">
        <Label htmlFor="admin-trust" className="min-h-11 items-center font-semibold text-ink-900">
          {label}
        </Label>
        <p id="admin-trust-hint" className="-mt-1.5 text-[13.5px] text-mist-600">
          {hint}
        </p>
      </div>
    </div>
  );
}

export { TrustDeviceField };
