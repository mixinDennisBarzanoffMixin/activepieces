import { isNil } from '@activepieces/shared';
import { createSignal } from 'solid-js';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type EditableTextProps = {
  value: string | undefined;
  className?: string;
  readonly: boolean;
  onValueChange: (value: string) => void;
  tooltipContent?: string;
  disallowEditingOnClick?: boolean;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
};

const EditableText = ({
  value: initialValue,
  className = '',
  readonly = false,
  onValueChange,
  tooltipContent,
  disallowEditingOnClick,
  isEditing,
  setIsEditing,
}: EditableTextProps) => {
  const [value, setValue] = createSignal(initialValue);
  let isEditingPreviousRef = false;
  let valueOnEditingStartedRef = initialValue;

  if (value() !== initialValue) {
    setValue(initialValue);
  }
  let editableTextRef: HTMLDivElement | undefined;

  const emitChangedValue = () => {
    const nodeValue = (editableTextRef?.textContent ?? '').trim();
    const shouldUpdateValue =
      nodeValue.length > 0 && nodeValue !== valueOnEditingStartedRef;

    setValue(shouldUpdateValue ? nodeValue : valueOnEditingStartedRef);
    if (shouldUpdateValue) {
      onValueChange(nodeValue);
    }
  };

  const setSelectionToValue = () => {
    requestAnimationFrame(() => {
      if (editableTextRef && window.getSelection && document.createRange) {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(editableTextRef);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    });
  };

  if (isEditing && !isEditingPreviousRef) {
    valueOnEditingStartedRef = value() ? value().trim() : '';

    setSelectionToValue();
  }
  isEditingPreviousRef = isEditing;

  return (
    <Show
      when={!isEditing}
      fallback={
        <div
          key={'editable'}
          ref={(el) => (editableTextRef = el)}
          contentEditable
          suppressContentEditableWarning={true}
          className={`${className}  focus:outline-hidden break-all`}
          onBlur={() => {
            emitChangedValue();
            setIsEditing(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setValue(valueOnEditingStartedRef);
              setIsEditing(false);
            } else if (event.key === 'Enter') {
              emitChangedValue();
              setIsEditing(false);
            }
          }}
        >
          {value()}
        </div>
      }
    >
      <Tooltip>
        <TooltipTrigger
          disabled={
            readonly ||
            isEditing ||
            disallowEditingOnClick ||
            isNil(tooltipContent)
          }
          asChild
        >
          <div
            onClick={() => {
              if (!isEditing && !readonly && !disallowEditingOnClick) {
                setIsEditing(true);
              }
            }}
            ref={(el) => (editableTextRef = el)}
            key={'viewed'}
            className={`${className} truncate `}
            title={
              editableTextRef &&
              editableTextRef.scrollWidth > editableTextRef.clientWidth &&
              value()
                ? value()
                : ''
            }
          >
            {value()}
          </div>
        </TooltipTrigger>
        <Show when={tooltipContent}>
          <TooltipContent class="font-normal z-50" side="bottom">
            {tooltipContent}
          </TooltipContent>
        </Show>
      </Tooltip>
    </Show>
  );
};

EditableText.displayName = 'EditableText';
export default EditableText;
