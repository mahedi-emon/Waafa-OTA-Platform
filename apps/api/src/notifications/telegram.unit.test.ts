import { describe, expect, it } from "vitest";
import type { Fetcher } from "../providers/catalogAdapters";
import { checkTelegramGroup, findTelegramGroups, sendTelegram, telegramProblem } from "./telegram";

const TOKEN = "123456789:AAEexampleexampleexampleexample1234";

function fake(answers: Record<string, { status: number; body: unknown }>) {
  const calls: Array<{ method: string; body: Record<string, unknown> }> = [];
  const fetcher: Fetcher = (url, init) => {
    const method = url.split("/").pop() ?? "";
    calls.push({ method, body: JSON.parse(String(init.body ?? "{}")) as Record<string, unknown> });
    const answer = answers[method] ?? { status: 200, body: { ok: true, result: {} } };
    return Promise.resolve({ status: answer.status, json: async () => answer.body });
  };
  return { calls, fetcher };
}

describe("Telegram (issue 252)", () => {
  it("sends plain text with no parse mode, so nothing in it is interpreted", async () => {
    const { calls, fetcher } = fake({});
    await sendTelegram(TOKEN, "-1001", "<b>New</b> *request*", fetcher);
    expect(calls[0]).toEqual({
      method: "sendMessage",
      body: { chat_id: "-1001", text: "<b>New</b> *request*", disable_web_page_preview: true },
    });
  });

  it("finds groups and channels the bot has seen, newest first, without private chats", async () => {
    const { fetcher } = fake({
      getUpdates: {
        status: 200,
        body: {
          ok: true,
          result: [
            { message: { chat: { id: -1001111111111, type: "supergroup", title: "Old group" } } },
            { message: { chat: { id: 4242, type: "private", first_name: "Owner" } } },
            {
              my_chat_member: {
                chat: { id: -1002222222222, type: "supergroup", title: "Waafa sales" },
              },
            },
            { message: { chat: { id: -1001111111111, type: "supergroup", title: "Old group" } } },
          ],
        },
      },
    });
    expect(await findTelegramGroups(TOKEN, fetcher)).toEqual([
      { id: "-1001111111111", title: "Old group" },
      { id: "-1002222222222", title: "Waafa sales" },
    ]);
  });

  it.each([
    [{ getUpdates: { status: 401, body: { ok: false } } }, "does not know this bot token"],
    [
      {
        getUpdates: {
          status: 409,
          body: {
            ok: false,
            description: "Conflict: can't use getUpdates method while webhook is active",
          },
        },
      },
      "webhook",
    ],
    [{ getUpdates: { status: 200, body: { ok: true, result: [] } } }, "No group found yet"],
  ])("Find my group explains a problem in one sentence (%#)", async (answers, words) => {
    await expect(findTelegramGroups(TOKEN, fake(answers).fetcher)).rejects.toThrow(words);
  });

  it("refuses a token that is not a bot token before calling Telegram", async () => {
    const { calls, fetcher } = fake({});
    await expect(findTelegramGroups("not-a-token", fetcher)).rejects.toThrow("@BotFather");
    expect(calls).toEqual([]);
  });

  it.each([
    [400, "Bad Request: chat not found", "cannot find this group"],
    [403, "Forbidden: bot was kicked from the supergroup chat", "not in the group"],
    [403, "Forbidden: bot is not a member of the supergroup chat", "not in the group"],
    [400, "Bad Request: not enough rights to send text messages to the chat", "may not write"],
    [429, "Too Many Requests: retry after 5", "slow down"],
  ])("Test connection: HTTP %s %s → plain words", async (status, description, words) => {
    const { fetcher } = fake({ sendMessage: { status, body: { ok: false, description } } });
    const health = await checkTelegramGroup(
      { environment: "production", settings: { chatId: "-1001" }, secrets: { botToken: TOKEN } },
      fetcher,
    );
    expect(health.ok).toBe(false);
    expect(health.message).toContain(words);
  });

  it("Test connection posts a test message when the bot and group are right", async () => {
    const { calls, fetcher } = fake({});
    const health = await checkTelegramGroup(
      { environment: "production", settings: { chatId: "-1001" }, secrets: { botToken: TOKEN } },
      fetcher,
    );
    expect(health.ok).toBe(true);
    expect(calls.map((call) => call.method)).toEqual(["getMe", "sendMessage"]);
  });

  it("names the new chat ID when a group became a supergroup", () => {
    expect(
      telegramProblem(400, {
        description: "Bad Request: group chat was upgraded to a supergroup chat",
        parameters: { migrate_to_chat_id: -1009 },
      }),
    ).toContain("-1009");
  });
});
