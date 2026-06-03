import { t } from 'i18next';
import { Show } from 'solid-js';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { TimeUnit } from '../lib/impact-utils';

type TimeSavedFilterContentProps = {
  draftMin: string;
  onMinChange: (v: string) => void;
  unitMin: TimeUnit;
  onCycleUnitMin: () => void;
  draftMax: string;
  onMaxChange: (v: string) => void;
  unitMax: TimeUnit;
  onCycleUnitMax: () => void;
  onApply: () => void;
};

export function TimeSavedFilterContent(props: TimeSavedFilterContentProps) {
  return (
    <div class="flex flex-col gap-3">
      <div class="flex flex-col gap-1.5">
        <Label class="text-sm text-muted-foreground">{t('Minimum')}</Label>
        <div class="relative">
          <Input
            type="number"
            min={0}
            placeholder="0"
            value={props.draftMin}
            onChange={(e) => props.onMinChange(e.currentTarget.value)}
            class="pr-12"
          />
          <button
            type="button"
            onClick={() => props.onCycleUnitMin()}
            class="absolute bg-accent px-1.5 py-0.5 rounded-sm right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none"
          >
            {props.unitMin}
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <Label class="text-sm text-muted-foreground">{t('Maximum')}</Label>
        <div class="relative">
          <Input
            type="number"
            min={0}
            placeholder="∞"
            value={props.draftMax}
            onChange={(e) => props.onMaxChange(e.currentTarget.value)}
            class={props.draftMax ? 'pr-12' : ''}
          />
          <Show when={props.draftMax}>
            <button
              type="button"
              onClick={() => props.onCycleUnitMax()}
              class="absolute bg-accent px-1.5 py-0.5 rounded-sm right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer select-none"
            >
              {props.unitMax}
            </button>
          </Show>
        </div>
      </div>

      <Button onClick={() => props.onApply()} class="w-full mt-1">
        {t('Apply')}
      </Button>
    </div>
  );
}
