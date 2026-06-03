import { createSignal } from 'solid-js';

import { cn } from '@/lib/utils';

const convertToString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value, null, 2);
};

const tryParseJson = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
};

type JsonEditorProps = {
  field: {
    value: unknown;
    onChange: (event: { target: { value: unknown } }) => void;
  };
  readonly: boolean;
  onFocus?: (ref: HTMLTextAreaElement | undefined) => void;
  className?: string;
};

const JsonEditor = (props: JsonEditorProps) => {
  const [value, setValue] = createSignal(convertToString(props.field.value));
  let ref: HTMLTextAreaElement | undefined;
  return (
    <div class="flex flex-col gap-2 border rounded py-2 px-2">
      <textarea
        ref={(el) => (ref = el)}
        value={value()}
        class={cn('border-none', props.className)}
        style={{ height: '250px', width: '100%' }}
        readOnly={props.readonly}
        onInput={(e) => {
          const value = e.currentTarget.value;
          setValue(value);
          props.field.onChange({ target: { value: tryParseJson(value) } });
        }}
        onFocus={() => props.onFocus?.(ref)}
      />
    </div>
  );
};

export { JsonEditor };
