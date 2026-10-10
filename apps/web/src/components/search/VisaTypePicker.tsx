"use client";

import { Briefcase, GraduationCap, Map, Plane, Stethoscope, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { VisaTypeKeySchema, type VisaTypeKey } from "@waafa/shared";
import { OptionIcon } from "./OptionIcon";
import { OptionList } from "./OptionList";
import { useSearchCard } from "./SearchCardContext";

type VisaTypePickerProps = { title: string };

const ICONS: Record<VisaTypeKey, LucideIcon> = {
  tourist: Map,
  business: Briefcase,
  medical: Stethoscope,
  student: GraduationCap,
  transit: Plane,
};

/** Visa tab, purpose of the visit (Pick-m-vtype): only the types the chosen country offers. */
function VisaTypePicker({ title }: VisaTypePickerProps) {
  const t = useTranslations("Search");
  const { state, dispatch } = useSearchCard();
  const types = state.visa.country?.types.length
    ? state.visa.country.types
    : VisaTypeKeySchema.options;

  return (
    <OptionList
      label={title}
      groups={[
        {
          key: "purpose",
          label: t("groups.purpose"),
          options: types.map((type) => {
            const Icon = ICONS[type];
            return {
              key: type,
              label: t(`visaTypes.${type}.label`),
              sub: t(`visaTypes.${type}.description`),
              mark: (
                <OptionIcon>
                  <Icon />
                </OptionIcon>
              ),
              selected: state.visa.type === type,
              onSelect: () => dispatch({ type: "pickVisaType", visaType: type }),
            };
          }),
        },
      ]}
    />
  );
}

export { VisaTypePicker };
