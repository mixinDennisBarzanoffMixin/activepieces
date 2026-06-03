import { NoteColorVariant } from '@activepieces/shared';
import { Editor } from '@tiptap/core';
import { t } from 'i18next';
import { TrashIcon } from 'lucide-solid';
import { For, JSX, createSignal } from 'solid-js';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import {
  MarkdownTools,
  ToolWrapper,
} from '@/components/custom/markdown-input/tools';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export const NoteTools = (props: NoteToolsProps) => {
  let containerRef: HTMLDivElement | undefined;
  const [updateNoteColor, deleteNote] = useBuilderStateContext((state) => [
    state.updateNoteColor,
    state.deleteNote,
  ]);
  return (
    <div
      ref={(el) => (containerRef = el)}
      class="absolute cursor-default -top-[45px] w-full left-0"
    >
      <div class="flex items-center justify-center">
        <div class="p-1 bg-background flex items-center gap-0.5 shadow-md rounded-lg scale-65 border border-solid border-border">
          <NoteColorPicker
            currentColor={props.currentColor}
            setCurrentColor={(color: NoteColorVariant) => {
              updateNoteColor(props.id, color);
            }}
            container={containerRef}
          />
          <MarkdownTools editor={props.editor} />
          <Separator orientation="vertical" class="h-[30px]" />
          <ToolWrapper tooltip={t('Delete')}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                deleteNote(props.id);
              }}
            >
              <TrashIcon class="size-4 text-destructive" />
            </Button>
          </ToolWrapper>
        </div>
      </div>
    </div>
  );
};

const NoteColorPickerClassName = {
  [NoteColorVariant.YELLOW]: 'bg-amber-400',
  [NoteColorVariant.ORANGE]: 'bg-orange-400',
  [NoteColorVariant.RED]: 'bg-red-400',
  [NoteColorVariant.GREEN]: 'bg-green-400',
  [NoteColorVariant.BLUE]: 'bg-blue-400',
  [NoteColorVariant.PURPLE]: 'bg-purple-400',
};

const NoteColorPicker = (props: NoteColorPickerProps) => {
  const [open, setOpen] = createSignal(false);
  let popoverTriggerRef: HTMLButtonElement | undefined;
  return (
    <Popover onOpenChange={setOpen} open={open}>
      <ToolWrapper tooltip={t('Color')}>
        <PopoverTrigger asChild>
          <div>
            <ColorButton
              color={props.currentColor}
              big={true}
              ref={(el) => (popoverTriggerRef = el)}
            />
          </div>
        </PopoverTrigger>
      </ToolWrapper>

      <PopoverContent
        container={props.container}
        side="top"
        class="w-[80px] p-1 mb-2"
      >
        <div class="flex items-center cursor-default gap-1 justify-between flex-wrap w-full ">
          <For each={Object.values(NoteColorVariant)}>
            {(color) => (
              <ColorButton
                key={color}
                color={color}
                onClick={() => {
                  props.setCurrentColor(color);
                  setOpen(false);
                  requestAnimationFrame(() => {
                    popoverTriggerRef?.focus();
                  });
                }}
              />
            )}
          </For>
        </div>
      </PopoverContent>
    </Popover>
  );
};

type NoteToolsProps = {
  editor: Editor;
  currentColor: NoteColorVariant;
  id: string;
};

type NoteColorPickerProps = {
  currentColor: NoteColorVariant;
  setCurrentColor: (color: NoteColorVariant) => void;
  container: HTMLDivElement | null;
};

function ColorButton(props: ColorButtonProps) {
  return (
    <Button
      key={props.color}
      ref={props.ref}
      variant="ghost"
      size="icon"
      role="button"
      class={cn('size-5 shrink-0 grow flex items-center justify-center', {
        'size-6': props.big,
      })}
      onClick={props.onClick}
    >
      <div
        class={cn(
          NoteColorPickerClassName[props.color] ??
            NoteColorPickerClassName[NoteColorVariant.YELLOW],
          'size-4 shrink-0 rounded-full',
          {
            'size-5': props.big,
          },
        )}
      />
    </Button>
  );
}

type ColorButtonProps = JSX.IntrinsicElements['button'] & {
  color: NoteColorVariant;
  onClick?: () => void;
  big?: boolean;
};
