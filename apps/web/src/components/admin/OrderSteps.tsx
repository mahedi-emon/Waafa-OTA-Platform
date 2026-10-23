"use client";

import { useId, useState, useTransition } from "react";
import {
  CircleCheck,
  PackageCheck,
  PackageOpen,
  PhoneCall,
  Truck,
  Undo2,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { OrderActionInput, OrderStatus } from "@waafa/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link, useRouter } from "@/i18n/navigation";
import { orderAction } from "@/lib/admin/opsActions";

type Step =
  "confirmCall" | "confirmProof" | "startPacking" | "ship" | "deliver" | "cancel" | "return";

const ICONS = {
  confirmCall: PhoneCall,
  confirmProof: CircleCheck,
  startPacking: PackageOpen,
  ship: Truck,
  deliver: PackageCheck,
  cancel: XCircle,
  return: Undo2,
} satisfies Record<Step, unknown>;

/** Steps that ask for something first (courier and tracking, a reason); the rest run on one press. */
const ASKS = new Set<Step>(["ship", "cancel", "return"]);

type OrderStepsProps = {
  id: string;
  status: OrderStatus;
  /** Cash on delivery is confirmed on the phone; other methods by a verified payment proof. */
  cashOnDelivery: boolean;
  paymentVerified: boolean;
};

/** What an order offers next (ADMIN.md §8.4), the main step first. */
function stepsFor(status: OrderStatus, cash: boolean, paid: boolean): Step[] {
  switch (status) {
    case "placed":
      return cash ? ["confirmCall", "cancel"] : paid ? ["confirmProof", "cancel"] : ["cancel"];
    case "confirmed":
      return ["startPacking", "ship", "cancel"];
    case "processing":
      return ["ship", "cancel"];
    case "shipped":
      return ["deliver", "return"];
    case "delivered":
      return ["return"];
    default:
      return [];
  }
}

/**
 * The order's next steps (D0 R4): Confirm (on the phone for cash on delivery, or once the payment proof is
 * verified), Start packing, Mark shipped with the courier and tracking number, Mark delivered; Cancel and Return ask
 * for a reason and put the items back in stock. The status follows; nobody picks it.
 */
function OrderSteps({ id, status, cashOnDelivery, paymentVerified }: OrderStepsProps) {
  const t = useTranslations("Admin.orderSteps");
  const router = useRouter();
  const uid = useId();
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<Step | null>(null);
  const [courier, setCourier] = useState("");
  const [tracking, setTracking] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const steps = stepsFor(status, cashOnDelivery, paymentVerified);
  const waiting = status === "placed" && !cashOnDelivery && !paymentVerified;

  function inputFor(current: Step): OrderActionInput | null {
    switch (current) {
      case "confirmCall":
        return { type: "confirm", by: "call" };
      case "confirmProof":
        return { type: "confirm", by: "proof" };
      case "startPacking":
        return { type: "startPacking" };
      case "deliver":
        return { type: "deliver" };
      case "ship":
        if (courier.trim().length < 2 || tracking.trim().length < 3) {
          setError(t("courierNeeded"));
          return null;
        }
        return { type: "ship", courier: courier.trim(), trackingNumber: tracking.trim() };
      case "cancel":
      case "return":
        if (reason.trim().length < 3) {
          setError(t("reasonNeeded"));
          return null;
        }
        return { type: current, reason: reason.trim() };
    }
  }

  function run(current: Step) {
    const input = inputFor(current);
    if (!input) return;
    startTransition(async () => {
      const result = await orderAction(id, input);
      if (!result.ok) {
        const message = result.problem.fields?.[0]?.message ?? result.problem.detail ?? t("failed");
        setError(message);
        toast.error(message);
        return;
      }
      toast.success(t(`done.${current}`));
      setStep(null);
      router.refresh();
    });
  }

  const open = (next: Step) => {
    setError(null);
    setCourier("");
    setTracking("");
    setReason("");
    if (ASKS.has(next)) setStep(next);
    else run(next);
  };

  if (steps.length === 0 && !waiting)
    return <p className="text-[14px] text-mist-600">{t("finished")}</p>;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] font-semibold tracking-wide text-mist-500 uppercase">{t("next")}</p>
      {waiting ? (
        <p className="rounded-xl bg-warning-50 p-3 text-[14px] text-warning-800">
          {t("waitingProof")}{" "}
          <Link
            href="/secure-admin-control/payments"
            prefetch={false}
            className="font-semibold underline"
          >
            {t("seeProofs")}
          </Link>
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        {steps.map((name, index) => {
          const Icon = ICONS[name];
          const quiet = name === "cancel" || name === "return";
          return (
            <Button
              key={name}
              type="button"
              size="md"
              variant={index === 0 && !quiet ? "primary" : quiet ? "ghost" : "secondary"}
              loading={pending && step === null && index === 0 && !ASKS.has(name)}
              disabled={pending}
              onClick={() => open(name)}
              className={quiet ? "justify-start text-danger-700" : "justify-start"}
            >
              <Icon aria-hidden="true" className="size-4" />
              {t(`steps.${name}`)}
            </Button>
          );
        })}
      </div>
      {error && step === null ? (
        <p role="alert" className="text-[13.5px] font-medium text-danger-700">
          {error}
        </p>
      ) : null}

      <Dialog open={step !== null} onOpenChange={(next) => (next ? null : setStep(null))}>
        {step ? (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t(`titles.${step}`)}</DialogTitle>
              <DialogDescription>{t(`bodies.${step}`)}</DialogDescription>
            </DialogHeader>
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                run(step);
              }}
            >
              {step === "ship" ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`${uid}-courier`}>{t("courier")}</Label>
                    <Input
                      id={`${uid}-courier`}
                      value={courier}
                      maxLength={60}
                      autoComplete="off"
                      onChange={(event) => setCourier(event.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`${uid}-tracking`}>{t("tracking")}</Label>
                    <Input
                      id={`${uid}-tracking`}
                      value={tracking}
                      maxLength={60}
                      autoComplete="off"
                      onChange={(event) => setTracking(event.target.value)}
                      className="font-mono"
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`${uid}-reason`}>{t("reason")}</Label>
                  <Textarea
                    id={`${uid}-reason`}
                    value={reason}
                    maxLength={300}
                    rows={3}
                    onChange={(event) => setReason(event.target.value)}
                    aria-describedby={`${uid}-reason-help`}
                  />
                  <p id={`${uid}-reason-help`} className="text-[13px] text-mist-600">
                    {t("restockNote")}
                  </p>
                </div>
              )}
              {error ? (
                <p role="alert" className="text-[13.5px] font-medium text-danger-700">
                  {error}
                </p>
              ) : null}
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setStep(null)}>
                  {t("cancelDialog")}
                </Button>
                <Button
                  type="submit"
                  variant={step === "ship" ? "primary" : "danger"}
                  loading={pending}
                >
                  {t(`confirm.${step}`)}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}

export { OrderSteps };
