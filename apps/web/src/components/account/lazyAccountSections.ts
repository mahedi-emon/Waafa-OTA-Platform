"use client";

import dynamic from "next/dynamic";

/**
 * My account's editors load with the signed-in page only (issue 278). Imported straight into the server page, their
 * code joined the route's first load even when /account answers 404 or sends a visitor to /login.
 */
const AccountSettings = dynamic(() =>
  import("./AccountSettings").then((module) => module.AccountSettings),
);
const AddressesEditor = dynamic(() =>
  import("./AddressesEditor").then((module) => module.AddressesEditor),
);
const TravellersEditor = dynamic(() =>
  import("./TravellersEditor").then((module) => module.TravellersEditor),
);
const WishlistRow = dynamic(() => import("./WishlistRow").then((module) => module.WishlistRow));

export { AccountSettings, AddressesEditor, TravellersEditor, WishlistRow };
