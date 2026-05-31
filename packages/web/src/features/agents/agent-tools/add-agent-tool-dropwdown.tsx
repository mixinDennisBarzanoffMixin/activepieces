import { t } from 'i18next';
import { Hammer, Workflow } from 'lucide-solid';
import { createSignal } from 'solid-js';

import { McpSvg } from '@/assets/img/custom/mcp';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useFlowToolDialogStore } from './stores/flows-tools';
import { useMcpToolDialogStore } from './stores/mcp-tools';
import { usePieceToolsDialogStore } from './stores/pieces-tools';

type AddAgentToolDropdownProps = {
  disabled?: boolean;
  children: any;
  align?: 'start' | 'end' | 'center';
};

export const AddToolDropdown = ({
  disabled,
  children,
  align,
}: AddAgentToolDropdownProps) => {
  const [openDropdown, setOpenDropdown] = createSignal(false);

  const { setShowAddFlowDialog } = useFlowToolDialogStore();
  const { openAddPieceToolDialog } = usePieceToolsDialogStore();
  const { setShowAddMcpDialog } = useMcpToolDialogStore();

  return (
    <DropdownMenu
      modal={false}
      open={openDropdown}
      onOpenChange={setOpenDropdown}
    >
      <DropdownMenuTrigger disabled={disabled} asChild>
        {children}
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align}>
        <DropdownMenuItem
          onSelect={() => openAddPieceToolDialog({ page: 'pieces-list' })}
        >
          <Hammer class="size-3.5 me-2" />
          <span>{t('Piece tool')}</span>
        </DropdownMenuItem>

        <DropdownMenuItem onSelect={() => setShowAddFlowDialog(true)}>
          <Workflow class="size-3.5 me-2" />
          <span>{t('Flow tool')}</span>
        </DropdownMenuItem>

        <DropdownMenuItem onSelect={() => setShowAddMcpDialog(true)}>
          <McpSvg class="size-3.5 me-2" />
          <span>{t('Mcp server')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
