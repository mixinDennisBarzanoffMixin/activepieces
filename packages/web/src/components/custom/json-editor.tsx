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
  field: any;
  readonly: boolean;
  onFocus?: (ref: any) => void;
  className?: string;
};

const JsonEditor = ({
  field,
  readonly,
  onFocus,
  className,
}: JsonEditorProps) => {
  const [value, setValue] = createSignal(convertToString(field.value));
  let ref: any;
  return (
    <div className="flex flex-col gap-2 border rounded py-2 px-2">
      <textarea
        ref={(el) => (ref = el)}
        value={value()}
        class={cn('border-none', className)}
        style={{ height: '250px', width: '100%' }}
        readOnly={readonly}
        onInput={(e) => {
          const value = e.currentTarget.value;
          setValue(value);
          field.onChange({ target: { value: tryParseJson(value) } });
        }}
        onFocus={() => onFocus?.(ref)}
      />
    </div>
  );
};

JsonEditor.displayName = 'JsonEditor';
export { JsonEditor };
