import { AdminNotFound } from "@/components/admin/AdminNotFound";

/** Any admin read that finds nothing (`notFound()`), inside the admin frame (issue 225). */
export default function PanelNotFound() {
  return <AdminNotFound />;
}
