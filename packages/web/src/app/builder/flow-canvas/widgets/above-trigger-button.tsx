import { t } from 'i18next';
import { Show, createEffect, mergeProps } from 'solid-js';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { isMac } from '@/lib/dom-utils';
import { cn } from '@/lib/utils';

type AboveTriggerButtonProps = {
  onClick: () => void;
  text: string;
  disable?: boolean;
  loading?: boolean;
  showKeyboardShortcut?: boolean;
  shortCutIsEscape?: boolean;
  showPrimaryBg?: boolean;
};

const AboveTriggerButton = (_props: AboveTriggerButtonProps) => {
  const props = mergeProps(
    {
      disable: false,
      loading: false,
      showKeyboardShortcut: true,
      shortCutIsEscape: false,
      showPrimaryBg: true,
    },
    _props,
  );
  const isMacSystem = isMac();

  createEffect(() => {
    const keydownHandler = (event: KeyboardEvent) => {
      const isEscapePressed = event.key === 'Escape' && props.shortCutIsEscape;
      const ctrlAndDPressed =
        (isMacSystem &&
          event.metaKey &&
          event.key.toLocaleLowerCase() === 'd') ||
        (!isMacSystem &&
          event.ctrlKey &&
          event.key.toLocaleLowerCase() === 'd');
      if (isEscapePressed || ctrlAndDPressed) {
        event.preventDefault();
        event.stopPropagation();
        if (!props.loading && !props.disable) {
          props.onClick();
        }
      }
    };

    window.addEventListener('keydown', keydownHandler, { capture: true });

    return () => {
      window.removeEventListener('keydown', keydownHandler, { capture: true });
    };
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div class="bg-builder-background">
          <Button
            variant="ghost"
            class={cn(
              'h-8 bg-background border-input hover:border-border  border p-2.5 border-solid rounded-lg animate-fade',
              {
                'bg-primary-100/50! dark:text-primary-foreground  text-primary hover:text-primary disabled:pointer-events-auto hover:border-primary!  border-primary/50':
                  props.showPrimaryBg,
              },
            )}
            loading={props.loading}
            disabled={props.disable}
            onClick={props.onClick}
          >
            <div class="flex justify-center items-center gap-2">
              {props.text}
              <Show when={props.showKeyboardShortcut}>
                <span
                  class={cn(
                    'text-[10px] bg-muted h-[20px] flex items-center justify-center px-1 rounded-sm tracking-widest whitespace-nowrap text-muted-foreground',
                    {
                      'bg-primary/13 text-primary': props.showPrimaryBg,
                    },
                  )}
                >
                  <Show
                    when={props.shortCutIsEscape}
                    fallback={isMacSystem ? '⌘ + D' : 'Ctrl + D'}
                  >
                    {'Esc'}
                  </Show>
                </span>
              </Show>
            </div>
          </Button>
        </div>
      </TooltipTrigger>
      <Show when={props.disable}>
        <TooltipContent side="bottom">
          {t('Please test the trigger first')}
        </TooltipContent>
      </Show>
    </Tooltip>
  );
};

export { AboveTriggerButton };
