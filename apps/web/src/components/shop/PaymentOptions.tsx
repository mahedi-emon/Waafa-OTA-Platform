"use client";

import { Banknote, Building2, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatTaka } from "@waafa/shared";
import { DocumentSlot, type SlotFile } from "@/components/forms/DocumentSlot";
import { FormField } from "@/components/forms/FormField";
import { RadioCard } from "@/components/forms/RadioCard";
import { Input } from "@/components/ui/input";
import { RadioGroup } from "@/components/ui/radio-group";
import { COD } from "@/lib/shop/checkoutForm";

export type OfflineAccount = {
  id: string;
  kind: "bank" | "bkash" | "nagad" | "office";
  title: string;
  lines: string[];
  instructions?: string;
};

type PaymentOptionsProps = {
  accounts: OfflineAccount[];
  value: string;
  onChange: (value: string) => void;
  total: number;
  codLimit: number;
  /** Why cash on delivery is not offered for this order, or null when it is. */
  codBlocked: "limit" | "item" | "pickup" | null;
  transactionId: string;
  onTransaction: (value: string) => void;
  transactionError?: string;
  transactionProps: Omit<React.ComponentProps<"input">, "id" | "value" | "onChange">;
  proof: SlotFile | null;
  onProof: (file: SlotFile | null) => void;
};

const ICONS = { bank: Building2, bkash: Smartphone, nagad: Smartphone, office: Banknote } as const;

/** Payment choices (ShopCheckout step 4): cash on delivery within the limit, or an admin-listed account plus proof. */
function PaymentOptions({
  accounts,
  value,
  onChange,
  total,
  codLimit,
  codBlocked,
  transactionId,
  onTransaction,
  transactionError,
  transactionProps,
  proof,
  onProof,
}: PaymentOptionsProps) {
  const t = useTranslations("Checkout.payment");
  const selected = accounts.find((account) => account.id === value);
  const codNote =
    codBlocked === "limit"
      ? t("codLimit", { limit: formatTaka(codLimit) })
      : codBlocked === "item"
        ? t("codItem")
        : codBlocked === "pickup"
          ? t("codPickup")
          : t("codSub");

  return (
    <div className="flex flex-col gap-3">
      <RadioGroup
        aria-labelledby="checkout-payment-title"
        value={value}
        onValueChange={onChange}
        className="grid-cols-1 gap-2.5"
      >
        <RadioCard
          value={COD}
          checked={value === COD}
          disabled={codBlocked !== null}
          title={t("cod")}
          sub={codNote}
          aside={<Banknote aria-hidden="true" className="size-5 text-brand-700" />}
        />
        {accounts.map((account) => {
          const Icon = ICONS[account.kind];
          return (
            <RadioCard
              key={account.id}
              value={account.id}
              checked={value === account.id}
              title={account.title}
              aside={<Icon aria-hidden="true" className="size-5 text-brand-700" />}
            />
          );
        })}
      </RadioGroup>

      {selected ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-electric-100 bg-electric-50 p-4">
          <div>
            <p className="text-[14.5px] font-semibold text-navy-900">
              {t("sendTo", { total: formatTaka(total) })}
            </p>
            <ul className="mt-1.5 flex flex-col gap-0.5 text-[14px] text-ink-900">
              {selected.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            {selected.instructions ? (
              <p className="mt-2 text-[13px] text-mist-700">{selected.instructions}</p>
            ) : null}
          </div>
          <FormField
            id="checkout-trx"
            label={
              <>
                {t("transaction")} <span aria-hidden="true">*</span>
              </>
            }
            hint={t("transactionHint")}
            error={transactionError}
          >
            {(describedBy) => (
              <Input
                id="checkout-trx"
                value={transactionId}
                onChange={(event) => onTransaction(event.target.value)}
                placeholder={t("transactionPlaceholder")}
                autoComplete="off"
                autoCapitalize="characters"
                aria-invalid={Boolean(transactionError)}
                aria-describedby={describedBy}
                {...transactionProps}
              />
            )}
          </FormField>
          <DocumentSlot
            title={t("proof")}
            sub={t("proofHint")}
            file={proof}
            onChange={onProof}
            labels={{
              choose: t("proofChoose"),
              replace: t("proofChoose"),
              rule: t("proofRule"),
              remove: t("proofRemove"),
              added: t("proofAdded"),
              errors: {
                fileType: t("proofBad"),
                fileSize: t("proofBad"),
                fileEmpty: t("proofBad"),
              },
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

export { PaymentOptions };
