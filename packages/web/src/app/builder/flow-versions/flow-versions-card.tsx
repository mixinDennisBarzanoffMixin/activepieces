import {
  FlowVersionMetadata,
  FlowVersionState,
  Permission,
} from '@activepieces/shared';
import { t } from 'i18next';
import { EllipsisVertical, Eye, EyeIcon, Pencil } from 'lucide-solid';
import { Show, createSignal } from 'solid-js';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { CardListItem } from '@/components/custom/card-list';
import { FormattedDate } from '@/components/custom/formatted-date';
import { UserAvatar } from '@/components/custom/user-avatar';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FlowVersionStateDot, flowHooks } from '@/features/flows';
import { useAuthorization } from '@/hooks/authorization-hooks';

import { OverwriteDraftDialog } from './overwrite-draft-dialog';

const FlowVersionDetailsCard = ({
  flowVersion,
  selected,
  publishedVersionId,
  flowVersionNumber,
}: FlowVersionDetailsCardProps) => {
  const { checkAccess } = useAuthorization();
  const userHasPermissionToWriteFlow = checkAccess(Permission.WRITE_FLOW);
  const [setVersion, setReadonly] = useBuilderStateContext((state) => [
    state.setVersion,
    state.setReadOnly,
  ]);
  const [dropdownMenuOpen, setDropdownMenuOpen] = createSignal(false);
  const { mutate: viewVersion, isPending } = flowHooks.useFetchFlowVersion({
    onSuccess: (populatedFlowVersion) => {
      setVersion(populatedFlowVersion);
      setReadonly(
        populatedFlowVersion.state === FlowVersionState.LOCKED ||
          !userHasPermissionToWriteFlow,
      );
    },
  });

  const showAvatar = !useEmbedding().embedState.isEmbedded;

  return (
    <CardListItem interactive={false} class="px-4">
      <Show when={showAvatar && flowVersion.updatedByUser()}>
        <UserAvatar
          size={45}
          withoutBorder={true}
          name={
            flowVersion.updatedByUser.firstName +
            ' ' +
            flowVersion.updatedByUser.lastName
          }
          email={flowVersion.updatedByUser.email}
        />
      </Show>
      <div className="grid gap-2">
        <FormattedDate
          date={new Date(flowVersion.created)}
          includeTime={true}
          class="text-sm font-medium leading-none select-none cursor-default"
        ></FormattedDate>
        <p className="flex gap-1 text-xs text-muted-foreground">
          {t('Version')} #{flowVersionNumber}
        </p>
      </div>
      <div className="grow"></div>
      <div className="flex font-medium gap-2 justify-center items-center">
        <Show when={selected()}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="size-10 flex justify-center items-center">
                <EyeIcon class="w-5 h-5 "></EyeIcon>
              </div>
            </TooltipTrigger>
            <TooltipContent>{t('Viewing')}</TooltipContent>
          </Tooltip>
        </Show>

        <FlowVersionStateDot
          state={flowVersion.state}
          versionId={flowVersion.id}
          publishedVersionId={publishedVersionId}
        ></FlowVersionStateDot>

        <DropdownMenu
          onOpenChange={(open) => setDropdownMenuOpen(open)}
          open={dropdownMenuOpen}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" disabled={isPending} size={'icon'}>
              <EllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-40">
            <DropdownMenuItem
              onClick={() => viewVersion(flowVersion)}
              class="w-full"
            >
              <Eye class="mr-2 h-4 w-4" />
              <span>{t('View')}</span>
            </DropdownMenuItem>
            <Show when={flowVersion.state !== FlowVersionState.DRAFT()}>
              <OverwriteDraftDialog
                versionNumber={flowVersionNumber.toString()}
                versionId={flowVersion.id}
                onConfirm={() => {
                  setDropdownMenuOpen(false);
                }}
              >
                <DropdownMenuItem
                  class="w-full"
                  onSelect={(e) => {
                    e.preventDefault();
                  }}
                  disabled={!userHasPermissionToWriteFlow}
                >
                  <Pencil class="mr-2 h-4 w-4" />
                  <span>{t('Use as Draft')}</span>
                </DropdownMenuItem>
              </OverwriteDraftDialog>
            </Show>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardListItem>
  );
};

FlowVersionDetailsCard.displayName = 'FlowVersionDetailsCard';
export { FlowVersionDetailsCard };

type FlowVersionDetailsCardProps = {
  flowVersion: FlowVersionMetadata;
  selected: boolean;
  publishedVersionId: string | undefined | null;
  flowVersionNumber: number;
};
