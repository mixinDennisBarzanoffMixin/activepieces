import { t } from 'i18next';
import { Show } from 'solid-js';

import { PanelLeftCloseIcon } from '@/components/icons/panel-left-close';
import { PanelLeftOpenIcon } from '@/components/icons/panel-left-open';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const ApSidebarToggle = () => {
  const { open, setOpen } = useSidebar();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
          <Show when={open()} fallback={<PanelLeftOpenIcon size={16} />}>
            <PanelLeftCloseIcon size={16} />
          </Show>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {open() ? t('Close Sidebar') : t('Open Sidebar')}
      </TooltipContent>
    </Tooltip>
  );
};
