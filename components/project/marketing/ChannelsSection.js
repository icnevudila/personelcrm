"use client";

import { SectionCard, selectCls, textareaCls } from "./ui";
import { patchChannel } from "@/lib/marketing/clientApi";
import { PRIORITIES } from "@/lib/marketing/constants";

export default function ChannelsSection({ projectId, channels, onChannelUpdate }) {
  async function handleChange(channel, field, value) {
    const updated = await patchChannel(projectId, channel.id, { [field]: value });
    onChannelUpdate(updated);
  }

  const enabledCount = channels.filter((c) => c.enabled).length;

  return (
    <SectionCard
      title="Distribution Channels"
      description={`${enabledCount} / ${channels.length} kanal aktif`}
    >
      <div className="space-y-2">
        {channels.map((channel) => (
          <div
            key={channel.id}
            className="flex flex-col gap-2 rounded-lg border border-zinc-100 p-3 sm:flex-row sm:items-center dark:border-zinc-800"
          >
            <label className="flex min-w-[10rem] items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
              <input
                type="checkbox"
                checked={channel.enabled}
                onChange={(e) => handleChange(channel, "enabled", e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300"
              />
              {channel.platform}
            </label>
            <select
              value={channel.priority}
              onChange={(e) => handleChange(channel, "priority", e.target.value)}
              className={`${selectCls} sm:w-28`}
            >
              {PRIORITIES.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <input
              value={channel.notes || ""}
              onChange={(e) => handleChange(channel, "notes", e.target.value)}
              onBlur={(e) => handleChange(channel, "notes", e.target.value)}
              placeholder="Not"
              className={`${textareaCls} !min-h-0 sm:flex-1`}
              rows={1}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
