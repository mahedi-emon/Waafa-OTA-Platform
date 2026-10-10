"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { cn } from "cn";
import { BorderBeam } from "@/components/fx/BorderBeam";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useRouter } from "@/i18n/navigation";
import { recentAirports } from "@/lib/search/recentSearches";
import {
  firstErrorField,
  initialSearchState,
  searchReducer,
  type SearchTab,
} from "@/lib/search/searchState";
import { FlightPanel } from "./FlightPanel";
import { HelpLine } from "./HelpLine";
import { HotelPanel } from "./HotelPanel";
import { MultiCityPanel } from "./MultiCityPanel";
import { QuickPicks } from "./QuickPicks";
import {
  SearchCardProvider,
  errorKeyToFieldId,
  fieldDomId,
  type SearchCardContextValue,
} from "./SearchCardContext";
import type { SearchCardData } from "./searchCardData";
import { SearchTabList } from "./SearchTabList";
import { TourPanel } from "./TourPanel";
import { TripTypeToggle } from "./TripTypeToggle";
import { useDhakaToday } from "./useDhakaToday";
import { useIsDesktop } from "./useIsDesktop";
import { useRecentSearches } from "./useRecentSearches";
import { VisaPanel } from "./VisaPanel";

type SearchCardClientProps = { data: SearchCardData; source: string; className?: string };

const PickerSheet = dynamic(() => import("./PickerSheet").then((mod) => mod.PickerSheet), {
  ssr: false,
});

/** Warms the picker code on the first touch or focus inside the card, so the first picker opens without a wait. */
function prefetchPickers(desktop: boolean) {
  void import("./PickerBody");
  void import("@/lib/search/submit");
  void (desktop ? import("./PickerPopover") : import("./PickerSheet"));
}

const LOG_ENDPOINT = "/api/search/log";

