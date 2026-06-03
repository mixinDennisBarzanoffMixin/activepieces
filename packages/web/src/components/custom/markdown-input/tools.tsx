import type { Editor } from '@tiptap/core';
import { t } from 'i18next';
import {
  ImageIcon,
  UnderlineIcon,
  ItalicIcon,
  Strikethrough,
  BoldIcon,
  ArrowDown,
} from 'lucide-solid';
import { createEffect, createSignal, type JSX } from 'solid-js';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const MarkdownTools = (props: { editor: Editor }) => {
  // Tiptap updates active marks after commands finish, so mirror them for button state.
  const [activeState, setActiveState] = createSignal({
    isStrikeActive: props.editor.isActive('strike'),
    isBoldActive: props.editor.isActive('bold'),
    isItalicActive: props.editor.isActive('italic'),
    isUnderlineActive: props.editor.isActive('underline'),
  });
  const handleStrike = () => {
    if (!hasEditorCommands(props.editor.commands)) {
      return;
    }
    props.editor.setEditable(true);
    props.editor.commands.focus();
    props.editor.commands.toggleStrike();
    setActiveState({
      ...activeState(),
      isStrikeActive: !activeState().isStrikeActive,
    });
  };
  const handleBold = () => {
    if (!hasEditorCommands(props.editor.commands)) {
      return;
    }
    props.editor.setEditable(true);
    props.editor.commands.focus();
    props.editor.commands.toggleBold();
    setActiveState({
      ...activeState(),
      isBoldActive: !activeState().isBoldActive,
    });
  };
  const handleItalic = () => {
    if (!hasEditorCommands(props.editor.commands)) {
      return;
    }
    props.editor.setEditable(true);
    props.editor.commands.focus();
    props.editor.commands.toggleItalic();
    setActiveState({
      ...activeState(),
      isItalicActive: !activeState().isItalicActive,
    });
  };
  const handleUnderline = () => {
    if (!hasEditorCommands(props.editor.commands)) {
      return;
    }
    props.editor.setEditable(true);
    props.editor.commands.focus();
    props.editor.commands.toggleUnderline();
    setActiveState({
      ...activeState(),
      isUnderlineActive: !activeState().isUnderlineActive,
    });
  };
  createEffect(() => {
    setActiveState({
      isStrikeActive: props.editor.isActive('strike'),
      isBoldActive: props.editor.isActive('bold'),
      isItalicActive: props.editor.isActive('italic'),
      isUnderlineActive: props.editor.isActive('underline'),
    });
  });
  let containerRef: HTMLDivElement | undefined;
  return (
    <div
      ref={(el) => (containerRef = el)}
      class="flex items-center gap-0.5 text-foreground"
    >
      <ImageTool editor={props.editor} containerRef={containerRef} />
      <ToolWrapper tooltip={t('Strike')}>
        <Button
          onClick={handleStrike}
          size={'icon'}
          variant={activeState().isStrikeActive ? 'default' : 'ghost'}
        >
          <Strikethrough class="size-4" />
        </Button>
      </ToolWrapper>
      <ToolWrapper tooltip={t('Bold')}>
        <Button
          onClick={handleBold}
          size={'icon'}
          variant={activeState().isBoldActive ? 'default' : 'ghost'}
        >
          <BoldIcon class="size-4" />
        </Button>
      </ToolWrapper>
      <ToolWrapper tooltip={t('Italic')}>
        <Button
          onClick={handleItalic}
          size={'icon'}
          variant={activeState().isItalicActive ? 'default' : 'ghost'}
        >
          <ItalicIcon class="size-4" />
        </Button>
      </ToolWrapper>
      <ToolWrapper tooltip={t('Underline')}>
        <Button
          onClick={handleUnderline}
          size={'icon'}
          variant={activeState().isUnderlineActive ? 'default' : 'ghost'}
        >
          <UnderlineIcon class="size-4" />
        </Button>
      </ToolWrapper>
    </div>
  );
};

const ImageTool = (props: {
  editor: Editor;
  containerRef: HTMLDivElement | undefined;
}) => {
  const [open, setOpen] = createSignal(false);
  const [imageUrl, setImageUrl] = createSignal('');
  const handleAddImage = () => {
    if (!hasEditorCommands(props.editor.commands)) {
      return;
    }
    props.editor.commands.focus();
    props.editor.commands.setImage({
      src: imageUrl(),
      alt: 'note-img-' + Date.now(),
    });
    setImageUrl('');
    setOpen(false);
  };
  return (
    <Popover modal={false} open={open()} onOpenChange={setOpen}>
      <ToolWrapper tooltip={t('Image')}>
        <PopoverTrigger asChild>
          <Button size={'icon'} variant={'ghost'}>
            <ImageIcon class="size-4" />
          </Button>
        </PopoverTrigger>
      </ToolWrapper>
      <PopoverContent
        side="top"
        class="p-1 px-1.5 mb-1"
        container={props.containerRef}
      >
        <div class="flex items-center gap-2 min-w-[200px]">
          <Input
            class="h-8"
            onPointerDown={(ev) => ev.stopPropagation()}
            onKeyDown={(ev) => ev.key === 'Enter' && handleAddImage()}
            type="text"
            placeholder="Enter image URL"
            value={imageUrl()}
            onChange={(e) => setImageUrl(e.currentTarget.value)}
          />
          <Button
            size={'icon'}
            onClick={handleAddImage}
            disabled={imageUrl().length === 0}
            variant={'ghost'}
          >
            <ArrowDown class="size-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export const ToolWrapper = (props: {
  children: JSX.Element;
  tooltip: string;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{props.children}</TooltipTrigger>
      <TooltipContent>{props.tooltip}</TooltipContent>
    </Tooltip>
  );
};

function hasEditorCommands(
  commands: Editor['commands'],
): commands is EditorCommands {
  return (
    'setImage' in commands &&
    'toggleBold' in commands &&
    'toggleItalic' in commands &&
    'toggleStrike' in commands &&
    'toggleUnderline' in commands
  );
}

type EditorCommands = Editor['commands'] & {
  setImage: (attrs: { alt: string; src: string }) => boolean;
  toggleBold: () => boolean;
  toggleItalic: () => boolean;
  toggleStrike: () => boolean;
  toggleUnderline: () => boolean;
};
