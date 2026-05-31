import { useDebouncedCallback } from '@/lib/debounce';
import { t } from 'i18next';
import { Lock } from 'lucide-solid';
import { createEffect, createSignal, Show, For } from 'solid-js';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { TOOL_CATEGORIES } from './utils/mcp-tools-metadata';

type McpToolsProps = {
  disabledTools: string[] | null;
  isPending: boolean;
  onUpdateDisabledTools: (tools: string[]) => void;
};

export function McpTools({
  disabledTools: externalDisabledTools,
  isPending,
  onUpdateDisabledTools,
}: McpToolsProps) {
  const [disabledTools, setDisabledTools] = createSignal<string[]>(
    externalDisabledTools ?? [],
  );

  createEffect(() => {
    if (!isPending) {
      setDisabledTools(externalDisabledTools ?? []);
    }
  });

  const saveDisabledTools = useDebouncedCallback((tools: string[]) => {
    onUpdateDisabledTools(tools);
  }, 300);

  const toggleTool = (name: string, checked: boolean) => {
    const next = checked
      ? disabledTools().filter((n) => n !== name)
      : [...disabledTools(), name];
    setDisabledTools(next);
    saveDisabledTools(next);
  };

  const toggleCategory = (toolNames: string[], checked: boolean) => {
    const next = checked
      ? disabledTools().filter((n) => !toolNames.includes(n))
      : [
          ...disabledTools(),
          ...toolNames.filter((n) => !disabledTools().includes(n)),
        ];
    setDisabledTools(next);
    saveDisabledTools(next);
  };

  return (
    <Accordion type="multiple" class="space-y-2">
      {
        <For each={TOOL_CATEGORIES}>
          {(category) => {
            const toolNames = category.tools.map((tool) => tool.name);
            const enabledInCategory = category.locked
              ? toolNames
              : toolNames.filter((n) => !disabledTools.includes(n));
            const allChecked = enabledInCategory.length === toolNames.length;
            const someChecked =
              enabledInCategory.length > 0 &&
              enabledInCategory.length < toolNames.length;

            return (
              <AccordionItem value={category.label}>
                <AccordionTrigger class="bg-muted/40 hover:no-underline">
                  <div className="flex items-center gap-3">
                    {
                      <Show
                        when={category.locked}
                        fallback={
                          <Checkbox
                            checked={
                              allChecked
                                ? true
                                : someChecked
                                ? 'indeterminate'
                                : false
                            }
                            onCheckedChange={(v) =>
                              toggleCategory(toolNames, v === true)
                            }
                            onClick={(e) => e.stopPropagation()}
                            aria-label={t('Select all in {{category}}', {
                              category: category.label,
                            })}
                          />
                        }
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Lock class="h-4 w-4 text-muted-foreground shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent>
                            {t('Required by other tools — always enabled')}
                          </TooltipContent>
                        </Tooltip>
                      </Show>
                    }
                    <span className="text-sm font-semibold">
                      {t(category.label)}
                    </span>
                    {
                      <Show when={category.locked}>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({t('always enabled')})
                        </span>
                      </Show>
                    }
                    <span className="text-xs text-muted-foreground">
                      {enabledInCategory.length}/{toolNames.length}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent class="p-0 pl-6">
                  <div className="divide-y">
                    {
                      <For each={category.tools}>
                        {(tool) => {
                          const isChecked =
                            category.locked ||
                            !disabledTools.includes(tool.name);
                          return (
                            <div className="flex items-start gap-3 px-4 py-3">
                              {
                                <Show
                                  when={category.locked}
                                  fallback={
                                    <Checkbox
                                      id={tool.name}
                                      checked={isChecked}
                                      onCheckedChange={(v) =>
                                        toggleTool(tool.name, v === true)
                                      }
                                      class="mt-0.5"
                                    />
                                  }
                                >
                                  <div className="h-4 w-4 shrink-0 mt-0.5" />
                                </Show>
                              }
                              <label
                                htmlFor={
                                  category.locked ? undefined : tool.name
                                }
                                className={cn(
                                  'flex flex-col gap-0.5',
                                  !category.locked && 'cursor-pointer',
                                )}
                              >
                                <span className="text-sm font-mono font-medium">
                                  {tool.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {tool.description}
                                </span>
                              </label>
                            </div>
                          );
                        }}
                      </For>
                    }
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          }}
        </For>
      }
    </Accordion>
  );
}
