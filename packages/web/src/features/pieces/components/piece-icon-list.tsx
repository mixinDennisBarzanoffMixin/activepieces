import {
  FlowTrigger,
  FlowActionType,
  flowStructureUtil,
  PieceCategory,
} from '@activepieces/shared';
import { cva } from 'class-variance-authority';
import { t } from 'i18next';
import { createMemo, For, mergeProps, Show } from 'solid-js';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import { piecesHooks } from '../hooks/pieces-hooks';
import { StepMetadata } from '../types';
import { extractPieceNamesAndCoreMetadata } from '../utils/step-utils';

import { PieceIcon } from './piece-icon';

const extraIconVariants = cva(
  'flex items-center justify-center rounded-md bg-background border border-solid text-xs select-none',
  {
    variants: {
      size: {
        xxl: 'size-[64px]',
        xl: 'size-[48px]',
        lg: 'size-[40px]',
        md: 'size-[38px]',
        sm: 'size-[25px]',
        xs: 'size-[25px]',
      },
    },
  },
);

export function PieceIconList(_props: {
  trigger: FlowTrigger;
  maxNumberOfIconsToShow: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  className?: string;
  background?: string;
  excludeCore?: boolean;
}) {
  const props = mergeProps({ excludeCore: false }, _props);
  const steps = flowStructureUtil.getAllSteps(props.trigger);

  const metadata = createMemo(() =>
    extractPieceNamesAndCoreMetadata(steps, props.excludeCore),
  );

  const { summaries } = piecesHooks.usePieceSummariesByNames({
    names: metadata().pieceNames,
  });

  const stepsMetadata = createMemo<StepMetadata[]>(() => {
    const pieceMetadata = summaries()
      .filter(
        (piece) =>
          !props.excludeCore || !piece.categories?.includes(PieceCategory.CORE),
      )
      .map((piece) => ({
        displayName: piece.displayName,
        logoUrl: piece.logoUrl,
        description: piece.description,
        type: FlowActionType.PIECE,
        pieceType: piece.pieceType,
        pieceName: piece.name,
        pieceVersion: piece.version,
        categories: piece.categories ?? [],
        packageType: piece.packageType,
        auth: piece.auth,
      }));
    return [...metadata().coreMetadata, ...pieceMetadata];
  });

  const uniqueMetadata: StepMetadata[] = stepsMetadata().filter(
    (item, index, self) =>
      self.findIndex(
        (secondItem) => item.displayName === secondItem.displayName,
      ) === index,
  );
  const visibleMetadata = uniqueMetadata.slice(0, props.maxNumberOfIconsToShow);
  const extraPieces = uniqueMetadata.length - visibleMetadata.length;
  const extraMetadata = uniqueMetadata.slice(props.maxNumberOfIconsToShow);

  return (
    <div class={props.className || 'flex gap-0.5 '}>
      <For each={visibleMetadata}>
        {(metadata) => (
          <PieceIcon
            logoUrl={metadata.logoUrl}
            showTooltip={true}
            size={props.size ?? 'md'}
            border={true}
            displayName={metadata.displayName}
            background={props.background}
          />
        )}
      </For>
      <Show when={extraPieces > 0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div class={extraIconVariants({ size: props.size ?? 'xs' })}>
              +{extraPieces}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {extraMetadata.length > 1 &&
              extraMetadata
                .map((m) => m.displayName || '')
                .slice(0, -1)
                .join(', ') +
                ` ${t('and')} ${
                  extraMetadata[extraMetadata.length - 1].displayName
                }`}
            {extraMetadata.length === 1 && extraMetadata[0].displayName}
          </TooltipContent>
        </Tooltip>
      </Show>
    </div>
  );
}
