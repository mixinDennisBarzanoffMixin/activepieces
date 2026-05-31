import {
  PROJECT_COLOR_PALETTE,
  ProjectType,
  ProjectWithLimits,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Check, ChevronDown, LayoutGrid } from 'lucide-solid';
import { createSignal, Show } from 'solid-js';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { VirtualizedScrollArea } from '@/components/ui/virtualized-scroll-area';
import { cn } from '@/lib/utils';

const ITEM_HEIGHT = 36;
const MAX_DROPDOWN_HEIGHT = 300;

type ProjectSelectProps = {
  projects: ProjectWithLimits[];
  selectedProjectId?: string;
  onProjectChange: (projectId: string) => void;
};

export function ProjectSelect({
  projects,
  selectedProjectId,
  onProjectChange,
}: ProjectSelectProps) {
  const [open, setOpen] = createSignal(false);

  const allProjectsItem = { id: 'all', displayName: t('All Projects') };
  const items = [allProjectsItem, ...projects];

  const selectedProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)
    : null;

  const displayValue = selectedProject?.displayName ?? t('All Projects');

  const handleSelect = (projectId: string) => {
    onProjectChange(projectId);
    setOpen(false);
  };

  const dropdownHeight = Math.min(
    items.length * ITEM_HEIGHT,
    MAX_DROPDOWN_HEIGHT,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          class="w-auto gap-2 font-normal h-8"
        >
          <Show
            when={selectedProject?.type === ProjectType.TEAM}
            fallback={<LayoutGrid class="h-4 w-4" />}
          >
            <Avatar
              class="size-4 shrink-0 flex items-center justify-center rounded-[4px] text-xs font-bold"
              style={{
                backgroundColor:
                  PROJECT_COLOR_PALETTE[selectedProject.icon.color].color,
                color:
                  PROJECT_COLOR_PALETTE[selectedProject.icon.color].textColor,
              }}
            >
              <span className="scale-75">
                {selectedProject.displayName.charAt(0).toUpperCase()}
              </span>
            </Avatar>
          </Show>
          <span className="max-w-[150px] truncate">{displayValue}</span>
          <ChevronDown class="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-[250px] p-0" align="end">
        <div style={{ height: dropdownHeight }}>
          <VirtualizedScrollArea
            items={items}
            estimateSize={() => ITEM_HEIGHT}
            getItemKey={(index) => items[index].id}
            class="h-full"
            overscan={10}
            renderItem={(item) => {
              const isSelected =
                item.id === 'all'
                  ? !selectedProjectId
                  : item.id === selectedProjectId;
              const project =
                item.id !== 'all' ? (item as ProjectWithLimits) : null;
              const isTeam = project?.type === ProjectType.TEAM;
              return (
                <div
                  onClick={() => handleSelect(item.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent',
                    isSelected && 'bg-accent',
                  )}
                >
                  <Show
                    when={isTeam && project}
                    fallback={
                      <LayoutGrid class="size-5 shrink-0 text-muted-foreground" />
                    }
                  >
                    <Avatar
                      class="size-5 shrink-0 flex items-center justify-center rounded-[4px] text-xs font-bold"
                      style={{
                        backgroundColor:
                          PROJECT_COLOR_PALETTE[project.icon.color].color,
                        color:
                          PROJECT_COLOR_PALETTE[project.icon.color].textColor,
                      }}
                    >
                      <span className="scale-75">
                        {item.displayName.charAt(0).toUpperCase()}
                      </span>
                    </Avatar>
                  </Show>
                  <span className="truncate flex-1">{item.displayName}</span>
                  <Check
                    class={cn(
                      'h-4 w-4 shrink-0',
                      isSelected ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </div>
              );
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
