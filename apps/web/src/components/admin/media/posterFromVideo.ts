"use client";

/** Posters are drawn at most this wide: sharp on a 1440 px screen, small to upload. */
const MAX_WIDTH = 1920;

/**
 * A still from a video file before it is uploaded (D0 R3): the frame at one second (or a tenth in for short clips),
 * as a JPEG the library then re-encodes. It is the clip's own footage, so the poster stays a real photo. Resolves
 * to null when the browser can't read the file (an unsupported codec): staff then choose a poster themselves.
 */
export function posterFromVideo(file: File, timeoutMs = 15_000): Promise<File | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    let settled = false;
    const finish = (poster: File | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      resolve(poster);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      video.currentTime = duration > 2 ? 1 : duration / 10;
    };
    video.onseeked = () => {
      const width = Math.min(MAX_WIDTH, video.videoWidth);
      if (!width || !video.videoHeight) return finish(null);
      const height = Math.round((video.videoHeight / video.videoWidth) * width);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) return finish(null);
      context.drawImage(video, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          const name = `${file.name.replace(/\.[a-z0-9]{2,5}$/i, "")}-poster.jpg`;
          finish(blob ? new File([blob], name, { type: "image/jpeg" }) : null);
        },
        "image/jpeg",
        0.9,
      );
    };
    video.onerror = () => finish(null);
    video.src = url;
  });
}
