"use client";

import { useId, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

type BookingDocumentUploadProps = {
  bookingId: string;
  labels: { add: string; adding: string; added: string; failed: string };
};

/** Adds an e-ticket, voucher or invoice to a booking (issue 242): PDF, JPG or PNG up to 5 MB, scanned by the API. */
function BookingDocumentUpload({ bookingId, labels }: BookingDocumentUploadProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function send(file: File) {
    setBusy(true);
    try {
      const query = new URLSearchParams({ id: bookingId, name: file.name.slice(0, 120) });
      const response = await fetch(`/secure-admin-control/files/attach?${query.toString()}`, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) {
        const problem = (await response.json().catch(() => ({}))) as { detail?: string };
        toast.error(problem.detail ?? labels.failed);
        return;
      }
      toast.success(labels.added);
      router.refresh();
    } catch {
      toast.error(labels.failed);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={input}
        id={id}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void send(file);
        }}
      />
      <Button
        type="button"
        variant="secondary"
        loading={busy}
        onClick={() => input.current?.click()}
      >
        <Upload aria-hidden="true" />
        {busy ? labels.adding : labels.add}
      </Button>
    </div>
  );
}

export { BookingDocumentUpload };
