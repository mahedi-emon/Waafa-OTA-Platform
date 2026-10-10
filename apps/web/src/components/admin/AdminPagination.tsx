import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

type AdminPaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  /** The list's path and current query, without `page`. */
  path: string;
  query: Record<string, string | undefined>;
  strings: { previous: string; next: string; summary: string };
};

function hrefFor(path: string, query: Record<string, string | undefined>, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value) params.set(key, value);
  if (page > 1) params.set("page", String(page));
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

/** Previous / next pages for admin lists, as links that keep the filters (URL state). */
function AdminPagination({ page, pageSize, total, path, query, strings }: AdminPaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between gap-3 border-t border-mist-100 px-5 py-3">
      <p className="text-[13.5px] text-mist-600">{strings.summary}</p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Button asChild variant="secondary" size="sm">
            <Link href={hrefFor(path, query, page - 1)} prefetch={false}>
              <ChevronLeft aria-hidden="true" className="size-4" />
              {strings.previous}
            </Link>
          </Button>
        ) : null}
        {page < pages ? (
          <Button asChild variant="secondary" size="sm">
            <Link href={hrefFor(path, query, page + 1)} prefetch={false}>
              {strings.next}
              <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export { AdminPagination };
