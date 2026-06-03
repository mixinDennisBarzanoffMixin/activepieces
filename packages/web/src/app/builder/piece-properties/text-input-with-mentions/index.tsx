import { isNil } from '@activepieces/shared';

import { inputClass } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../../builder-hooks';

import { textMentionUtils } from './text-input-utils';

type TextInputWithMentionsProps = {
  className?: string;
  initialValue?: unknown;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  enableMarkdown?: boolean;
};

function convertToText(value: unknown): string {
  if (isNil(value)) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  return JSON.stringify(value);
}

export const TextInputWithMentions = (props: TextInputWithMentionsProps) => {
  const setInsertMentionHandler = useBuilderStateContext((state) => ({
    value: state.setInsertMentionHandler,
  })).value;

  const insertMention = (propertyPath: string) => {
    props.onChange(`${convertToText(props.initialValue)}{{${propertyPath}}}`);
  };

  return (
    <div class="w-full">
      <textarea
        class={cn(
          props.className ?? cn(inputClass, 'py-2 h-[unset] block min-h-9'),
          textMentionUtils.inputWithMentionsCssClass,
          {
            'cursor-not-allowed opacity-50': props.disabled,
          },
        )}
        disabled={props.disabled}
        placeholder={props.placeholder}
        value={convertToText(props.initialValue)}
        onFocus={() => setInsertMentionHandler(insertMention)}
        onInput={(e) => props.onChange(e.currentTarget.value)}
      />
    </div>
  );
};
