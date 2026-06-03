import {
  createSignal,
  createEffect,
  createContext,
  createMemo,
  mergeProps,
  useContext,
  JSX,
  splitProps,
  type ComponentProps,
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
  isLoading: () => boolean;
  value: () => string;
  setValue: (value: string) => void;
  maxHeight: () => number | string;
  submit: () => (() => void) | undefined;
  disabled: () => boolean;
  textarea: () => HTMLTextAreaElement | undefined;
  setTextarea: (el: HTMLTextAreaElement | undefined) => void;
};

const PromptInputContext = createContext<PromptInputContextType>({
  isLoading: () => false,
  value: () => '',
  setValue: () => {},
  maxHeight: () => 240,
  submit: () => undefined,
  disabled: () => false,
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

function PromptInput(_props: PromptInputProps) {
  const merged = mergeProps(
    { isLoading: false, maxHeight: 240, disabled: false },
    _props,
  );
  const [local, props] = splitProps(merged, [
    'className',
    'isLoading',
    'maxHeight',
    'value',
    'onValueChange',
    'onSubmit',
    'children',
    'disabled',
    'onClick',
  ]);
  const [internalValue, setInternalValue] = createSignal('');
  const value = createMemo(() =>
    local.value === undefined ? internalValue() : local.value,
  );
  const setValue = (next: string) => {
    if (local.onValueChange) return local.onValueChange(next);
    handleChange(next);
  };
  let textarea: HTMLTextAreaElement | undefined;

  const handleChange = (newValue: string) => {
    setInternalValue(newValue);
    local.onValueChange?.(newValue);
  };

  const handleClick = (e: MouseEvent) => {
    if (!local.disabled) textarea?.focus();
    local.onClick?.(e);
  };

  return (
    <TooltipProvider>
      <PromptInputContext.Provider
        value={{
          isLoading: () => local.isLoading,
          value,
          setValue,
          maxHeight: () => local.maxHeight,
          submit: () => local.onSubmit,
          disabled: () => local.disabled,
          textarea: () => textarea,
          setTextarea: (el) => {
            textarea = el;
          },
        }}
      >
        <div
          onClick={handleClick}
          class={cn(
            'border-input bg-background cursor-text rounded-3xl border p-2 shadow-xs',
            local.disabled && 'cursor-not-allowed opacity-60',
            local.className,
          )}
          {...props}
        >
          {local.children}
        </div>
      </PromptInputContext.Provider>
    </TooltipProvider>
  );
}

export type PromptInputTextareaProps = {
  disableAutosize?: boolean;
} & ComponentProps<typeof Textarea>;

function PromptInputTextarea(_props: PromptInputTextareaProps) {
  const merged = mergeProps({ disableAutosize: false }, _props);
  const [local, props] = splitProps(merged, [
    'className',
    'onKeyDown',
    'disableAutosize',
  ]);
  const {
    value,
    setValue,
    maxHeight,
    submit,
    disabled,
    textarea,
    setTextarea,
  } = usePromptInput();

  const adjustHeight = (el: HTMLTextAreaElement | null) => {
    if (!el || local.disableAutosize) return;

    el.style.height = 'auto';

    if (typeof maxHeight() === 'number') {
      el.style.height = `${Math.min(el.scrollHeight, maxHeight())}px`;
    } else {
      el.style.height = `min(${el.scrollHeight}px, ${maxHeight()})`;
    }
  };

  const handleRef = (el: HTMLTextAreaElement | null) => {
    setTextarea(el ?? undefined);
    adjustHeight(el);
  };

  createEffect(() => {
    value();
    if (!textarea() || local.disableAutosize) return;

    const el = textarea();
    if (!el) return;
    el.style.height = 'auto';

    if (typeof maxHeight() === 'number') {
      el.style.height = `${Math.min(el.scrollHeight, maxHeight())}px`;
    } else {
      el.style.height = `min(${el.scrollHeight}px, ${maxHeight()})`;
    }
  });

  const handleChange = (e: Event & { currentTarget: HTMLTextAreaElement }) => {
    adjustHeight(e.currentTarget);
    setValue(e.currentTarget.value);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit()?.();
    }
    local.onKeyDown?.(e);
  };

  return (
    <Textarea
      ref={handleRef}
      value={value()}
      onInput={handleChange}
      onKeyDown={handleKeyDown}
      class={cn(
        'text-foreground min-h-[44px] w-full resize-none border-none bg-transparent shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
        local.className,
      )}
      rows={1}
      disabled={disabled()}
      {...props}
    />
  );
}

export type PromptInputActionsProps = {
  children?: JSX.Element;
  className?: string;
} & Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children' | 'className'>;

function PromptInputActions(_props: PromptInputActionsProps) {
  const [local, props] = splitProps(_props, ['children', 'className']);
  return (
    <div class={cn('flex items-center gap-2', local.className)} {...props}>
      {local.children}
    </div>
  );
}

export type PromptInputActionProps = {
  className?: string;
  tooltip: JSX.Element;
  children: JSX.Element;
  side?: 'top' | 'bottom' | 'left' | 'right';
} & ComponentProps<typeof Tooltip>;

function PromptInputAction(_props: PromptInputActionProps) {
  const merged = mergeProps({ side: 'top' }, _props);
  const [local, props] = splitProps(merged, [
    'tooltip',
    'children',
    'className',
    'side',
  ]);
  const { disabled } = usePromptInput();

  return (
    <Tooltip {...props}>
      <TooltipTrigger
        asChild
        disabled={disabled()}
        onClick={(event) => event.stopPropagation()}
      >
        {local.children}
      </TooltipTrigger>
      <TooltipContent side={local.side} class={local.className}>
        {local.tooltip}
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
