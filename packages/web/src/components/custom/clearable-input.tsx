import { isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { X } from 'lucide-solid';
import { createMemo, Show, splitProps } from 'solid-js';

import { Input, InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { SelectUtilButton } from './select-util-button';

function ClearableInput(_props: ClearableInputProps) {
  const [props, inputProps] = splitProps(_props, ['onClear', 'showClear']);
  const clear = createMemo(
    () =>
      props.showClear ?? (!isNil(inputProps.value) && inputProps.value !== ''),
  );

  return (
    <div class="relative">
      <Input
        {...inputProps}
        class={cn(inputProps.className, clear() && 'pr-9')}
      />
      <Show when={clear() && !inputProps.disabled}>
        <div class="absolute right-2 top-1/2 -translate-y-1/2">
          <SelectUtilButton
            tooltipText={t('Clear')}
            onClick={() => props.onClear()}
            Icon={X}
          />
        </div>
      </Show>
    </div>
  );
}

type ClearableInputProps = InputProps & {
  onClear: () => void;
  showClear?: boolean;
};

export { ClearableInput };
export type { ClearableInputProps };
