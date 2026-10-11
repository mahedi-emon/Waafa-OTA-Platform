/**
 * Public toasts without the toast library in the first load (issue 91). `LazyToaster` mounts the real toaster when
 * the browser is idle or on the first `notify` call; `notify` waits for it, then shows the toast through sonner.
 */

type ToastKind = "success" | "error";
type ToastOptions = { description?: string };

let resolveReady: (() => void) | undefined;
const ready = new Promise<void>((resolve) => {
  resolveReady = resolve;
});
const requests = new Set<() => void>();
let requested = false;

/** Called by the lazily loaded toaster once it listens for toasts. */
function markToasterReady(): void {
  resolveReady?.();
}

/** Lets `LazyToaster` mount at once when a toast is waiting. Returns an unsubscribe function. */
function onToasterRequest(listener: () => void): () => void {
  if (requested) listener();
  requests.add(listener);
  return () => {
    requests.delete(listener);
  };
}

/** Mounts the toaster if needed; resolves once toasts can be shown. */
function whenToasterReady(): Promise<void> {
  if (!requested) {
    requested = true;
    for (const listener of requests) listener();
  }
  return ready;
}

function notify(kind: ToastKind, message: string, options?: ToastOptions): void {
  void whenToasterReady()
    .then(() => import("sonner"))
    .then(({ toast }) => {
      toast[kind](message, options);
    });
}

export { markToasterReady, notify, onToasterRequest, whenToasterReady };
