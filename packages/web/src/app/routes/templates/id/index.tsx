import {
  isNil,
  PopulatedFlow,
  FlowVersionState,
  apId,
  FlowStatus,
  FlowOperationStatus,
  TemplateType,
  Template,
} from '@activepieces/shared';
import { useLocation, useNavigate } from '@solidjs/router';
import { t } from 'i18next';
import { ArrowLeft, ArrowRight, Link, ExternalLink } from 'lucide-solid';
import { createMemo, createSignal, createEffect, For, Show } from 'solid-js';
import { toast } from 'solid-sonner';

import { FlowCanvas } from '@/app/builder/flow-canvas';
import { CanvasControls } from '@/app/builder/flow-canvas/canvas-controls';
import { BuilderStateProvider } from '@/app/builder/state/builder-state-provider';
import { TagWithBright } from '@/components/custom/tag-with-bright';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSidebar } from '@/components/ui/sidebar-shadcn';
import { UseTemplateDialog } from '@/features/templates/components/use-template-dialog';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/format-utils';
import { FROM_QUERY_PARAM } from '@/lib/navigation-utils';

import { ReactFlowProvider } from '../../../builder/flow-canvas/solid-flow-adapter';

import { FlowCard } from './flow-card';
import { PieceCard } from './piece-card';

type TemplateDetailsPageProps = {
  template: Template;
};

