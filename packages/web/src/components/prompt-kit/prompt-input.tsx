import {
  createSignal,
  createEffect,
  createContext,
  useContext,
  JSX,
} from 'solid-js';

import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type PromptInputContextType = {
  isLoading: boolean;
  value: () => string;
  setValue: (value: string) => void;
  maxHeight: number | string;
  onSubmit?: () => void;
  disabled?: boolean;
  textarea: () => HTMLTextAreaElement | undefined;
  setTextarea: (el: HTMLTextAreaElement | undefined) => void;
};

const PromptInputContext = createContext<PromptInputContextType>({
  isLoading: false,
  value: () => '',
  setValue: () => {},
  maxHeight: 240,
  onSubmit: undefined,
  disabled: false,
  textarea: () => undefined,
  setTextarea: () => {},
});

function usePromptInput() {
  return useContext(PromptInputContext);
}

export type PromptInputProps = {
  isLoading?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  maxHeight?: number | string;
  onSubmit?: () => void;
  children: JSX.Element;
  className?: string;
  disabled?: boolean;
} & ComponentProps<'div'>;

function PromptInput({
  className,
  isLoading = false,
  maxHeight = 240,
  value,
  onValueChange,
  onSubmit,
  children,
  disabled = false,
  onClick,
  ...props
}: PromptInputProps) {
  const [internalValue, setInternalValue] = createSignal(value || '');
  let textarea: HTMLTextAreaElement | undefined;

  const handleChange = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  const handleClick = (e: MouseEvent) => {
    if (!disabled) textarea?.focus();
    onClick?.(e);
  };

  return (
    <TooltipProvider>
      <PromptInputContext.Provider
        value={{
          isLoading,
          value: () => value ?? internalValue(),
          setValue: onValueChange ?? handleChange,
          maxHeight,
          onSubmit,
          disabled,
          textarea: () => textarea,
          setTextarea: (el) => {
            textarea = el;
          },
        }}
      >
        <div
          onClick={handleClick}
          className={cn(
            'border-input bg-background cursor-text rounded-3xl border p-2 shadow-xs',
            disabled && 'cursor-not-allowed opacity-60',
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </PromptInputContext.Provider>
    </TooltipProvider>
  );
}

export type PromptInputTextareaProps = {
  disableAutosize?: boolean;
} & ComponentProps<typeof Textarea>;

function PromptInputTextarea({
  className,
  onKeyDown,
  disableAutosize = false,
  ...props
}: PromptInputTextareaProps) {
  const { value, setValue, maxHeight, onSubmit, disabled, textarea, setTextarea } =
    usePromptInput();

  const adjustHeight = (el: HTMLTextAreaElement | null) => {
    if (!el || disableAutosize) return;

    el.style.height = 'auto';

    if (typeof maxHeight === 'number') {
      el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    } else {
      el.style.height = `min(${el.scrollHeight}px, ${maxHeight})`;
    }
  };

  const handleRef = (el: HTMLTextAreaElement | null) => {
    setTextarea(el ?? undefined);
    adjustHeight(el);
  };

  createEffect(() => {
    value();
    if (!textarea() || disableAutosize) return;

    const el = textarea();
    if (!el) return;
    el.style.height = 'auto';

    if (typeof maxHeight === 'number') {
      el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    } else {
      el.style.height = `min(${el.scrollHeight}px, ${maxHeight})`;
    }
  });

  const handleChange = (e: Event & { currentTarget: HTMLTextAreaElement }) => {
    adjustHeight(e.currentTarget);
    setValue(e.currentTarget.value);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
    onKeyDown?.(e);
  };

  return (
    <Textarea
      ref={handleRef}
      value={value()}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      class={cn(
        'text-foreground min-h-[44px] w-full resize-none border-none bg-transparent shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
        className,
      )}
      rows={1}
      disabled={disabled}
      {...props}
    />
  );
}

export type PromptInputActionsProps = JSX.HTMLAttributes<HTMLDivElement>;

function PromptInputActions({
  children,
  className,
  ...props
}: PromptInputActionsProps) {
  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      {children}
    </div>
  );
}

export type PromptInputActionProps = {
  className?: string;
  tooltip: JSX.Element;
  children: JSX.Element;
  side?: 'top' | 'bottom' | 'left' | 'right';
} & ComponentProps<typeof Tooltip>;

function PromptInputAction({
  tooltip,
  children,
  className,
  side = 'top',
  ...props
}: PromptInputActionProps) {
  const { disabled } = usePromptInput();

  return (
    <Tooltip {...props}>
      <TooltipTrigger
        asChild
        disabled={disabled}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} class={className}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

export {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
};
