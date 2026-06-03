import {
  Permission,
  Template,
  TemplateType,
  UncategorizedFolderId,
} from '@activepieces/shared';
import { useNavigate } from '@solidjs/router';
import { t } from 'i18next';
import {
  ChevronRight,
  Plus,
  Sparkles,
  Table2,
  Upload,
  Workflow,
} from 'lucide-solid';
import {
  For,
  Show,
  createMemo,
  createSignal,
  mergeProps,
  untrack,
  type JSX,
} from 'solid-js';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { TagWithBright } from '@/components/custom/tag-with-bright';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ImportFlowDialog } from '@/features/flows/components/import-flow-dialog';
import { flowHooks } from '@/features/flows/hooks/flow-hooks';
import { PieceIconList } from '@/features/pieces/components/piece-icon-list';
import { ImportTableDialog } from '@/features/tables/components/import-table-dialog';
import { tableHooks } from '@/features/tables/hooks/table-hooks';
import { TemplatesBrowseDialog } from '@/features/templates';
import { UseTemplateDialog } from '@/features/templates/components/use-template-dialog';
import { templatesHooks } from '@/features/templates/hooks/templates-hook';
import { useGradientFromPieces } from '@/features/templates/hooks/use-gradient-from-pieces';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

type ActionRowProps = {
  icon: JSX.Element;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  hasPermission?: boolean;
};

const ActionRow = (_props: ActionRowProps) => {
  const props = mergeProps({ hasPermission: true }, _props);
  const content = (
    <button
      onClick={() => props.onClick?.()}
      disabled={props.disabled || !props.hasPermission}
      class="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-t first:border-t-0"
    >
      <div class="flex items-center gap-3">
        <span class="text-muted-foreground">{props.icon}</span>
        <span class="text-sm font-medium">{props.label}</span>
      </div>
      <ChevronRight class="h-4 w-4 text-muted-foreground" />
    </button>
  );

  return (
    <Show when={!props.hasPermission} fallback={content}>
      <PermissionNeededTooltip hasPermission={props.hasPermission}>
        {content}
      </PermissionNeededTooltip>
    </Show>
  );
};

type GetStartedCardProps = {
  icon: JSX.Element;
  iconBgClass: string;
  title: string;
  description: string;
  children: JSX.Element;
};

const GetStartedCard = (props: GetStartedCardProps) => {
  return (
    <Card class="flex-1 overflow-hidden">
      <CardContent class="p-0">
        <div class="flex items-center gap-3 px-4 py-4">
          <div
            class={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              props.iconBgClass,
            )}
          >
            {props.icon}
          </div>
          <div>
            <h3 class="font-semibold text-base">{props.title}</h3>
            <p class="text-sm text-muted-foreground">{props.description}</p>
          </div>
        </div>
        <div class="flex flex-col">{props.children}</div>
      </CardContent>
    </Card>
  );
};

type SuggestedTemplateCardProps = {
  template: Template;
  onSelect: (template: Template) => void;
};

const SuggestedTemplateCard = (props: SuggestedTemplateCardProps) => {
  const trigger = createMemo(() => props.template.flows?.[0]?.trigger);
  const hasFlows = createMemo(() => trigger() !== undefined);
  const { gradient } = useGradientFromPieces(untrack(trigger));

  const displayTags = createMemo(() => props.template.tags.slice(0, 1));

  return (
    <Card
      onClick={() => props.onSelect(props.template)}
      variant="interactive"
      class="h-[220px] flex flex-col"
    >
      <CardContent class="py-4 px-4 flex flex-col gap-1 flex-1 min-h-0">
        <div class="h-12 flex flex-col justify-start flex-shrink-0">
          <h3 class="font-semibold text-base leading-tight line-clamp-2">
            {props.template.name}
          </h3>
        </div>

        <p class="text-muted-foreground text-sm line-clamp-2 mt-1 flex-shrink-0">
          {props.template.summary || (
            <span class="italic">{t('No summary')}</span>
          )}
        </p>

        <div class="h-8 flex gap-2 flex-wrap overflow-hidden mt-2 flex-shrink-0">
          <Show when={displayTags().length > 0}>
            <For each={displayTags()}>
              {(tag, index) => (
                <TagWithBright
                  index={index()}
                  prefix={t('Save')}
                  title={tag.title}
                  color={tag.color}
                  size="sm"
                />
              )}
            </For>
          </Show>
        </div>
      </CardContent>

      <div
        class="h-14 flex items-center px-4 rounded-b-lg transition-all duration-300"
        style={{
          background: gradient || 'rgba(0,0,0,0.02)',
        }}
      >
        <Show when={hasFlows() && trigger()}>
          <PieceIconList
            trigger={trigger()}
            maxNumberOfIconsToShow={4}
            size="md"
            class="flex gap-0.5"
            background="white"
            excludeCore={true}
          />
        </Show>
      </div>
    </Card>
  );
};