const TemplateDetailsPage = (props: TemplateDetailsPageProps) => {
  const token = authenticationSession.getToken();
  const location = useLocation();
  const navigate = useNavigate();
  const [hasCanvasBeenInitialised, setHasCanvasBeenInitialised] =
    createSignal(false);
  let canvasContainerRef: HTMLDivElement | undefined;
  const [isDialogOpen, setIsDialogOpen] = createSignal(false);
  const [selectedFlowIndex, setSelectedFlowIndex] = createSignal(0);
  const [renderKey, setRenderKey] = createSignal(0);
  const { setOpen } = useSidebar();
  let hasClosedSidebar = false;
  const isNotAuthenticated = isNil(token);

  const mockFlow = createMemo<PopulatedFlow | null>(() => {
    if (
      !props.template ||
      !props.template.flows ||
      props.template.flows.length === 0
    ) {
      return null;
    }

    const selectedFlow = props.template.flows[selectedFlowIndex()];
    if (!selectedFlow) {
      return null;
    }

    const flowId = apId();
    return {
      id: flowId,
      projectId: apId(),
      externalId: apId(),
      folderId: null,
      status: FlowStatus.DISABLED,
      publishedVersionId: null,
      metadata: null,
      operationStatus: FlowOperationStatus.NONE,
      created: props.template.created,
      updated: props.template.updated,
      version: {
        ...selectedFlow,
        id: apId(),
        flowId: flowId,
        created: props.template.created,
        updated: props.template.updated,
        state: FlowVersionState.LOCKED,
        updatedBy: null,
        agentIds: [],
        connectionIds: [],
        notes: selectedFlow.notes || [],
      },
    };
  });

  createEffect(() => {
    if (!hasClosedSidebar) {
      setOpen(false);
      hasClosedSidebar = true;
    }
  });

  createEffect(() => {
    setHasCanvasBeenInitialised(false);
    const timer = setTimeout(() => {
      setRenderKey((prev) => prev + 1);
    }, 50);
    return () => clearTimeout(timer);
  });

  const handleUseTemplate = () => {
    if (isNil(token)) {
      navigate(
        `/sign-in?${FROM_QUERY_PARAM}=${location.pathname}${location.search}`,
      );
      return;
    }
    setIsDialogOpen(true);
  };

  const handleUseWithGuide = () => {
    if (props.template.blogUrl) {
      const url =
        props.template.blogUrl.startsWith('http://') ||
        props.template.blogUrl.startsWith('https://')
          ? props.template.blogUrl
          : `https://${props.template.blogUrl}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/templates/${props.template.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('Link copied to clipboard!'));
    } catch (error) {
      toast.error(t('Failed to copy link'));
    }
  };

  return (
    <div class="h-screen w-full flex flex-col overflow-hidden absolute inset-0">
      <Show when={props.template.type !== TemplateType.SHARED}>
        <div class="border-b py-4 px-6 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/templates')}
              class="flex items-center gap-2"
            >
              <ArrowLeft class="w-4 h-4" />
              <span class="text-sm font-medium whitespace-nowrap">
                {t('All Templates')}
              </span>
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleShare()}
          >
            <Link class="w-4 h-4" />
            {t('Share')}
          </Button>
        </div>
      </Show>
      <div class="flex-1 min-h-0 min-w-0 overflow-hidden">
        <div class="grid grid-cols-1 lg:grid-cols-[2fr_3fr] h-full w-full overflow-hidden">
          <ScrollArea class="h-full w-full">
            <div class="flex flex-col gap-4 px-6 mt-6 min-w-0">
              <span class="text-xl font-medium">{props.template.name}</span>

              <Show
                when={
                  !isNil(props.template.tags) && props.template.tags.length > 0
                }
              >
                <div class="flex gap-2 flex-wrap min-w-0">
                  <For each={props.template.tags}>
                    {(tag, index) => (
                      <TagWithBright
                        index={index}
                        key={index}
                        prefix={t('Save')}
                        title={tag.title}
                        color={tag.color}
                        size="sm"
                      />
                    )}
                  </For>
                </div>
              </Show>

              <div class="flex flex-col gap-8 min-w-0">
                <div class="flex flex-row justify-center gap-3 min-w-0">
                  <Button onClick={handleUseTemplate} size="xl" class="flex-1">
                    {t('Use Template')}
                    <ArrowRight class="w-4 h-4 ml-2" />
                  </Button>
                  <Show when={props.template.type !== TemplateType.SHARED}>
                    <Button
                      variant="outline"
                      onClick={handleUseWithGuide}
                      size="xl"
                      class="flex-1"
                    >
                      {t('Setup guide')}
                      <ExternalLink class="w-4 h-4 ml-2" />
                    </Button>
                  </Show>
                </div>

                <div class="flex flex-col gap-2">
                  <span class="text-sm font-medium">
                    {t('About this template')}
                  </span>
                  <p class="text-sm text-muted-foreground leading-relaxed">
                    {props.template.description}
                  </p>
                </div>

                <Show when={props.template.flows}>
                  <div class="flex flex-col gap-2">
                    <span class="text-sm font-medium">
                      {t("What's included?")}
                    </span>

                    <div class="grid grid-cols-1 gap-3">
                      <For each={props.template.flows}>
                        {(flow, index) => (
                          <FlowCard
                            key={index}
                            flow={flow}
                            isSelected={selectedFlowIndex() === index()}
                            singleFlow={
                              !(
                                props.template &&
                                props.template.flows &&
                                props.template.flows.length > 1
                              )
                            }
                            onClick={() => setSelectedFlowIndex(index())}
                          />
                        )}
                      </For>
                    </div>
                  </div>
                </Show>

                <div class="flex flex-col gap-2">
                  <span class="text-sm font-medium">{t('Used Pieces')}</span>
                  <div class="flex flex-wrap gap-2">
                    <For each={props.template.pieces}>
                      {(pieceName: string, index: number) => (
                        <PieceCard key={index} pieceName={pieceName} />
                      )}
                    </For>
                  </div>
                </div>

                <div class="flex items-center gap-1 text-xs">
                  <span>{t('By')}</span>
                  <span class="font-medium">{props.template.author}</span>
                  <span>•</span>
                  <span>
                    {formatUtils.formatDate(new Date(props.template.created))}
                  </span>
                </div>

                <div class="mb-12" />
              </div>
            </div>
          </ScrollArea>

          <div
            ref={(el) => (canvasContainerRef = el)}
            class="bg-muted/30 h-full w-full relative overflow-hidden border-l"
          >
            <Show
              when={mockFlow() && renderKey() > 0}
              fallback={
                <Show
                  when={mockFlow()}
                  fallback={
                    <div class="text-muted-foreground text-sm flex items-center justify-center h-full">
                      {t('No flow preview available')}
                    </div>
                  }
                >
                  <div class="text-muted-foreground text-sm flex items-center justify-center h-full" />
                </Show>
              }
            >
              <div class="h-full w-full">
                <ReactFlowProvider>
                  <BuilderStateProvider
                    flow={mockFlow()!}
                    flowVersion={mockFlow()!.version}
                    readonly={true}
                    hideTestWidget={true}
                    run={null}
                    outputSampleData={{}}
                    inputSampleData={{}}
                  >
                    <FlowCanvas
                      setHasCanvasBeenInitialised={setHasCanvasBeenInitialised}
                    />
                    <Show
                      when={canvasContainerRef && hasCanvasBeenInitialised()}
                    >
                      <CanvasControls
                        canvasHeight={canvasContainerRef.clientHeight}
                        canvasWidth={canvasContainerRef.clientWidth}
                        hasCanvasBeenInitialised={hasCanvasBeenInitialised}
                        selectedStep={null}
                      />
                    </Show>
                  </BuilderStateProvider>
                </ReactFlowProvider>
              </div>
            </Show>
          </div>
        </div>
      </div>
      <Show when={!isNotAuthenticated}>
        <UseTemplateDialog
          template={props.template}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      </Show>
    </div>
  );
};

export { TemplateDetailsPage };
