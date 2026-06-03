import { ProjectType, ProjectWithLimits, SeekPage } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, Ellipsis } from 'lucide-solid';
import { motion } from 'motion/react';
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  mergeProps,
  Show,
} from 'solid-js';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ApProjectDisplay, getProjectName } from '@/features/projects';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import { ProjectPickerData } from '../lib/message-parsers';

export function ProjectPickerCard(_props: ProjectPickerCardProps) {
  const props = mergeProps({ isInteractive: true }, _props);
  const userId = authenticationSession.getCurrentUserId();
  const [allProjects, setAllProjects] = createSignal<ProjectWithLimits[]>([]);

  createEffect(() => {
    if (!userId) return;
    void (async () => {
      const res = await api.get<SeekPage<ProjectWithLimits>>('/v1/projects', {
        cursor: undefined,
        limit: 30000,
      });
      setAllProjects(res.data);
    })();
  });

  const projects = createMemo(() => {
    return allProjects().filter(
      (p) => p.type !== ProjectType.PERSONAL || p.ownerId === userId,
    );
  });
  const [selected, setSelected] = createSignal<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = createSignal(false);

  const suggestedProjects = () => props.picker.suggestedProjects ?? [];
  const selectedProjectId = createMemo(
    () => selected() ?? props.selectedProjectId ?? null,
  );
  const selectedProject = createMemo(() =>
    selectedProjectId()
      ? projects().find((p) => p.id === selectedProjectId()) ?? null
      : null,
  );
  const selectedProjectName = createMemo(() => {
    const project = selectedProject();
    if (project) return getProjectName(project);
    if (selectedProjectId()) {
      return (
        suggestedProjects().find((p) => p.id === selectedProjectId())?.name ??
        ''
      );
    }
    return suggestedProjects()[0]?.name ?? '';
  });

  function handleSelect(projectId: string, name: string) {
    setSelected(projectId);
    props.onSelect(projectId, name);
  }

  return (
    <Show
      when={selected() || !props.isInteractive}
      fallback={
        <motion.div
          class="flex flex-wrap gap-2 my-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <For
            each={suggestedProjects().filter((s) =>
              projects().some((p) => p.id === s.id),
            )}
          >
            {(suggested, i) => {
              const resolvedProject = projects().find(
                (p) => p.id === suggested.id,
              );
              return (
                <motion.button
                  key={suggested.id}
                  type="button"
                  onClick={() =>
                    handleSelect(
                      suggested.id,
                      resolvedProject
                        ? getProjectName(resolvedProject)
                        : suggested.name,
                    )
                  }
                  class="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-sm hover:bg-muted transition-colors cursor-pointer"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i() * 0.04 }}
                >
                  <Show
                    when={resolvedProject}
                    fallback={<span>{suggested.name}</span>}
                  >
                    {(project) => (
                      <ApProjectDisplay
                        title={getProjectName(project())}
                        icon={project().icon}
                        projectType={project().type}
                        iconClassName="size-4"
                        titleClassName="text-sm"
                      />
                    )}
                  </Show>
                </motion.button>
              );
            }}
          </For>

          <Popover open={dropdownOpen()} onOpenChange={setDropdownOpen}>
            <PopoverTrigger asChild>
              <motion.button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-full border border-dashed bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.2,
                  delay: suggestedProjects().length * 0.04,
                }}
              >
                <Ellipsis class="size-3.5" />
                {t('Another project')}
              </motion.button>
            </PopoverTrigger>
            <PopoverContent class="p-0 w-72" align="start">
              <Command>
                <CommandInput placeholder={t('Search projects...')} />
                <CommandEmpty>{t('No project found.')}</CommandEmpty>
                <CommandGroup class="max-h-64 overflow-auto">
                  <For each={projects()}>
                    {(project) => (
                      <CommandItem
                        key={project.id}
                        value={getProjectName(project)}
                        onSelect={() => {
                          handleSelect(project.id, getProjectName(project));
                          setDropdownOpen(false);
                        }}
                        class="cursor-pointer gap-2"
                      >
                        <ApProjectDisplay
                          title={getProjectName(project)}
                          icon={project.icon}
                          projectType={project.type}
                          iconClassName="size-4"
                        />
                        <Check
                          class={cn(
                            'ml-auto size-4',
                            props.selectedProjectId === project.id
                              ? 'opacity-100'
                              : 'opacity-0',
                          )}
                        />
                      </CommandItem>
                    )}
                  </For>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </motion.div>
      }
    >
      <motion.div
        class="rounded-xl border bg-background overflow-hidden my-2"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div class="p-4 flex items-center gap-3">
          <div class="relative">
            <Show
              when={selectedProject()}
              fallback={
                selectedProjectName() && (
                  <span class="text-sm font-semibold">
                    {selectedProjectName()}
                  </span>
                )
              }
            >
              {(project) => (
                <ApProjectDisplay
                  title={getProjectName(project())}
                  icon={project().icon}
                  projectType={project().type}
                  iconClassName="size-5"
                  titleClassName="text-sm font-semibold"
                />
              )}
            </Show>
          </div>
          <div class="ml-auto">
            <div class="bg-green-100 dark:bg-green-500/20 rounded-full p-1">
              <Check class="h-3 w-3 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </motion.div>
    </Show>
  );
}

type ProjectPickerCardProps = {
  picker: ProjectPickerData;
  onSelect: (projectId: string, projectName: string) => void;
  isInteractive?: boolean;
  selectedProjectId?: string | null;
};
