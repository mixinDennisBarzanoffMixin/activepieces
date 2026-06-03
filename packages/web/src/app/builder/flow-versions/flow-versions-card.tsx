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

const FlowVersionDetailsCard = (props: FlowVersionDetailsCardProps) => {
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
      <Show when={showAvatar && props.flowVersion.updatedByUser}>
        <UserAvatar
          size={45}
          withoutBorder={true}
          name={
            props.flowVersion.updatedByUser.firstName +
            ' ' +
            props.flowVersion.updatedByUser.lastName
          }
          email={props.flowVersion.updatedByUser.email}
        />
      </Show>
      <div class="grid gap-2">
        <FormattedDate
          date={new Date(props.flowVersion.created)}
          includeTime={true}
          class="text-sm font-medium leading-none select-none cursor-default"
        />
        <p class="flex gap-1 text-xs text-muted-foreground">
          {t('Version')} #{props.flowVersionNumber}
        </p>
      </div>
      <div class="grow" />
      <div class="flex font-medium gap-2 justify-center items-center">
        <Show when={props.selected}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div class="size-10 flex justify-center items-center">
                <EyeIcon class="w-5 h-5 " />
              </div>
            </TooltipTrigger>
            <TooltipContent>{t('Viewing')}</TooltipContent>
          </Tooltip>
        </Show>

        <FlowVersionStateDot
          state={props.flowVersion.state}
          versionId={props.flowVersion.id}
          publishedVersionId={props.publishedVersionId}
        />

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
              onClick={() => viewVersion(props.flowVersion)}
              class="w-full"
            >
              <Eye class="mr-2 h-4 w-4" />
              <span>{t('View')}</span>
            </DropdownMenuItem>
            <Show when={props.flowVersion.state !== FlowVersionState.DRAFT}>
              <OverwriteDraftDialog
                versionNumber={props.flowVersionNumber.toString()}
                versionId={props.flowVersion.id}
                onConfirm={() => {
                  setDropdownMenuOpen(false);
                }}
              >
                <DropdownMenuItem
                  class="w-full"
                  onSelect={(e: Event) => {
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

export { FlowVersionDetailsCard };

type FlowVersionDetailsCardProps = {
  flowVersion: FlowVersionMetadata;
  selected: boolean;
  publishedVersionId: string | undefined | null;
  flowVersionNumber: number;
};
