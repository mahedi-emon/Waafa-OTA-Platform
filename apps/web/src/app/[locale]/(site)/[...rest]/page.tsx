import { notFound } from "next/navigation";

/** Any URL no other route matches lands here and renders the branded 404 inside the site frame (next-intl pattern). */
export default function CatchAllPage() {
  notFound();
}
