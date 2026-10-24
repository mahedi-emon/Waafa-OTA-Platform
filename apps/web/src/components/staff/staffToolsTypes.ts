/** What /secure-admin-control/api/staff-tools answers for one page (D0 R7). */
export type StaffToolsData = {
  /** Where Edit this page goes, or null when this person can't edit what the page shows. */
  edit: string | null;
  /** "Edit Hero" and so on, by home section key; empty when this person can't edit the home sections. */
  sections: Record<string, string>;
  labels: {
    region: string;
    edit: string;
    admin: string;
    more: string;
    editSections: string;
    exitPreview: string;
    hide: string;
  };
};
