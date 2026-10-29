"use client";

import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { findTelegramGroups } from "@/lib/admin/providerActions";
import { fill, type IntegrationStrings } from "./integrationStrings";

type TelegramGroupFinderProps = {
  /** The bot token typed in the form; empty uses the saved one. */
  botToken: string;
  onPick: (chatId: string) => void;
  strings: IntegrationStrings["telegram"];
};

type Group = { id: string; title: string };

/**
 * "Find my group" on the Telegram card (issue 252): after the owner adds the bot to the sales group and writes a
 * message there, this reads the groups the bot has seen and fills Group chat ID with one tap. A single group fills it
 * at once.
 */
function TelegramGroupFinder({ botToken, onPick, strings }: TelegramGroupFinderProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function find() {
    startTransition(async () => {
      const result = await findTelegramGroups(botToken);
      if (!result.ok) {
        setGroups([]);
        setMessage(result.problem.detail ?? strings.failed);
        return;
      }
      const found = result.data.groups;
      setGroups(found);
      const only = found.length === 1 ? found[0] : undefined;
      if (only) {
        onPick(only.id);
        setMessage(fill(strings.filled, { title: only.title }));
      } else {
        setMessage(fill(strings.pick, { count: String(found.length) }));
      }
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-mist-200 bg-mist-50 p-3 md:col-span-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="secondary" loading={pending} onClick={find}>
          <Search aria-hidden="true" className="size-4" />
          {strings.find}
        </Button>
        <p className="min-w-0 text-[13px] text-mist-700">{strings.hint}</p>
      </div>
      <p role="status" className="text-[13.5px] text-ink-900">
        {message}
      </p>
      {groups.length > 1 ? (
        <ul className="flex flex-wrap gap-2">
          {groups.map((group) => (
            <li key={group.id}>
              <Button
                type="button"
                size="sm"
                variant="soft"
                onClick={() => {
                  onPick(group.id);
                  setMessage(fill(strings.filled, { title: group.title }));
                }}
              >
                {fill(strings.use, { title: group.title })}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export { TelegramGroupFinder };
