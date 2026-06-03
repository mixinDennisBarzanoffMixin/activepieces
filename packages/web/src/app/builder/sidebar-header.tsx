import { t } from 'i18next';
import { X } from 'lucide-solid';
import { JSX, Show } from 'solid-js';

import { Button } from '@/components/ui/button';

type SidebarHeaderProps = {
  children: JSX.Element;
  onClose: () => void;
  leadingIcon?: JSX.Element;
  actions?: JSX.Element;
};
const SidebarHeader = (props: SidebarHeaderProps) => {
  return (
    <div class="flex px-3 py-2 w-full gap-2 text-base items-center min-h-[44px]">
      <Show when={props.leadingIcon}>
        <div class="shrink-0">{props.leadingIcon}</div>
      </Show>
      <div class="flex items-center gap-2 min-w-0 grow">{props.children}</div>
      {props.actions}
      <Button
        variant="ghost"
        size={'sm'}
        onClick={(e) => {
          e.stopPropagation();
          props.onClose();
        }}
        aria-label={t('Close')}
      >
        <X size={16} />
      </Button>
    </div>
  );
};

export { SidebarHeader };
