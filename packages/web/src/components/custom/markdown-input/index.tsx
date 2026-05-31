import { cn } from '@/lib/utils';

export const MarkdownInput = (props: MarkdownInputProps) => {
  return (
    <textarea
      class={cn('h-full w-full resize-none bg-transparent outline-none', props.className)}
      value={props.initialValue}
      disabled={props.disabled}
      placeholder={props.placeholder}
      onInput={(e) => props.onChange(e.currentTarget.value)}
    />
  );
};

type MarkdownInputProps = {
  initialValue: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  onlyEditableOnDoubleClick?: boolean;
  placeholderClassName?: string;
};

MarkdownInput.displayName = 'MarkdownInput';
