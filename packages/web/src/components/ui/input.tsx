import { t } from 'i18next';
import { Paperclip } from 'lucide-solid';
import { createSignal, splitProps, type JSX, Show } from 'solid-js';

import { cn } from '@/lib/utils';

import { SelectUtilButton } from '../custom/select-util-button';

export const inputClass =
  'flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[1px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40';

function Input(props: InputProps) {
  const [local, rest] = splitProps(props, [
    'class',
    'className',
    'type',
    'thin',
    'defaultFileName',
    'onChange',
  ]);
  const [fileName, setFileName] = createSignal<string | null>(null);
  let inputRef: HTMLInputElement | undefined;

  return (
    <>
      <Show
        when={local.type === 'file'}
        fallback={
          <input
            type={local.type}
            data-slot="input"
            class={cn(inputClass, local.class, local.className, {
              'h-7 p-2': local.thin,
            })}
            ref={(el) => {
              inputRef = el;
            }}
            {...rest}
          />
        }
      >
        <>
          <input
            type="file"
            class="hidden"
            ref={(el) => {
              inputRef = el;
            }}
            {...rest}
            onChange={(event) =>
              handleFileChange(event, setFileName, local.onChange)
            }
          />
          <div
            onClick={() => inputRef?.click()}
            class={cn(
              inputClass,
              'cursor-pointer items-center',
              local.class,
              local.className,
            )}
          >
            <input
              data-slot="input"
              class={cn('grow cursor-pointer outline-hidden bg-transparent', {
                'text-muted-foreground': !fileName,
              })}
              value={fileName() || local.defaultFileName || t('Select a file')}
              readOnly
            />
            <div class="basis-1">
              <SelectUtilButton
                onClick={(e) => e.preventDefault()}
                tooltipText={fileName() ? fileName() : t('Select a file')}
                Icon={Paperclip}
              />
            </div>
          </div>
        </>
      </Show>
    </>
  );
}

// Helper functions

function handleFileChange(
  event: Event & { currentTarget: HTMLInputElement; target: HTMLInputElement },
  setFileName: (value: string | null) => void,
  onChange?: (event: Event) => void,
) {
  const file = event.target.files?.[0];
  setFileName(file ? file.name : null);
  onChange?.(event);
}

// Type definitions

type InputProps = JSX.IntrinsicElements['input'] & {
  className?: string;
  thin?: boolean;
  defaultFileName?: string;
};

export { Input };
export type { InputProps };
