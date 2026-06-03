import { isNil } from '@activepieces/shared';
import { createEffect, createSignal, Show, mergeProps } from 'solid-js';

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

const EditableText = (_props: EditableTextProps) => {
  const props = mergeProps({ className: '', readonly: false }, _props);
  const [value, setValue] = createSignal<EditableTextProps['value']>();
  let isEditingPreviousRef = false;
  let valueOnEditingStartedRef = '';

  let editableTextRef: HTMLDivElement | undefined;

  createEffect(() => {
    if (value() !== props.value) {
      setValue(props.value);
    }
  });

  const emitChangedValue = () => {
    const text = editableTextRef?.textContent;
    if (!text) {
      setValue(valueOnEditingStartedRef);
      return;
    }

    const nodeValue = text.trim();
    const shouldUpdateValue =
      nodeValue.length > 0 && nodeValue !== valueOnEditingStartedRef;

    setValue(shouldUpdateValue ? nodeValue : valueOnEditingStartedRef);
    if (shouldUpdateValue) {
      props.onValueChange(nodeValue);
    }
  };

  const setSelectionToValue = () => {
    requestAnimationFrame(() => {
      if (editableTextRef) {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(editableTextRef);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    });
  };

  createEffect(() => {
    if (props.isEditing && !isEditingPreviousRef) {
      const text = value();
      valueOnEditingStartedRef = text ? text.trim() : '';

      setSelectionToValue();
    }
    isEditingPreviousRef = props.isEditing;
  });

  return (
    <Show
      when={!props.isEditing}
      fallback={
        <div
          ref={(el) => {
            editableTextRef = el;
          }}
          contentEditable
          suppressContentEditableWarning={true}
          class={`${props.className}  focus:outline-hidden break-all`}
          onBlur={() => {
            emitChangedValue();
            props.setIsEditing(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setValue(valueOnEditingStartedRef);
              props.setIsEditing(false);
            } else if (event.key === 'Enter') {
              emitChangedValue();
              props.setIsEditing(false);
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
            props.readonly ||
            props.isEditing ||
            props.disallowEditingOnClick ||
            isNil(props.tooltipContent)
          }
          asChild
        >
          <div
            onClick={() => {
              if (
                !props.isEditing &&
                !props.readonly &&
                !props.disallowEditingOnClick
              ) {
                props.setIsEditing(true);
              }
            }}
            ref={(el) => {
              editableTextRef = el;
            }}
            class={`${props.className} truncate `}
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
        <Show when={props.tooltipContent}>
          <TooltipContent class="font-normal z-50" side="bottom">
            {props.tooltipContent}
          </TooltipContent>
        </Show>
      </Tooltip>
    </Show>
  );
};

export default EditableText;
