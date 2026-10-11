/** Admin › Integrations chrome strings; `{name}`-style placeholders are filled in on the client. */
export type IntegrationStrings = {
  environment: string;
  sandbox: string;
  production: string;
  notConnected: string;
  connected: string;
  inUse: string;
  custom: string;
  statusActive: string;
  statusOff: string;
  modeSandbox: string;
  modeLive: string;
  active: string;
  activeHint: string;
  live: string;
  liveHint: string;
  markup: string;
  markupNone: string;
  markupPercentage: string;
  markupFixed: string;
  markupValue: string;
  markupPercentHint: string;
  markupFixedHint: string;
  saveSetting: string;
  /** Contains {name}. */
  settingSaved: string;
  credentials: string;
  /** Contains {last4}. */
  secretSaved: string;
  secretSavedShort: string;
  /** Contains {field}. */
  show: string;
  /** Contains {field}. */
  hide: string;
  reveal: string;
  revealHint: string;
  /** Contains {field}. */
  revealedLabel: string;
  optional: string;
  connect: string;
  manage: string;
  close: string;
  test: string;
  remove: string;
  /** Contains {name} and {environment}. */
  removeConfirm: string;
  removeProvider: string;
  /** Contains {name}. */
  removeProviderConfirm: string;
  /** Contains {name}. */
  savedToast: string;
  /** Contains {name}. */
  removedToast: string;
  healthOk: string;
  healthFail: string;
  neverTested: string;
  note: string;
  /** Contains {time} and {name}. */
  updated: string;
  save: string;
  failed: string;
};

export const fill = (text: string, values: Record<string, string>) =>
  text.replace(/\{(\w+)\}/g, (_match, key: string) => values[key] ?? "");
