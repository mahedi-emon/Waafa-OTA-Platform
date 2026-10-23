"use client";

import dynamic from "next/dynamic";

/**
 * The video widget as its own chunk (D202): editors without it never load it (or react-dropzone); editors with it
 * get it with their first load, still rendered on the server.
 */
const LazyVideoField = dynamic(() => import("./VideoField").then((module) => module.VideoField));

export { LazyVideoField };
