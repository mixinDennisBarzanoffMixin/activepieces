import { t } from 'i18next';
import { Dot, FolderIcon, User } from 'lucide-solid';
import { Show, For } from 'solid-js';

import { TableIcon } from '@/components/icons/table';
import { WorkflowIcon } from '@/components/icons/workflow';

import { type SearchResultItem } from './use-global-search-results';

function timeAgo(date: Date | string): string {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type ItemIconProps = {
  type: string;
  pageIcon?: any;
  iconBgColor?: string;
  iconTextColor?: string;
  iconLetter?: string;
};

function ItemIcon({
  type,
  pageIcon: PageIcon,
  iconBgColor,
  iconTextColor,
  iconLetter,
}: ItemIconProps) {
  if (type === 'project') {
    if (iconBgColor) {
      return (
        <span
          className="flex size-5 shrink-0 items-center justify-center rounded-[4px] text-[10px] font-bold"
          style={{ backgroundColor: iconBgColor, color: iconTextColor }}
        >
          {iconLetter}
        </span>
      );
    }
    return <User class="size-4 shrink-0 text-muted-foreground" />;
  }

  if (type === 'flow') {
    return (
      <span className="[&_svg]:text-violet-500! shrink-0">
        <WorkflowIcon class="size-4" />
      </span>
    );
  }

  if (type === 'table') {
    return (
      <span className="[&_svg]:text-emerald-500! shrink-0">
        <TableIcon class="size-4" />
      </span>
    );
  }

  if (type === 'folder') {
    return (
      <FolderIcon
        class="size-4 shrink-0 text-muted-foreground"
        fill="currentColor"
        strokeWidth={0}
      />
    );
  }

  if (type === 'page' && PageIcon) {
    return <PageIcon class="size-4 shrink-0 text-muted-foreground" />;
  }

  return null;
}

function ItemMeta({
  projectName,
  folderName,
  updated,
}: {
  projectName?: string | null;
  folderName?: string | null;
  updated?: string | null;
}) {
  const hasProject = !!projectName;
  const hasFolder = !!folderName;
  const hasUpdated = updated != null;

  if (!hasProject && !hasFolder && !hasUpdated) return null;

  return (
    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground/80">
      <span>—</span>
      {
        <Show when={hasProject}>
          <span>{projectName}</span>
        </Show>
      }
      {
        <Show when={hasProject && hasFolder}>
          <span>/</span>
        </Show>
      }
      {
        <Show when={hasFolder}>
          <span className="flex items-center gap-0.5">
            <FolderIcon
              class="size-4! mr-0.5 text-muted-foreground/80 shrink-0"
              fill="currentColor"
              strokeWidth={0}
            />
            <span>{folderName}</span>
          </span>
        </Show>
      }
      {
        <Show when={(hasProject || hasFolder) && hasUpdated}>
          <Dot class="size-3! shrink-0 text-muted-foreground/80" />
        </Show>
      }
      {
        <Show when={hasUpdated}>
          <span className="whitespace-nowrap">{`Last Modified: ${timeAgo(
            updated!,
          )}`}</span>
        </Show>
      }
    </span>
  );
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts: { text: string; match: boolean }[] = [];
  let lastIndex = 0;
  let idx = lowerText.indexOf(lowerQuery);
  while (idx !== -1) {
    if (idx > lastIndex)
      parts.push({ text: text.slice(lastIndex, idx), match: false });
    parts.push({ text: text.slice(idx, idx + query.length), match: true });
    lastIndex = idx + query.length;
    idx = lowerText.indexOf(lowerQuery, lastIndex);
  }
  if (lastIndex < text.length)
    parts.push({ text: text.slice(lastIndex), match: false });
  return (
    <>
      {
        <For each={parts}>
          {(part, i) => (
            <Show when={part.match} fallback={part.text}>
              <span className="font-semibold">{part.text}</span>
            </Show>
          )}
        </For>
      }
    </>
  );
}

export function SearchResultRow({
  item,
  query,
}: {
  item: SearchResultItem;
  query?: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <ItemIcon
        type={item.type}
        pageIcon={item.pageIcon}
        iconBgColor={item.iconBgColor}
        iconTextColor={item.iconTextColor}
        iconLetter={item.iconLetter}
      />
      <span className="min-w-0 shrink truncate text-sm font-normal">
        <HighlightText text={item.label} query={query ?? ''} />
      </span>
      {
        <Show when={item.status === 'ENABLED'}>
          <span className="shrink-0 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-600">
            {t('Live')}
          </span>
        </Show>
      }
      <ItemMeta
        projectName={item.projectName}
        folderName={item.folderName}
        updated={item.updated}
      />
    </div>
  );
}
