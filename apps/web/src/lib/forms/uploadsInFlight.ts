/**
 * Files still uploading on this page (issue 232). A form that is sent while a DocumentSlot is uploading would go
 * without that file, so forms check this first and ask the visitor to wait a moment.
 */
let inFlight = 0;

/** Marks one upload as started; call the returned function once it ends (calling it twice is harmless). */
export function beginUpload(): () => void {
  inFlight += 1;
  let ended = false;
  return () => {
    if (ended) return;
    ended = true;
    inFlight -= 1;
  };
}

/** True while any file on the page is still uploading. */
export function uploadsInFlight(): boolean {
  return inFlight > 0;
}
