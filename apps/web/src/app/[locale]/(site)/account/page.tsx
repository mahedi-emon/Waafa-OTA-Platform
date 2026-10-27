import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CircleAlert } from "@/components/icons/server/CircleAlert";
import { Heart } from "@/components/icons/server/Heart";
import { LogOut } from "@/components/icons/server/LogOut";
import { PackageOpen } from "@/components/icons/server/PackageOpen";
import { Plane } from "@/components/icons/server/Plane";
import { Stamp } from "@/components/icons/server/Stamp";
import { formatDate, formatTaka, type AccountView } from "@waafa/shared";
import { AccountSettings } from "@/components/account/AccountSettings";
import { AddressesEditor } from "@/components/account/AddressesEditor";
import { TravellersEditor } from "@/components/account/TravellersEditor";
import { WishlistRemoveButton } from "@/components/account/WishlistRemoveButton";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { SmartImage } from "@/components/media/SmartImage";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalLink as Link } from "@/components/nav/LocalLink";
import { readAccount } from "@/lib/account/accountApi";
import { SESSION_COOKIE } from "@/lib/account/googleOAuth";
import { getLeadFormSettings, getSearchSettings, getSiteSettings } from "@/lib/data/settings";
import { getProduct } from "@/lib/data/shop";
import { getPackage } from "@/lib/data/travel";
import { dialCode, isPhoneCountry } from "@/lib/leads/phone";
import { AccountRequestCard } from "./_components/AccountRequestCard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Account.account");
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

const h2 = "font-display text-[20px] font-extrabold text-navy-900 md:text-[22px]";
const lead = "text-[14.5px] break-words text-mist-700";
const chip =
  "inline-flex items-center rounded-full bg-electric-50 px-2.5 py-1 text-[12.5px] font-semibold text-navy-900";
const empty = "flex flex-col items-start gap-3 rounded-2xl bg-mist-50 p-5";
const SECTIONS = [
  "requests",
  "visa",
  "orders",
  "wishlist",
  "travellers",
  "addresses",
  "settings",
] as const;

/** "Rahim Uddin" → "RU": no profile photo is loaded from Google. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "W"
  );
}

type SavedItem = {
  kind: "package" | "product";
  slug: string;
  title: string;
  href: string;
  note: string;
  image: { src: string; alt: string } | null;
};

/** The saved holidays and products, looked up in the catalogue; one that was removed shows as no longer available. */
async function resolveWishlist(
  wishlist: AccountView["wishlist"],
  words: { from: (price: string) => string; store: string; gone: string },
): Promise<SavedItem[]> {
  return Promise.all(
    wishlist.map(async (item): Promise<SavedItem> => {
      if (item.kind === "package") {
        const trip = await getPackage(item.slug);
        return trip
          ? {
              ...item,
              title: trip.title,
              href: `/tour-packages/${trip.slug}`,
              note: `${trip.placesLabel} · ${words.from(formatTaka(trip.fromPrice))}`,
              image: trip.cover,
            }
          : { ...item, title: item.slug, href: "/tour-packages", note: words.gone, image: null };
      }
      const product = await getProduct(item.slug);
      return product
        ? {
            ...item,
            title: product.title,
            href: `/shop/p/${product.slug}`,
            note: words.store,
            image: product.images[0] ?? null,
          }
        : { ...item, title: item.slug, href: "/shop", note: words.gone, image: null };
    }),
  );
}

