import type { HealthResult, ProviderContext } from "../providers/adapters";
import type { Fetcher } from "../providers/catalogAdapters";

/** What Telegram said, in one plain sentence for staff. */
export class TelegramError extends Error {}

export type TelegramGroup = { id: string; title: string };

const API = "https://api.telegram.org";

async function telegram(
  fetcher: Fetcher,
  token: string,
  method: string,
  payload: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<{ status: number; body: Record<string, unknown> | null }> {
  if (!/^\d{6,12}:[A-Za-z0-9_-]{30,50}$/.test(token))
    throw new TelegramError("The bot token does not look right. Copy it again from @BotFather.");
  let response: Awaited<ReturnType<Fetcher>>;
  try {
    response = await fetcher(`${API}/bot${token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: signal ?? AbortSignal.timeout(10_000),
    });
  } catch {
    throw new TelegramError("Telegram did not answer. Try again in a minute.");
  }
  const body = (await response.json?.().catch(() => null)) as Record<string, unknown> | null;
  return { status: response.status, body: body && typeof body === "object" ? body : null };
}

/** Telegram's error answers, in plain words. */
export function telegramProblem(status: number, body: Record<string, unknown> | null): string {
  const said = typeof body?.description === "string" ? body.description : "";
  if (status === 401 || status === 404)
    return "Telegram does not know this bot token. Copy it again from @BotFather.";
  if (status === 409 || /webhook is active/i.test(said))
    return "This bot sends its messages to a webhook, so we cannot read its groups. Use a new bot from @BotFather.";
  if (/upgraded to a supergroup/i.test(said)) {
    const parameters = body?.parameters as { migrate_to_chat_id?: unknown } | undefined;
    const next = parameters?.migrate_to_chat_id;
    return next
      ? `The group became a supergroup; its new chat ID is ${String(next)}. Use Find my group again.`
      : "The group became a supergroup. Use Find my group again.";
  }
  if (/chat not found/i.test(said))
    return "Telegram cannot find this group. Add the bot to the group, then use Find my group.";
  if (/kicked|not a member|blocked/i.test(said))
    return "The bot is not in the group any more. Add it back, then test again.";
  if (/not enough rights|have no rights/i.test(said))
    return "The bot may not write in this group. Let members (or the bot) send messages, then test again.";
  if (status === 429) return "Telegram asks us to slow down. Try again in a minute.";
  return said ? `Telegram said: ${said.slice(0, 160)}` : `Telegram answered HTTP ${status}.`;
}

/** Posts one plain-text message (no Markdown or HTML parse mode, so nothing in it is interpreted). */
export async function sendTelegram(
  token: string,
  chatId: string,
  text: string,
  fetcher: Fetcher = fetch,
  signal?: AbortSignal,
): Promise<void> {
  const { status, body } = await telegram(
    fetcher,
    token,
    "sendMessage",
    { chat_id: chatId, text: text.slice(0, 4000), disable_web_page_preview: true },
    signal,
  );
  if (status !== 200 || body?.ok !== true) throw new TelegramError(telegramProblem(status, body));
}

/**
 * "Find my group" (issue 252): the groups the bot has seen in the last 24 hours (it was added, or someone wrote in the
 * group), newest first, read from getUpdates without marking them read.
 */
export async function findTelegramGroups(
  token: string,
  fetcher: Fetcher = fetch,
): Promise<TelegramGroup[]> {
  const { status, body } = await telegram(fetcher, token, "getUpdates", {
    limit: 100,
    timeout: 0,
    allowed_updates: ["message", "my_chat_member", "channel_post", "edited_message"],
  });
  if (status !== 200 || body?.ok !== true) throw new TelegramError(telegramProblem(status, body));
  const updates = Array.isArray(body.result) ? (body.result as Record<string, unknown>[]) : [];
  const seen = new Map<string, TelegramGroup>();
  for (const update of [...updates].reverse()) {
    for (const key of ["message", "my_chat_member", "channel_post", "edited_message"]) {
      const chat = (update[key] as { chat?: { id?: unknown; title?: unknown; type?: unknown } })
        ?.chat;
      if (!chat || !["group", "supergroup", "channel"].includes(String(chat.type))) continue;
      const id = String(chat.id);
      if (!/^-?\d{5,20}$/.test(id) || seen.has(id)) continue;
      seen.set(id, { id, title: typeof chat.title === "string" ? chat.title : id });
    }
  }
  if (seen.size === 0)
    throw new TelegramError(
      "No group found yet. Add the bot to your sales group, write any message there, then press Find my group again.",
    );
  return [...seen.values()];
}

/** Test connection for the Telegram card: the token is real, then a short test message reaches the group. */
export async function checkTelegramGroup(
  context: ProviderContext,
  fetcher: Fetcher = fetch,
): Promise<HealthResult> {
  const token = context.secrets.botToken ?? "";
  const chatId = context.settings.chatId ?? "";
  if (!token || !chatId)
    return { ok: false, message: "Fill in the bot token and the group chat ID first, then save." };
  try {
    const me = await telegram(fetcher, token, "getMe", {}, context.signal);
    if (me.status !== 200 || me.body?.ok !== true)
      return { ok: false, message: telegramProblem(me.status, me.body) };
    await sendTelegram(
      token,
      chatId,
      "WAAFA test: new requests and orders will be posted here.",
      fetcher,
      context.signal,
    );
    return {
      ok: true,
      message: "A test message reached the group. Turn the card on to get alerts.",
    };
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
}
