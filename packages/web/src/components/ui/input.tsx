import { t } from 'i18next';
import { Paperclip } from 'lucide-solid';
import { createSignal } from 'solid-js';

import { cn } from '@/lib/utils';

import { SelectUtilButton } from '../custom/select-util-button';

export const inputClass =
  'flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[1px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40';

function Input({
  class: classProp,
  className,
  type,
  thin = false,
  defaultFileName,
  ref,
  ...props
}: InputProps) {
  const [fileName, setFileName] = createSignal<string | null>(null);
  let inputRef: HTMLInputElement | undefined;

  // useImperativeHandle removed - use ref prop pattern in Solid

  return type === 'file' ? (
    <>
      <input
        type="file"
        className="hidden"
        ref={(el) => {
          inputRef = el;
        }}
        {...props}
        onChange={(event) =>
          handleFileChange(event, setFileName, props.onChange)
        }
      />
      <div
        onClick={() => inputRef?.click()}
        className={cn(inputClass, 'cursor-pointer items-center', className, classProp)}
      >
        <input
          data-slot="input"
          className={cn('grow cursor-pointer outline-hidden bg-transparent', {
            'text-muted-foreground': !fileName,
          })}
          value={fileName() || defaultFileName || t('Select a file')}
          readOnly
        />
        <div className="basis-1">
          <SelectUtilButton
            onClick={(e) => e.preventDefault()}
            tooltipText={fileName() ? fileName() : t('Select a file')}
            Icon={Paperclip}
          ></SelectUtilButton>
        </div>
      </div>
    </>
  ) : (
    <input
      type={type}
      data-slot="input"
      className={cn(inputClass, className, classProp, {
        'h-7 p-2': thin,
      })}
      ref={(el) => {
        inputRef = el;
      }}
      {...props}
    />
  );
}

// Helper functions

function handleFileChange(
  event: Event & { currentTarget: HTMLInputElement; target: HTMLInputElement },
  setFileName: (value: string | null) => void,
  onChange?: JSX.EventHandler<HTMLInputElement>,
) {
  const file = event.target.files?.[0];
  setFileName(file ? file.name : null);
  onChange?.(event);
}

// Type definitions

type InputProps = JSX.IntrinsicElements['input'] & {
  thin?: boolean;
  defaultFileName?: string;
};

export { Input };
export type { InputProps };