async function AccountContent({
  searchParams,
}: Pick<PageProps<"/[locale]/account">, "searchParams">) {
  const site = await getSiteSettings();
  if (!site.accountsLive) notFound();
  const store = await cookies();
  const account = await readAccount(store.get(SESSION_COOKIE)?.value);
  if (!account) redirect("/login?next=/account");
  const [params, t, tt, leadForm, searchSettings] = await Promise.all([
    searchParams,
    getTranslations("Account.account"),
    getTranslations("Track"),
    getLeadFormSettings(),
    getSearchSettings(),
  ]);
  const error = params.error === "confirm" || params.error === "delete" ? params.error : undefined;
  const { customer, orders } = account;
  const requests = account.requests.filter((request) => request.module !== "visa");
  const visas = account.requests.filter((request) => request.module === "visa");
  const saved = await resolveWishlist(account.wishlist, {
    from: (price) => t("wishlist.from", { price }),
    store: t("wishlist.store"),
    gone: t("wishlist.gone"),
  });

  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  const countries = leadForm.phoneCountries
    .filter(isPhoneCountry)
    .map((code) => ({ code, name: regionNames.of(code) ?? code, dial: dialCode(code) }));
  const nationalityCodes = new Set(["BD", ...searchSettings.hotelNationalities]);
  for (const traveller of account.travellers) {
    if (traveller.nationality) nationalityCodes.add(traveller.nationality);
  }
  const nationalities = [...nationalityCodes].map((code) => ({
    code,
    name: regionNames.of(code) ?? code,
  }));
  const errors = {
    signedOut: t("errors.signedOut"),
    invalid: t("errors.invalid"),
    unavailable: t("errors.unavailable"),
    busy: t("errors.busy"),
  };
  const progressLabels = {
    received: tt("request.steps.received"),
    expert: tt("request.steps.expert"),
    quote: tt("request.steps.quote"),
    booked: tt("request.steps.booked"),
    closed: tt("request.steps.closed"),
    documents: tt("request.visa.documents", { received: "{received}", required: "{required}" }),
    submitted: tt("request.visa.submitted"),
    approved: tt("request.visa.approved"),
    rejected: tt("request.visa.rejected"),
    passport: tt("request.visa.passport"),
    waiting: tt("request.waiting"),
    done: tt("request.done"),
  };
  const requestCard = (request: AccountView["requests"][number]) => (
    <AccountRequestCard
      key={request.reference}
      request={request}
      moduleLabel={t(`modules.${request.module as "flights"}`)}
      statusLabel={t(`requestStatus.${request.status as "new"}`)}
      sentLabel={t("sent", { date: "{date}" })}
      showProgress={t("showProgress")}
      heading={tt("request.timeline")}
      labels={progressLabels}
    />
  );

  return (
    <main id="main" className="site-container flex flex-col gap-8 pt-4 pb-28 md:pt-6">
      <Breadcrumbs items={[{ label: t("kicker") }]} />

      <header className="flex flex-col gap-5 rounded-[24px] bg-navy-900 p-6 text-white md:flex-row md:items-center md:justify-between md:p-8">
        <div className="flex min-w-0 items-center gap-4">
          <span
            aria-hidden="true"
            className="grid size-14 shrink-0 place-items-center rounded-full bg-white/10 font-display text-[20px] font-extrabold text-cyan-400"
          >
            {initials(customer.name)}
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="font-display text-[26px] leading-tight font-extrabold break-words md:text-[32px]">
              {t("greeting", { name: customer.name })}
            </h1>
            <p className="text-[14.5px] break-all text-white/75">
              {t("signedInWith", { email: customer.email })}
            </p>
          </div>
        </div>
        {/* Plain posts answered with a 303 (issue 138): the next page loads in full. */}
        <form method="post" action="/api/account/sign-out">
          <Button type="submit" variant="white" className="w-full md:w-auto">
            <LogOut aria-hidden="true" />
            {t("signOut")}
          </Button>
        </form>
      </header>

      <nav aria-label={t("sections.label")} className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <ul className="flex w-max gap-2 md:w-auto md:flex-wrap">
          {SECTIONS.map((section) => (
            <li key={section}>
              <a
                href={`#account-${section}`}
                className="hover:border-brand-500 inline-flex min-h-11 items-center rounded-full border border-mist-200 bg-white px-4 text-[14px] font-semibold whitespace-nowrap text-navy-900 outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                {t(`sections.${section}`)}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {error ? (
        <Alert variant="warning" role="alert">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>{t(`errors.${error}`)}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-8">
          <section aria-labelledby="account-requests" className="flex scroll-mt-24 flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 id="account-requests" className={h2}>
                {t("requestsTitle")}
              </h2>
              <p className={lead}>{t("requestsLead", { email: customer.email })}</p>
            </div>
            {requests.length > 0 ? (
              <ul className="flex flex-col gap-3">{requests.map(requestCard)}</ul>
            ) : (
              <div className={empty}>
                <Plane aria-hidden="true" className="size-6 text-brand-700" />
                <p className="text-[15px] text-mist-700">{t("requestsEmpty")}</p>
                <Button asChild variant="secondary">
                  <Link href="/tour-packages">{t("explore")}</Link>
                </Button>
              </div>
            )}
            <p className="text-[13.5px] leading-relaxed text-mist-600">{t("phoneNote")}</p>
          </section>

          <section aria-labelledby="account-visa" className="flex scroll-mt-24 flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 id="account-visa" className={h2}>
                {t("visaTitle")}
              </h2>
              <p className={lead}>{t("visaLead")}</p>
            </div>
            {visas.length > 0 ? (
              <ul className="flex flex-col gap-3">{visas.map(requestCard)}</ul>
            ) : (
              <div className={empty}>
                <Stamp aria-hidden="true" className="size-6 text-brand-700" />
                <p className="text-[15px] text-mist-700">{t("visaEmpty")}</p>
                <Button asChild variant="secondary">
                  <Link href="/visa">{t("visaApply")}</Link>
                </Button>
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-8">
          <section aria-labelledby="account-orders" className="flex scroll-mt-24 flex-col gap-4">
            <h2 id="account-orders" className={h2}>
              {t("ordersTitle")}
            </h2>
            {orders.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {orders.map((order) => (
                  <li
                    key={order.reference}
                    className="flex flex-col gap-2 rounded-2xl border border-mist-200 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-[13px] font-semibold text-ink-900 tabular-nums">
                        {order.reference}
                      </span>
                      <span className={chip}>{t(`orderStatus.${order.status as "placed"}`)}</span>
                    </div>
                    <p className="flex flex-wrap justify-between gap-2 text-[14px] text-mist-700">
                      <span>{t("placed", { date: formatDate(order.createdAt) })}</span>
                      <span className="font-semibold text-navy-900 tabular-nums">
                        {t("total", { total: formatTaka(order.total) })}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={empty}>
                <PackageOpen aria-hidden="true" className="size-6 text-brand-700" />
                <p className="text-[15px] text-mist-700">{t("ordersEmpty")}</p>
                <Button asChild variant="secondary">
                  <Link href="/shop">{t("shop")}</Link>
                </Button>
              </div>
            )}
          </section>

          <section aria-labelledby="account-wishlist" className="flex scroll-mt-24 flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 id="account-wishlist" className={h2}>
                {t("wishlist.title")}
              </h2>
              <p className={lead}>{t("wishlist.lead")}</p>
            </div>
            {saved.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {saved.map((item) => (
                  <li
                    key={`${item.kind}:${item.slug}`}
                    className="flex items-center gap-3 rounded-2xl border border-mist-200 bg-white p-2.5"
                  >
                    {item.image ? (
                      <SmartImage
                        src={item.image.src}
                        alt=""
                        width={64}
                        height={64}
                        sizes="64px"
                        className="size-16 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="size-16 shrink-0 rounded-xl bg-mist-100"
                      />
                    )}
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <Link
                        href={item.href}
                        className="truncate text-[15px] font-semibold text-navy-900 outline-none hover:text-brand-700 focus-visible:underline"
                      >
                        {item.title}
                      </Link>
                      <span className="truncate text-[13px] text-mist-600 tabular-nums">
                        {item.note}
                      </span>
                    </span>
                    <WishlistRemoveButton
                      kind={item.kind}
                      slug={item.slug}
                      label={t("wishlist.remove", { name: item.title })}
                      removed={t("wishlist.removed")}
                      errors={errors}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <div className={empty}>
                <Heart aria-hidden="true" className="size-6 text-brand-700" />
                <p className="text-[15px] text-mist-700">{t("wishlist.empty")}</p>
              </div>
            )}
          </section>
        </div>
      </div>

      <section aria-labelledby="account-travellers" className="flex scroll-mt-24 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="account-travellers" className={h2}>
            {t("travellers.title")}
          </h2>
          <p className={lead}>{t("travellers.lead")}</p>
        </div>
        <TravellersEditor
          travellers={account.travellers}
          nationalities={nationalities}
          errors={errors}
          labels={{
            empty: t("travellers.empty"),
            add: t("travellers.add"),
            edit: t("travellers.edit", { name: "{name}" }),
            remove: t("travellers.remove", { name: "{name}" }),
            fullName: t("travellers.fullName"),
            dateOfBirth: t("travellers.dateOfBirth"),
            nationality: t("travellers.nationality"),
            passportNumber: t("travellers.passportNumber"),
            passportKeep: t("travellers.passportKeep"),
            passportExpiry: t("travellers.passportExpiry"),
            passport: t("travellers.passport", { masked: "{masked}" }),
            expires: t("travellers.expires", { date: "{date}" }),
            save: t("travellers.save"),
            cancel: t("travellers.cancel"),
            saved: t("travellers.saved"),
            removedDone: t("travellers.removedDone"),
            full: t("travellers.full"),
          }}
        />
      </section>

      <section aria-labelledby="account-addresses" className="flex scroll-mt-24 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 id="account-addresses" className={h2}>
            {t("addresses.title")}
          </h2>
          <p className={lead}>{t("addresses.lead")}</p>
        </div>
        <AddressesEditor
          addresses={account.addresses}
          countries={countries}
          errors={errors}
          labels={{
            empty: t("addresses.empty"),
            add: t("addresses.add"),
            edit: t("addresses.edit"),
            remove: t("addresses.remove"),
            label: t("addresses.label"),
            labelHint: t("addresses.labelHint"),
            name: t("addresses.name"),
            phone: t("addresses.phone"),
            country: t("addresses.country"),
            division: t("addresses.division"),
            district: t("addresses.district"),
            area: t("addresses.area"),
            street: t("addresses.street"),
            default: t("addresses.default"),
            isDefault: t("addresses.isDefault"),
            makeDefault: t("addresses.makeDefault"),
            save: t("addresses.save"),
            cancel: t("addresses.cancel"),
            saved: t("addresses.saved"),
            removedDone: t("addresses.removedDone"),
            full: t("addresses.full"),
          }}
        />
      </section>

      <section aria-labelledby="account-settings" className="flex scroll-mt-24 flex-col gap-4">
        <h2 id="account-settings" className={h2}>
          {t("settings.title")}
        </h2>
        <AccountSettings
          notifyOffers={account.preferences.notifyOffers}
          hasPassword={account.hasPassword}
          signIns={account.signIns}
          errors={errors}
          labels={{
            offers: t("settings.offers"),
            offersHint: t("settings.offersHint"),
            offersSaved: t("settings.offersSaved"),
            passwordTitle: t("settings.passwordTitle"),
            passwordLead: t("settings.passwordLead"),
            passwordNew: t("settings.passwordNew"),
            passwordHint: t("settings.passwordHint"),
            passwordSet: t("settings.passwordSet"),
            passwordChange: t("settings.passwordChange"),
            passwordRemove: t("settings.passwordRemove"),
            passwordSaved: t("settings.passwordSaved"),
            passwordRemoved: t("settings.passwordRemoved"),
            passwordShort: t("settings.passwordShort"),
            signInsTitle: t("settings.signInsTitle"),
            thisDevice: t("settings.thisDevice"),
            signedOut: t("settings.signedOut"),
            signOutOthers: t("settings.signOutOthers"),
            signedOutNone: t("settings.signedOutNone"),
            signedOutOne: t("settings.signedOutOne"),
            signedOutMany: t("settings.signedOutMany", { count: "{count}" }),
          }}
        />
      </section>

      <section
        aria-labelledby="account-delete"
        className="flex flex-col gap-3 rounded-2xl border border-mist-200 bg-white p-5"
      >
        <h2 id="account-delete" className="font-display text-[17px] font-bold text-navy-900">
          {t("deleteTitle")}
        </h2>
        <p className="text-[14px] leading-relaxed text-mist-700">{t("deleteBody")}</p>
        <form method="post" action="/api/account/delete" className="flex flex-col gap-3">
          <div className="flex min-h-11 items-center gap-3">
            <Checkbox id="account-delete-confirm" name="confirm" value="yes" required />
            <Label htmlFor="account-delete-confirm" className="text-[14.5px] text-ink-900">
              {t("deleteConfirm")}
            </Label>
          </div>
          <Button type="submit" variant="danger" className="self-start">
            {t("deleteButton")}
          </Button>
        </form>
      </section>
    </main>
  );
}

/**
 * /account (issues 134, 278): who is signed in; requests and visa applications with their progress; orders; the
 * wishlist; saved travellers and addresses; offer emails, an optional password and recent sign-ins; delete account.
 */
export default function AccountPage({ searchParams }: PageProps<"/[locale]/account">) {
  return (
    <Suspense
      fallback={
        <main
          id="main"
          aria-busy="true"
          className="site-container flex min-h-dvh flex-col gap-6 pt-6 pb-28"
        >
          <Skeleton className="h-5 w-40 rounded-full" />
          <Skeleton className="h-32 rounded-[24px]" />
          <Skeleton className="h-[320px] rounded-2xl" />
        </main>
      }
    >
      <AccountContent searchParams={searchParams} />
    </Suspense>
  );
}
