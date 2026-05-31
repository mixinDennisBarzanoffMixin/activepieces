import { useDebounce } from '@/lib/debounce';
import { t } from 'i18next';
import { CornerDownLeft, X } from 'lucide-solid';
import {
  useContext,
  createContext,
  createEffect,
  onCleanup,
  createSignal,
  Show,
  For,
  type JSX,
} from 'solid-js';

import {
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { projectCollectionUtils } from '@/features/projects';
import { authenticationSession } from '@/lib/authentication-session';

import { recordAccess, type AccessedItemType } from './access-history';
import { SearchResultRow } from './search-result-item';
import {
  type SearchResultItem,
  useGlobalSearchResults,
} from './use-global-search-results';

type GlobalSearchContextType = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const GlobalSearchContext = createContext<GlobalSearchContextType | null>(null);

export function useGlobalSearch() {
  const ctx = useContext(GlobalSearchContext);
  if (!ctx) {
    throw new Error('useGlobalSearch must be used within GlobalSearchProvider');
  }
  return ctx;
}

function SkeletonRows() {
  return (
    <>
      {
        <For each={[1, 2, 3]}>
          {(i) => (
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="size-4 shrink-0 animate-pulse rounded bg-muted" />
              <div className="h-3.5 flex-1 animate-pulse rounded bg-muted" />
              <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
            </div>
          )}
        </For>
      }
    </>
  );
}

function GlobalSearchDialogContent({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [search, setSearch] = createSignal('');
  const [commandValue, setCommandValue] = createSignal('');
  const [debouncedSearch] = useDebounce(search, 250);

  const { groups, isLoading } = useGlobalSearchResults(debouncedSearch, () => open);

  const handleOpenChange = (value: boolean) => {
    onOpenChange(value);
    if (!value) setSearch('');
  };

  const navigateToItem = (type: string, href: string) => {
    if (type === 'project') {
      const projectId = href.split('/projects/')[1]?.split('/')[0];
      if (projectId) projectCollectionUtils.setCurrentProject(projectId);
    }
    handleOpenChange(false);
    window.location.href = href;
  };

  const handleSelectResult = (item: SearchResultItem) => {
    if (item.type !== 'folder') {
      recordAccess({
        id: item.id,
        type: item.type as AccessedItemType,
        label: item.label,
        href: item.href,
        status: item.status,
        folderName: item.folderName,
        projectName: item.projectName,
        iconBgColor: item.iconBgColor,
        iconTextColor: item.iconTextColor,
        iconLetter: item.iconLetter,
      });
    }
    navigateToItem(item.type, item.href);
  };

  const hasQuery = () => debouncedSearch().length > 0;
  const noResults = () => hasQuery() && !isLoading() && groups().length === 0;

  const firstItemId = () =>
    groups().find((g) => !g.isLoading && g.items.length > 0)?.items[0]?.id ?? '';

  createEffect(() => {
    setCommandValue(firstItemId);
  });

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      showCloseButton={false}
      shouldFilter={false}
      commandValue={commandValue()}
      onCommandValueChange={setCommandValue}
      class="sm:max-w-[620px] h-[70vh] flex flex-col"
    >
      <div className="relative">
        <CommandInput
          placeholder={t('Search pages, flows, tables...')}
          value={search()}
          onValueChange={setSearch}
          containerClassName="border-b-0"
        />
        {
          <Show when={search()}>
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setSearch('')}
            >
              <X class="size-3.5" />
            </button>
          </Show>
        }
      </div>

      <CommandList class="flex-1 min-h-0 max-h-none overflow-y-auto! scrollbar-hover">
        {
          <Show when={noResults()}>
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                {t('No results found.')}
              </p>
              <button
                type="button"
                className="text-xs text-primary underline hover:no-underline"
                onClick={() => setSearch('')}
              >
                {t('Clear search')}
              </button>
            </div>
          </Show>
        }

        {
          <For each={groups()}>
            {(group, idx) => (
              <>
                {
                  <Show when={idx() > 0 && hasQuery()}>
                    <CommandSeparator />
                  </Show>
                }
                <CommandGroup heading={group.heading || undefined}>
                  {
                    <Show
                      when={group.isLoading}
                      fallback={
                        <For each={group.items}>
                          {(item) => (
                            <CommandItem
                              value={item.id}
                              onSelect={() => handleSelectResult(item)}
                              class="group flex items-center data-[selected=true]:bg-foreground/10"
                            >
                              <SearchResultRow
                                item={item}
                                query={hasQuery() ? debouncedSearch() : undefined}
                              />
                              <CornerDownLeft class="ml-auto size-2 shrink-0 text-muted-foreground/70 opacity-0 transition-opacity group-data-[selected=true]:opacity-100" />
                            </CommandItem>
                          )}
                        </For>
                      }
                    >
                      <SkeletonRows />
                    </Show>
                  }
                </CommandGroup>
              </>
            )}
          </For>
        }
      </CommandList>

      <div className="flex items-center gap-4 border-t bg-muted/50 px-4 py-2.5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <kbd className="inline-flex h-5 items-center rounded border bg-background px-1 font-mono">
            ↑
          </kbd>
          <kbd className="inline-flex h-5 items-center rounded border bg-background px-1 font-mono">
            ↓
          </kbd>
          {t('to navigate')}
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="inline-flex h-5 items-center rounded border bg-background px-1 font-mono">
            ↵
          </kbd>
          {t('to select')}
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="inline-flex h-5 items-center rounded border bg-background px-1.5 font-mono text-[10px]">
            esc
          </kbd>
          {t('to close')}
        </span>
      </div>
    </CommandDialog>
  );
}

export function GlobalSearchProvider({ children }: { children: JSX.Element }) {
  const [open, setOpen] = createSignal(false);
  const isLoggedIn = authenticationSession.isLoggedIn();

  createEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    onCleanup(() => document.removeEventListener('keydown', handleKeyDown));
  });

  return (
    <GlobalSearchContext.Provider value={{ open, setOpen }}>
      {children}
      <Show when={isLoggedIn && open()}>
        <GlobalSearchDialogContent open={open()} onOpenChange={setOpen} />
      </Show>
    </GlobalSearchContext.Provider>
  );
}
