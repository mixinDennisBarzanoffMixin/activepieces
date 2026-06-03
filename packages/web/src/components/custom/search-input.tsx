import { t } from 'i18next';
import { Search, X } from 'lucide-solid';
import { Show } from 'solid-js';

import { Input, inputClass, type InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { SelectUtilButton } from './select-util-button';

export type SearchInputProps = Omit<InputProps, 'onChange'> & {
  onChange: (value: string) => void;
};

const SearchInput = (props: SearchInputProps & { ref?: HTMLInputElement }) => {
  let inputRef: HTMLInputElement | undefined;

  return (
    <div
      class={cn(
        'grow flex items-center gap-2 w-full bg-background px-3 box-border',
        inputClass,
      )}
    >
      <Search class="size-4 shrink-0 opacity-50" />
      <Input
        {...props}
        type={props.type}
        ref={(el) => {
          inputRef = el;
          if (typeof props.ref === 'function') props.ref(el);
        }}
        class="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none p-0 bg-transparent dark:bg-transparent"
        placeholder={props.placeholder ?? t('Search')}
        onChange={(e) => props.onChange(e.currentTarget.value)}
      />
      <Show when={props.value !== ''}>
        <SelectUtilButton
          tooltipText={t('Clear')}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            props.onChange('');
            inputRef?.focus();
          }}
          Icon={X}
        />
      </Show>
    </div>
  );
};

export { SearchInput };
