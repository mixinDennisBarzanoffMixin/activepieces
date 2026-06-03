import {
  ApFlagId,
  ApplicationEventName,
  EventDestination,
  CreatePlatformEventDestinationRequestBody,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, Sparkles } from 'lucide-solid';
import {
  createMemo,
  createSignal,
  createUniqueId,
  For,
  Show,
  untrack,
} from 'solid-js';
import { toast } from 'solid-sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { flagsHooks } from '@/hooks/flags-hooks';

import { eventDestinationsCollectionUtils } from '../lib/event-destinations-collection';
import { handlerFlowBuilder } from '../lib/handler-flow-builder';
import { useEventLabels } from '../lib/use-event-labels';

export const EventDestinationDialog = (props: EventDestinationDialogProps) => {
  const [isOpen, setIsOpen] = createSignal(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{props.children}</DialogTrigger>
      <DialogContent class="max-w-2xl gap-2">
        <EventDestinationForm
          key={isOpen() ? 'open' : 'closed'}
          destination={props.destination}
          onClose={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

const EventDestinationForm = (props: EventDestinationFormProps) => {
  const eventLabels = useEventLabels();
  const { data: webhookPrefixUrl } = flagsHooks.useFlag<string>(
    ApFlagId.WEBHOOK_URL_PREFIX,
  );
  const checkboxIdPrefix = createUniqueId();

  const formSchema = z.object({
    url: z.url(t('Invalid URL')).min(1, t('Webhook URL is required')),
    events: z
      .array(z.enum(ApplicationEventName))
      .min(1, t('Select at least one event')),
  });

  const [url, setUrl] = createSignal(
    untrack(() => props.destination?.url ?? ''),
  );
  const [events, setEvents] = createSignal(
    untrack(() => props.destination?.events ?? []),
  );
  const [errors, setErrors] = createSignal<FormErrors>({});
  const values = createMemo(() => ({ url: url(), events: events() }));

  const { mutate: testDestination, isPending: isTesting } =
    eventDestinationsCollectionUtils.useTestEventDestination();

  const { mutate: createDestination, isPending: isCreating } =
    eventDestinationsCollectionUtils.useCreateEventDestination(
      () => {
        toast.success(t('Success'), {
          description: t('Destination created successfully'),
        });
        props.onClose();
      },
      (error: Error) => {
        toast.error(t('Error'), {
          description: error.message,
        });
      },
    );

  const handleSubmit = async (
    data: CreatePlatformEventDestinationRequestBody,
  ) => {
    if (props.destination) {
      try {
        await eventDestinationsCollectionUtils.update(
          props.destination.id,
          data,
        );
        toast.success(t('Success'), {
          description: t('Destination updated successfully'),
        });
        props.onClose();
      } catch (error) {
        toast.error(t('Error'), {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      return;
    }
    createDestination(data);
  };

  const { mutate: importHandlerFlow, isPending: isImporting } =
    eventDestinationsCollectionUtils.useImportHandlerFlow(
      (createdFlow) => {
        setUrl(`${webhookPrefixUrl}/${createdFlow.id}`);
        setErrors((errors) => ({ ...errors, url: undefined }));
        window.open(
          `/flows/${createdFlow.id}`,
          '_blank',
          'noopener,noreferrer',
        );
      },
      (error) => {
        toast.error(
          error.message ||
            t('Failed to generate the handler flow. Please try again.'),
        );
      },
    );

  const handleImportHandlerFlow = () => {
    const selectedEvents = events();
    if (selectedEvents.length === 0) {
      setErrors((errors) => ({
        ...errors,
        events: t('Select at least one event'),
      }));
      return;
    }
    if (!webhookPrefixUrl) {
      toast.error(t('Webhook URL prefix is not configured.'));
      return;
    }
    const template = handlerFlowBuilder.buildHandlerFlowTemplate({
      events: selectedEvents.map((name) => ({
        name,
        label: eventLabels[name].label,
      })),
      labels: {
        flowDisplayName: t('Event handler starter'),
        flowDescription: t(
          'Routes audit events into branches you can wire to Slack, Gmail, Teams, or any HTTP endpoint.',
        ),
        webhookTriggerDisplayName: t('Catch Webhook'),
        eventTypeRouterDisplayName: t('Event type checker'),
        runStatusRouterDisplayName: t('Run status check'),
        failedRunBranchName: t('Failed run'),
        otherwiseBranchName: t('Otherwise'),
        noteContent: t(
          '**Audit event handler**\n\nThis flow runs whenever any of these events fire:\n\n{events}\n\n**Add your channel** (Slack, Gmail, Teams, HTTP…) inside each branch below.\n\nOnce you are done:\n\n1. **Publish this flow** so it can receive events.\n2. Head back to the **Event Streaming** tab and create the destination to start sending events here.',
          {
            events: selectedEvents
              .map((name) => `- ${eventLabels[name].label}`)
              .join('\n'),
          },
        ),
        sampleDataNoteContent: t(
          '**Test different scenarios**\n\nOpen the trigger and edit its **Sample Data** to swap in a different event payload and test each branch without firing real audit events.',
        ),
      },
    });
    importHandlerFlow({ template, selectedEvents });
  };

  const availableEvents = Object.values(ApplicationEventName);
  const isSubmitDisabled = isCreating || isImporting;
  const isTestingButtonDisabled = createMemo(
    () => isTesting || !url() || !isNil(errors().url) || events().length === 0,
  );

  return (
    <>
      <DialogTitle>
        <Show when={props.destination} fallback={t('New Destination')}>
          {t('Edit Destination')}
        </Show>
      </DialogTitle>
      <DialogDescription>
        <Show
          when={props.destination}
          fallback={t(
            'Send audit events to a webhook. Use an internal flow to route them to your notification channels — Slack, Gmail, Microsoft Teams, or any other channel.',
          )}
        >
          {t('Update the webhook endpoint and event subscriptions.')}
        </Show>
      </DialogDescription>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const result = formSchema.safeParse(values());
          if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors;
            setErrors({
              url: fieldErrors.url?.[0],
              events: fieldErrors.events?.[0],
            });
            return;
          }
          setErrors({});
          void handleSubmit(result.data);
        }}
        class="space-y-4"
      >
        <div>
          <Label class="text-base">
            {t('Events')} <span class="text-destructive">*</span>
          </Label>
          <ScrollArea class="h-48 rounded-md " viewPortClassName="px-0">
            <div class="grid grid-cols-2 gap-2">
              <For each={availableEvents}>
                {(event) => {
                  const checkboxId = `${checkboxIdPrefix}-${event}`;
                  const checked = createMemo(() => events().includes(event));
                  return (
                    <div class="flex flex-row items-center gap-3">
                      <Checkbox
                        id={checkboxId}
                        checked={checked()}
                        onCheckedChange={(checked) => {
                          setEvents((events) =>
                            checked
                              ? [...events, event]
                              : events.filter((value) => value !== event),
                          );
                          setErrors((errors) => ({
                            ...errors,
                            events: undefined,
                          }));
                        }}
                      />
                      <Label
                        for={checkboxId}
                        class="cursor-pointer text-sm font-normal"
                      >
                        {eventLabels[event].label}
                      </Label>
                    </div>
                  );
                }}
              </For>
            </div>
          </ScrollArea>
          <Show when={errors().events}>
            <p class="text-sm font-medium text-destructive wrap-break-word">
              {errors().events}
            </p>
          </Show>
        </div>

        <div>
          <Label for="webhookUrl">
            {t('Webhook URL')} <span class="text-destructive">*</span>
          </Label>
          <Input
            id="webhookUrl"
            placeholder="https://example.com/webhook"
            value={url()}
            onInput={(e) => {
              setUrl(e.currentTarget.value);
              setErrors((errors) => ({ ...errors, url: undefined }));
            }}
          />
          <Show when={errors().url}>
            <p class="text-sm font-medium text-destructive wrap-break-word">
              {errors().url}
            </p>
          </Show>
          <Show when={!props.destination}>
            <div class="flex flex-col gap-1 pt-1">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs text-muted-foreground">
                  {t(
                    'Or generate an internal flow to handle the selected events:',
                  )}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleImportHandlerFlow}
                  disabled={isImporting || isCreating}
                  loading={isImporting}
                >
                  <Sparkles class="size-4" />
                  {t('Generate handler flow')}
                </Button>
              </div>
              <span class="text-xs text-muted-foreground">
                {t(
                  "Don't forget to publish your flow before creating the alert.",
                )}
              </span>
            </div>
          </Show>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={props.onClose}
            disabled={isSubmitDisabled}
          >
            {t('Cancel')}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isTestingButtonDisabled()}
              >
                <Show when={isTesting} fallback={t('Test webhook')}>
                  {t('Testing...')}
                </Show>
                <ChevronDown class="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <For each={events()}>
                {(event) => (
                  <DropdownMenuItem
                    onSelect={() =>
                      testDestination({
                        url: url(),
                        event,
                      })
                    }
                  >
                    {eventLabels[event].label}
                  </DropdownMenuItem>
                )}
              </For>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="submit"
            disabled={isSubmitDisabled}
            loading={isCreating}
          >
            <Show when={props.destination} fallback={t('Create alert')}>
              {t('Save changes')}
            </Show>
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};

type EventDestinationDialogProps = {
  children: JSX.Element;
  destination: EventDestination | null;
};

type EventDestinationFormProps = {
  destination: EventDestination | null;
  onClose: () => void;
};

type FormErrors = {
  url?: string;
  events?: string;
};
