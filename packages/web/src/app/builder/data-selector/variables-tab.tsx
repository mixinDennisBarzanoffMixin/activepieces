import { Permission } from '@activepieces/shared';
import { t } from 'i18next';
import { Plus, SearchXIcon, Variable } from 'lucide-solid';
import { For, Show, createSignal } from 'solid-js';

import { VariableDialog } from '@/app/variables/variable-dialog';
import { SearchInput } from '@/components/custom/search-input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { variablesQueries } from '@/features/variables/hooks/variables-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { useDebounce } from '@/lib/debounce';
import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../builder-hooks';

const VariablesTab = () => {
  const insertMention = useBuilderStateContext((state) => ({
    value: state.insertMention,
  })).value;
  const [search, setSearch] = createSignal('');
  const [debouncedSearch] = useDebounce(search, 250);
  const [createOpen, setCreateOpen] = createSignal(false);
  const projectId = authenticationSession.getProjectId();
  const { checkAccess } = useAuthorization();
  const canRead = checkAccess(Permission.READ_VARIABLE);
  const canWrite = checkAccess(Permission.WRITE_VARIABLE);

  const { data, isLoading, refetch } = variablesQueries.useVariables({
    request: {
      projectId: projectId ?? '',
      limit: 50,
      name: debouncedSearch() || undefined,
    },
    extraKeys: ['data-selector-variables', projectId ?? '', debouncedSearch()],
    enabled: !!projectId && canRead,
  });

  const variables = data?.data ?? [];

  return (
    <div class="flex flex-col gap-2 h-full">
      <div class="flex items-center gap-2 px-5">
        <SearchInput
          onChange={setSearch}
          value={search}
          placeholder={String(t('Search variables'))}
        />
        <Show when={canWrite}>
          <Button
            type="button"
            size="sm"
            variant="outline"
            class="shrink-0 gap-1.5"
            onClick={() => setCreateOpen(true)}
          >
            <Plus class="w-4 h-4" />
            {t('New')}
          </Button>
        </Show>
      </div>

      <ScrollArea class="transition-all flex-1 w-full">
        <Show when={isLoading}>
          <div class="text-center text-sm text-muted-foreground py-8">
            {t('Loading…')}
          </div>
        </Show>

        <Show when={!isLoading && variables.length === 0}>
          <div class="flex items-center justify-center gap-2 mt-5 flex-col px-6">
            <Show
              when={debouncedSearch()}
              fallback={
                <>
                  <div class="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                    <Variable class="w-5 h-5" />
                  </div>
                  <div class="text-center font-semibold text-md">
                    {t('No variables yet')}
                  </div>
                  <div class="text-center text-sm text-muted-foreground max-w-[280px]">
                    {t(
                      'Create a variable to reference a value from any step input.',
                    )}
                  </div>
                  <Show when={canWrite}>
                    <Button
                      type="button"
                      size="sm"
                      class="mt-2 gap-1.5"
                      onClick={() => setCreateOpen(true)}
                    >
                      <Plus class="w-4 h-4" />
                      {t('New variable')}
                    </Button>
                  </Show>
                </>
              }
            >
              <>
                <SearchXIcon class="w-[35px] h-[35px]" />
                <div class="text-center font-semibold text-md">
                  {t('No matching variables')}
                </div>
                <div class="text-center text-sm text-muted-foreground">
                  {t('Try adjusting your search')}
                </div>
              </>
            </Show>
          </div>
        </Show>

        <Show when={!isLoading && variables.length > 0}>
          <div class="flex flex-col">
            <For each={variables}>
              {(variable) => (
                <div
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      if (insertMention) {
                        insertMention(`variables['${variable.name}']`);
                      }
                    }
                  }}
                  onClick={() => {
                    if (insertMention) {
                      insertMention(`variables['${variable.name}']`);
                    }
                  }}
                  class={cn(
                    'group w-full max-w-full select-none focus:outline-hidden',
                    'hover:bg-accent dark:hover:bg-accent/20 focus:bg-accent focus:bg-opacity-75',
                    'cursor-pointer flex items-center gap-3 px-5 py-3',
                  )}
                >
                  <div class="shrink-0 flex items-center justify-center w-8 h-8 rounded-md bg-primary/10 text-primary">
                    <Variable class="w-4 h-4" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-mono text-sm truncate">
                      {variable.name}
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </ScrollArea>

      <VariableDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={() => void refetch()}
      />
    </div>
  );
};

export { VariablesTab };
