import { t } from 'i18next';
import { Dot, FolderIcon, User } from 'lucide-solid';
import { createMemo, Show, For, type Component } from 'solid-js';
import { Dynamic } from 'solid-js/web';

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
  pageIcon?: Component<{ class?: string }>;
  iconBgColor?: string;
  iconTextColor?: string;
  iconLetter?: string;
};

function ItemIcon(props: ItemIconProps) {
  const icon = () => (props.type === 'page' ? props.pageIcon : undefined);

  return (
    <>
      <Show when={props.type === 'project' && props.iconBgColor}>
        <span
          class="flex size-5 shrink-0 items-center justify-center rounded-[4px] text-[10px] font-bold"
          style={{
            'background-color': props.iconBgColor,
            color: props.iconTextColor,
          }}
        >
          {props.iconLetter}
        </span>
      </Show>
      <Show when={props.type === 'project' && !props.iconBgColor}>
        <User class="size-4 shrink-0 text-muted-foreground" />
      </Show>
      <Show when={props.type === 'flow'}>
        <span class="[&_svg]:text-violet-500! shrink-0">
          <WorkflowIcon class="size-4" />
        </span>
      </Show>
      <Show when={props.type === 'table'}>
        <span class="[&_svg]:text-emerald-500! shrink-0">
          <TableIcon class="size-4" />
        </span>
      </Show>
      <Show when={props.type === 'folder'}>
        <FolderIcon
          class="size-4 shrink-0 text-muted-foreground"
          fill="currentColor"
          strokeWidth={0}
        />
      </Show>
      <Show when={icon()}>
        {(Icon) => (
          <Dynamic
            component={Icon()}
            class="size-4 shrink-0 text-muted-foreground"
          />
        )}
      </Show>
    </>
  );
}

function ItemMeta(props: {
  projectName?: string | null;
  folderName?: string | null;
  updated?: string | null;
}) {
  const project = () => !!props.projectName;
  const folder = () => !!props.folderName;
  const updated = () => props.updated != null;

  return (
    <Show when={project() || folder() || updated()}>
      <span class="flex shrink-0 items-center gap-1 text-xs text-muted-foreground/80">
        <span>—</span>
        <Show when={project()}>
          <span>{props.projectName}</span>
        </Show>
        <Show when={project() && folder()}>
          <span>/</span>
        </Show>
        <Show when={folder()}>
          <span class="flex items-center gap-0.5">
            <FolderIcon
              class="size-4! mr-0.5 text-muted-foreground/80 shrink-0"
              fill="currentColor"
              strokeWidth={0}
            />
            <span>{props.folderName}</span>
          </span>
        </Show>
        <Show when={(project() || folder()) && updated()}>
          <Dot class="size-3! shrink-0 text-muted-foreground/80" />
        </Show>
        <Show when={props.updated}>
          {(date) => (
            <span class="whitespace-nowrap">{`Last Modified: ${timeAgo(
              date(),
            )}`}</span>
          )}
        </Show>
      </span>
    </Show>
  );
}

function HighlightText(props: { text: string; query?: string }) {
  const parts = createMemo(() => {
    if (!props.query) return [{ text: props.text, match: false }];

    const lower = props.text.toLowerCase();
    const query = props.query.toLowerCase();
    const parts: { text: string; match: boolean }[] = [];
    const scan = (start: number): { text: string; match: boolean }[] => {
      const idx = lower.indexOf(query, start);
      if (idx === -1) {
        if (start < props.text.length)
          return [{ text: props.text.slice(start), match: false }];
        return [];
      }
      return [
        ...(idx > start
          ? [{ text: props.text.slice(start, idx), match: false }]
          : []),
        {
          text: props.text.slice(idx, idx + props.query.length),
          match: true,
        },
        ...scan(idx + props.query.length),
      ];
    };

    parts.push(...scan(0));
    return parts;
  });

  return (
    <>
      <For each={parts()}>
        {(part) => (
          <Show when={part.match} fallback={part.text}>
            <span class="font-semibold">{part.text}</span>
          </Show>
        )}
      </For>
    </>
  );
}

export function SearchResultRow(props: {
  item: SearchResultItem;
  query?: string;
}) {
  return (
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <ItemIcon
        type={props.item.type}
        pageIcon={props.item.pageIcon}
        iconBgColor={props.item.iconBgColor}
        iconTextColor={props.item.iconTextColor}
        iconLetter={props.item.iconLetter}
      />
      <span class="min-w-0 shrink truncate text-sm font-normal">
        <HighlightText text={props.item.label} query={props.query} />
      </span>
      {
        <Show when={props.item.status === 'ENABLED'}>
          <span class="shrink-0 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-600">
            {t('Live')}
          </span>
        </Show>
      }
      <ItemMeta
        projectName={props.item.projectName}
        folderName={props.item.folderName}
        updated={props.item.updated}
      />
    </div>
  );
}