const TemplateCardSkeleton = () => {
  return (
    <Card class="h-[220px] flex flex-col">
      <CardContent class="py-4 px-4 flex flex-col gap-2 flex-1">
        <Skeleton class="h-6 w-3/4" />
        <Skeleton class="h-4 w-full mt-2" />
        <Skeleton class="h-4 w-2/3" />
        <Skeleton class="h-6 w-24 mt-2" />
      </CardContent>
      <div class="h-14 bg-muted/30 rounded-b-lg" />
    </Card>
  );
};

type AutomationsEmptyStateProps = {
  onRefresh: () => void;
};

export const AutomationsEmptyState = (props: AutomationsEmptyStateProps) => {
  const navigate = useNavigate();
  const { embedState } = useEmbedding();
  const [isImportTableDialogOpen, setIsImportTableDialogOpen] =
    createSignal(false);
  const [isTemplatesBrowseDialogOpen, setIsTemplatesBrowseDialogOpen] =
    createSignal(false);
  const [selectedTemplate, setSelectedTemplate] = createSignal<Template | null>(
    null,
  );
  const [useTemplateDialogOpen, setUseTemplateDialogOpen] = createSignal(false);

  const { checkAccess } = useAuthorization();
  const userHasPermissionToWriteFlow = checkAccess(Permission.WRITE_FLOW);
  const userHasPermissionToWriteTable = checkAccess(Permission.WRITE_TABLE);

  const { platform } = platformHooks.useCurrentPlatform();
  const isShowingOfficialTemplates = !platform.plan.manageTemplatesEnabled;

  const { templates, isLoading: isLoadingTemplates } =
    templatesHooks.useTemplates(
      isShowingOfficialTemplates ? TemplateType.OFFICIAL : TemplateType.CUSTOM,
    );

  const { mutate: createFlow, isPending: isCreateFlowPending } =
    flowHooks.useStartFromScratch(UncategorizedFolderId);

  const { mutate: createTable, isPending: isCreateTablePending } =
    tableHooks.useCreateTable(UncategorizedFolderId);

  const handleTemplateSelect = (template: Template) => {
    if (embedState.isEmbedded) {
      setSelectedTemplate(template);
      setUseTemplateDialogOpen(true);
    } else {
      navigate(`/templates/${template.id}`);
    }
  };

  const handleViewAllTemplates = () => {
    if (embedState.isEmbedded) {
      setIsTemplatesBrowseDialogOpen(true);
    } else {
      navigate('/templates');
    }
  };

  const topTemplates = createMemo(() => templates?.slice(0, 3) || []);
  const hasTemplates = createMemo(() => topTemplates().length > 0);
  const branding = flagsHooks.useWebsiteBranding();

  return (
    <div class="flex flex-col gap-8 py-8 px-4 max-w-5xl mx-auto">
      <div>
        <h2 class="text-sm font-medium text-muted-foreground mb-4">
          {t('Get started with {brandName}', {
            brandName: branding()?.websiteName ?? platform.name,
          })}
        </h2>
        <div class="flex gap-4">
          <GetStartedCard
            icon={<Workflow class="h-5 w-5 text-primary" />}
            iconBgClass="bg-primary-100"
            title={t('Build a Flow')}
            description={t('Create automated workflows')}
          >
            <ActionRow
              icon={<Plus class="h-4 w-4" />}
              label={t('Start from scratch')}
              onClick={() => createFlow()}
              disabled={isCreateFlowPending}
              hasPermission={userHasPermissionToWriteFlow}
            />
            <PermissionNeededTooltip
              hasPermission={userHasPermissionToWriteFlow}
            >
              <ImportFlowDialog
                insideBuilder={false}
                onRefresh={props.onRefresh}
                folderId={UncategorizedFolderId}
              >
                <button
                  disabled={!userHasPermissionToWriteFlow}
                  class="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-t"
                >
                  <div class="flex items-center gap-3">
                    <span class="text-muted-foreground">
                      <Upload class="h-4 w-4" />
                    </span>
                    <span class="text-sm font-medium">{t('Import')}</span>
                  </div>
                  <ChevronRight class="h-4 w-4 text-muted-foreground" />
                </button>
              </ImportFlowDialog>
            </PermissionNeededTooltip>
            <ActionRow
              icon={<Sparkles class="h-4 w-4" />}
              label={t('Use Templates')}
              onClick={() => {
                if (embedState.isEmbedded) {
                  setIsTemplatesBrowseDialogOpen(true);
                } else {
                  navigate('/templates');
                }
              }}
              hasPermission={userHasPermissionToWriteFlow}
            />
          </GetStartedCard>

          <Show when={!embedState.hideTables}>
            <GetStartedCard
              icon={<Table2 class="h-5 w-5 text-primary" />}
              iconBgClass="bg-primary-100"
              title={t('Create a Table')}
              description={t('Organize and manage data')}
            >
              <ActionRow
                icon={<Plus class="h-4 w-4" />}
                label={t('Start from scratch')}
                onClick={() => createTable({ name: t('New Table') })}
                disabled={isCreateTablePending}
                hasPermission={userHasPermissionToWriteTable}
              />
              <ActionRow
                icon={<Upload class="h-4 w-4" />}
                label={t('Import')}
                onClick={() => setIsImportTableDialogOpen(true)}
                hasPermission={userHasPermissionToWriteTable}
              />
            </GetStartedCard>
          </Show>
        </div>
      </div>

      <Show when={hasTemplates() || isLoadingTemplates}>
        <div>
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {t('Templates For You')}
              <Sparkles class="h-4 w-4 text-yellow-500" />
            </h2>
            <button
              onClick={handleViewAllTemplates}
              class="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              {t('All templates')}
              <ChevronRight class="h-4 w-4" />
            </button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Show
              when={isLoadingTemplates}
              fallback={
                <For each={topTemplates()}>
                  {(template) => (
                    <SuggestedTemplateCard
                      template={template}
                      onSelect={handleTemplateSelect}
                    />
                  )}
                </For>
              }
            >
              <>
                <TemplateCardSkeleton />
                <TemplateCardSkeleton />
                <TemplateCardSkeleton />
              </>
            </Show>
          </div>
        </div>
      </Show>

      <Show when={!embedState.hideTables}>
        <ImportTableDialog
          open={isImportTableDialogOpen}
          setIsOpen={setIsImportTableDialogOpen}
          showTrigger={false}
        />
      </Show>
      <TemplatesBrowseDialog
        open={isTemplatesBrowseDialogOpen}
        onOpenChange={setIsTemplatesBrowseDialogOpen}
      />
      <Show when={selectedTemplate()}>
        <UseTemplateDialog
          key={selectedTemplate()?.id}
          template={selectedTemplate()}
          open={useTemplateDialogOpen}
          onOpenChange={(isOpen) => {
            setUseTemplateDialogOpen(isOpen);
            if (!isOpen) setSelectedTemplate(null);
          }}
        />
      </Show>
    </div>
  );
};
