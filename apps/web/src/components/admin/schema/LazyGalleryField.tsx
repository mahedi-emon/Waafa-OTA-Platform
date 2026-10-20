"use client";

import dynamic from "next/dynamic";

/**
 * The gallery widget as its own chunk (D202): editors without it never load it (or react-dropzone); editors with it
 * get it with their first load, still rendered on the server.
 */
const LazyGalleryField = dynamic(() =>
  import("./GalleryField").then((module) => module.GalleryField),
);

export { LazyGalleryField };