function sessionStore(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** True when this page was reached with Back or Forward (a full load, so the in-memory card state is gone). */
function cameBack(): boolean {
  const [entry] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
  return entry?.type === "back_forward";
}

function sendSearchLog(body: string) {
  try {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon?.(LOG_ENDPOINT, blob)) return;
    void fetch(LOG_ENDPOINT, {
      method: "POST",
      body,
      keepalive: true,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Logging never blocks or breaks a search.
  }
}

/**
 * The search card's interactive island (SearchCard board): glass card, four tabs, fields that open pickers,
 * validation with announced errors, URL building, async search logging and recent searches.
 */
function SearchCardClient({ data, source, className }: SearchCardClientProps) {
  const t = useTranslations("Search");
  const router = useRouter();
  const [state, dispatch] = useReducer(searchReducer, data.defaultOrigin, (origin) =>
    initialSearchState({ origin }),
  );
  const isDesktop = useIsDesktop();
  const today = useDhakaToday();
  const [recent, saveRecent] = useRecentSearches();
  const [errorNonce, setErrorNonce] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const [pending, startTransition] = useTransition();
  // The phone sheet (vaul) mounts the first time a picker opens below 1024 px and then stays for its animations.
  const [sheetMounted, setSheetMounted] = useState(false);
  if (!sheetMounted && !isDesktop && state.picker) setSheetMounted(true);

  // Cache Components keep this page mounted (hidden) after navigation: close any picker when it hides.
  useLayoutEffect(() => () => dispatch({ type: "close" }), []);

  // Back after a full page load: bring back the search the visitor submitted from this tab.
  useEffect(() => {
    if (!cameBack()) return;
    void import("@/lib/search/draftSnapshot").then(({ DRAFT_SNAPSHOT_KEY, parseDraft }) => {
      const draft = parseDraft(sessionStore()?.getItem(DRAFT_SNAPSHOT_KEY));
      if (draft) dispatch({ type: "restore", draft });
    });
  }, []);

  const context = useMemo<SearchCardContextValue>(
    () => ({
      state,
      dispatch,
      data,
      isDesktop,
      today,
      errorNonce,
      recentAirports: recentAirports(recent),
    }),
    [state, data, isDesktop, today, errorNonce, recent],
  );

  // Validation, URL building and logging load on first use (warmed by prefetchPickers), keeping them out of first load.
  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const [
      { VISA_TYPE_KEYS, deviceForWidth, submitSearch, toRecentSearch, toSearchLog },
      { DRAFT_SNAPSHOT_KEY, serializeDraft },
    ] = await Promise.all([import("@/lib/search/submit"), import("@/lib/search/draftSnapshot")]);
    const labels = {
      visaTypes: Object.fromEntries(
        VISA_TYPE_KEYS.map((type) => [type, t(`visaTypes.${type}.label`)]),
      ) as Record<(typeof VISA_TYPE_KEYS)[number], string>,
      anyMonth: t("values.anyMonth"),
    };
    const result = submitSearch(state, today, labels);
    if (!result.ok) {
      dispatch({ type: "errors", errors: result.errors });
      setErrorNonce((n) => n + 1);
      const first = firstErrorField(result.errors);
      if (first) {
        const code = result.errors[first];
        if (code) setAnnouncement(t(`errors.${code}`));
        window.requestAnimationFrame(() =>
          document.getElementById(fieldDomId(errorKeyToFieldId(first)))?.focus(),
        );
      }
      return;
    }
    setAnnouncement("");
    const { submission } = result;
    sendSearchLog(
      JSON.stringify(toSearchLog(submission, deviceForWidth(window.innerWidth), source)),
    );
    saveRecent(toRecentSearch(submission, Date.now()));
    try {
      sessionStore()?.setItem(DRAFT_SNAPSHOT_KEY, serializeDraft(state));
    } catch {
      // Storage full or blocked: Back simply shows a fresh card.
    }
    startTransition(() => router.push(submission.href));
  };

  const tab = state.tab;
  const multi = state.flight.trip === "multi-city";

  return (
    <SearchCardProvider value={context}>
      <section
        aria-label={t("cardLabel")}
        onPointerDownCapture={() => prefetchPickers(isDesktop)}
        onFocusCapture={() => prefetchPickers(isDesktop)}
        className={cn(
          "relative isolate rounded-[28px] border border-white/70 bg-white/86 p-3 shadow-glass backdrop-blur-[18px] backdrop-saturate-[1.4] supports-[not(backdrop-filter:blur(1px))]:bg-white sm:p-4 lg:p-5",
          className,
        )}
      >
        <BorderBeam />
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <Tabs
            value={tab}
            onValueChange={(value) => dispatch({ type: "tab", tab: value as SearchTab })}
            className="gap-4"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <SearchTabList active={tab} />
              {tab === "flight" ? (
                <TripTypeToggle />
              ) : (
                <p className="text-[13px] text-mist-600 lg:text-right">{t(`notes.${tab}`)}</p>
              )}
            </div>
            <TabsContent value="flight" className="data-open:animate-none">
              {multi ? <MultiCityPanel pending={pending} /> : <FlightPanel pending={pending} />}
            </TabsContent>
            <TabsContent value="hotel" className="data-open:animate-none">
              <HotelPanel pending={pending} />
            </TabsContent>
            <TabsContent value="tour" className="data-open:animate-none">
              <TourPanel pending={pending} />
            </TabsContent>
            <TabsContent value="visa" className="data-open:animate-none">
              <VisaPanel pending={pending} />
            </TabsContent>
          </Tabs>
          <div className="flex flex-col gap-3 border-t border-mist-200/80 pt-3 xl:flex-row xl:items-center xl:justify-between">
            <QuickPicks recent={recent} />
            <HelpLine />
          </div>
        </form>
        <p aria-live="assertive" className="sr-only">
          {announcement}
        </p>
      </section>
      {sheetMounted ? <PickerSheet /> : null}
    </SearchCardProvider>
  );
}

export { SearchCardClient };
