import {
  ApFlagId,
  ColorName,
  PlatformRole,
  PROJECT_COLOR_PALETTE,
  ProjectIcon,
  ProjectType,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown } from 'lucide-solid';
import { createSignal, For, Show } from 'solid-js';
import type { Accessor } from 'solid-js';

import { ClearableInput } from '@/components/custom/clearable-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { projectCollectionUtils } from '@/features/projects';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';

export const GeneralSettings = (props: GeneralSettingsProps) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const platformRole = userHooks.getCurrentUserPlatformRole();
  const [colorPickerOpen, setColorPickerOpen] = createSignal(false);
  const { project } = projectCollectionUtils.useCurrentProject();
  const { data: isRateLimiterEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.PROJECT_RATE_LIMITER_ENABLED,
  );
  const { data: defaultConcurrentJobsLimit } = flagsHooks.useFlag<number>(
    ApFlagId.DEFAULT_CONCURRENT_JOBS_LIMIT,
  );
  const showGeneralSettings = project.type === ProjectType.TEAM;
  const showExternalIdSettings =
    platform.plan.embeddingEnabled && platformRole === PlatformRole.ADMIN;
  const colorOptions = Object.values(ColorName);

  return (
    <div className="space-y-6">
      <Show when={showGeneralSettings}>
        <div>
          <Label for="projectName" class="text-sm font-medium">
            {t('Project Name')}
          </Label>
          <div className="flex mt-2">
            <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  class="h-10 px-3 rounded-r-none border-r flex items-center gap-1"
                  disabled={props.disabled}
                >
                  <div
                    className="h-3 w-3 rounded-none shrink-0"
                    style={{
                      backgroundColor:
                        PROJECT_COLOR_PALETTE[props.values().icon.color].color,
                    }}
                  />
                  <ChevronDown class="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-auto p-3" align="start">
                <div className="grid grid-cols-6 gap-2">
                  <For each={colorOptions}>
                    {(colorName) => (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        class={cn(
                          'h-8 w-8 rounded-sm transition-all hover:scale-110 p-0',
                          props.values().icon.color === colorName &&
                            'ring-2 ring-offset-2 ring-foreground',
                        )}
                        style={{
                          backgroundColor: PROJECT_COLOR_PALETTE[colorName].color,
                        }}
                        onClick={() => {
                          props.setField('icon', { color: colorName });
                          setColorPickerOpen(false);
                        }}
                        disabled={props.disabled}
                      />
                    )}
                  </For>
                </div>
              </PopoverContent>
            </Popover>
            <Input
              id="projectName"
              placeholder={t('Project Name')}
              class="h-10 rounded-l-none border-l-0"
              value={props.values().projectName}
              onInput={(e) =>
                props.setField('projectName', e.currentTarget.value)
              }
              disabled={props.disabled}
            />
          </div>
        </div>
      </Show>
      <Show when={showExternalIdSettings}>
        <div>
          <Label for="externalId" class="text-sm font-medium">
            {t('External ID')}
          </Label>
          <Input
            id="externalId"
            placeholder={t('org-3412321')}
            class="h-10 font-mono"
            value={props.values().externalId ?? ''}
            onInput={(e) => props.setField('externalId', e.currentTarget.value)}
            disabled={props.disabled}
          />
          <p class="text-xs text-muted-foreground">
            {t('Used to identify the project based on your SaaS ID')}
          </p>
        </div>
      </Show>
      <Show when={platformRole === PlatformRole.ADMIN}>
        <div>
          <Label for="maxConcurrentJobs" class="text-sm font-medium">
            {t('Max Concurrent Jobs')}
          </Label>
          <ClearableInput
            id="maxConcurrentJobs"
            type="number"
            min={1}
            placeholder={
              defaultConcurrentJobsLimit
                ? t('Default ({value})', {
                    value: defaultConcurrentJobsLimit,
                  })
                : t('Default')
            }
            value={props.values().maxConcurrentJobs ?? ''}
            onChange={(e) =>
              props.setField(
                'maxConcurrentJobs',
                e.target.value ? Number(e.target.value) : null,
              )
            }
            onClear={() => props.setField('maxConcurrentJobs', null)}
            disabled={props.disabled || !isRateLimiterEnabled}
          />
          <p class="text-xs text-muted-foreground">
            {isRateLimiterEnabled === false
              ? t(
                  'The rate limiting feature is disabled. Enable the PROJECT_RATE_LIMITER_ENABLED environment variable to use this feature.',
                )
              : t(
                  'Maximum number of flows that can run at the same time for this project',
                )}
          </p>
        </div>
      </Show>
    </div>
  );
};

export type FormValues = {
  projectName: string;
  icon: ProjectIcon;
  externalId?: string;
  maxConcurrentJobs?: number | null;
};

type GeneralSettingsProps = {
  values: Accessor<FormValues>;
  setField: <K extends keyof FormValues>(field: K, value: FormValues[K]) => void;
  disabled: boolean;
};
