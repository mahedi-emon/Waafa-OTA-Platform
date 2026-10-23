import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { pickMessagePaths } from "@/i18n/pickMessages";
import { DataTableView, type DataTableViewProps } from "./DataTableView";

type AdminDataTableProps = DataTableViewProps & {
  /** Words the rows' own buttons need (Admin.proofDecision…), passed with the table's. */
  messagePaths?: string[];
};

/** A list page's table with its words in a scoped provider (D190): only the table's strings reach the browser. */
async function AdminDataTable({ messagePaths = [], ...props }: AdminDataTableProps) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={pickMessagePaths(messages, ["Admin.table", ...messagePaths])}>
      <DataTableView {...props} />
    </NextIntlClientProvider>
  );
}

export { AdminDataTable };
