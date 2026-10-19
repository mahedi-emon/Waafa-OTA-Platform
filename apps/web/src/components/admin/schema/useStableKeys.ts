"use client";

import { useState } from "react";

let counter = 0;
const nextKey = () => `item-${(counter += 1)}`;
const makeKeys = (length: number) => Array.from({ length }, nextKey);

export type StableKeys = {
  keys: string[];
  /** Call in the same event as the list change, so each item keeps its key (and its focus and open state). */
  move: (from: number, to: number) => void;
  insert: (at: number) => void;
  remove: (at: number) => void;
};

/**
 * React keys for a list whose items have no ids of their own. Keys follow items through moves, inserts and removals;
 * when the list is replaced from outside (a restored draft or version), the keys are rebuilt.
 */
export function useStableKeys(length: number): StableKeys {
  const [state, setState] = useState(() => ({ length, keys: makeKeys(length) }));
  if (state.length !== length) {
    // The list changed without one of the calls below: keep what still fits and add keys for the rest.
    const keys = state.keys.slice(0, length);
    while (keys.length < length) keys.push(nextKey());
    setState({ length, keys });
  }
  const update = (change: (keys: string[]) => string[]) =>
    setState((current) => {
      const keys = change([...current.keys]);
      return { length: keys.length, keys };
    });
  return {
    keys: state.keys,
    move: (from, to) =>
      update((keys) => {
        const [moved] = keys.splice(from, 1);
        if (moved) keys.splice(to, 0, moved);
        return keys;
      }),
    insert: (at) =>
      update((keys) => {
        keys.splice(at, 0, nextKey());
        return keys;
      }),
    remove: (at) =>
      update((keys) => {
        keys.splice(at, 1);
        return keys;
      }),
  };
}
