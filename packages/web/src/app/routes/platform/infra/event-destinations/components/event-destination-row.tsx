import { EventDestination } from '@activepieces/shared';
import { t } from 'i18next';
import { ExternalLink, Globe, Workflow } from 'lucide-solid';
import { For, Show } from 'solid-js';

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/custom/item';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatUtils } from '@/lib/format-utils';

import { ParsedDestination } from '../lib/parse-flow-id-from-url';
import { EventLabelsMap } from '../lib/use-event-labels';

import EventDestinationActions from './event-destination-actions';

type EventDestinationRowProps = {
  destination: EventDestination;
  parsed: ParsedDestination;
  flowDisplayName: string | undefined;
  eventLabels: EventLabelsMap;
};

export const EventDestinationRow = ({
  destination,
  parsed,
  flowDisplayName,
  eventLabels,
}: EventDestinationRowProps) => {
  const isInternal = parsed.kind === 'flow';
  const flowId = parsed.kind === 'flow' ? parsed.flowId : undefined;
  const title =
    isInternal && flowDisplayName
      ? flowDisplayName
      : isInternal && flowId
      ? t('Destination (flow {flowId})', { flowId })
      : destination.url;

  return (
    <Item variant="outline">
      <ItemMedia variant="icon">
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="inline-flex">
              <Show when={isInternal} fallback={<Globe />}>
                <Workflow />
              </Show>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {isInternal ? t('Internal Flow') : t('External')}
          </TooltipContent>
        </Tooltip>
      </ItemMedia>
      <ItemContent class="min-w-0">
        <TextWithTooltip tooltipMessage={title}>
          <ItemTitle
            class={isInternal ? 'truncate' : 'truncate font-mono text-xs'}
          >
            {title}
          </ItemTitle>
        </TextWithTooltip>
        <ItemDescription class="text-xs !flex flex-wrap items-center gap-x-1 gap-y-2 overflow-visible [text-wrap:unset] mt-1">
          <span className="text-muted-foreground shrink-0 mr-1.5">
            {t('Events')}
          </span>
          <For each={destination.events}>
            {(event) => (
              <Badge key={event} variant="outline" class="text-xs">
                {eventLabels[event]?.label ?? event}
              </Badge>
            )}
          </For>
        </ItemDescription>
        <p className="text-xs text-muted-foreground mt-2">
          {t('Created')}{' '}
          {formatUtils.formatDateToAgo(new Date(destination.created))}
        </p>
      </ItemContent>
      <ItemActions>
        <Show when={isInternal && flowId}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  window.open(
                    `/flows/${flowId}`,
                    '_blank',
                    'noopener,noreferrer',
                  )
                }
              >
                <ExternalLink class="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('View flow')}</TooltipContent>
          </Tooltip>
        </Show>
        <EventDestinationActions destination={destination} />
      </ItemActions>
    </Item>
  );
};
