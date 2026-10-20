"use client";

import dynamic from "next/dynamic";

/**
 * The photo widget as its own chunk (D202): editors without it never load it (or react-dropzone); editors with it
 * get it with their first load, still rendered on the server.
 */
const LazyMediaField = dynamic(() => import("./MediaField").then((module) => module.MediaField));

export { LazyMediaField };
