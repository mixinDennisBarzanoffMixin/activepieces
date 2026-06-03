import { flowStructureUtil, isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronLeft, ChevronRight } from 'lucide-solid';
import { Show, createMemo } from 'solid-js';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const StepNavigationButtons = () => {
  const [selectedStep, flowVersion, selectStepByName] = useBuilderStateContext(
    (state) => [state.selectedStep, state.flowVersion, state.selectStepByName],
  );

  const orderedSteps = createMemo(() =>
    flowStructureUtil.getAllSteps(flowVersion.trigger),
  );

  const currentIndex = createMemo(() => {
    if (isNil(selectedStep)) return -1;
    return orderedSteps().findIndex((step) => step.name === selectedStep);
  });

  const prevStep = createMemo(() =>
    currentIndex() > 0 ? orderedSteps()[currentIndex() - 1] : null,
  );
  const nextStep = createMemo(() =>
    currentIndex() < orderedSteps().length - 1
      ? orderedSteps()[currentIndex() + 1]
      : null,
  );

  const prevDisabled = createMemo(
    () => isNil(prevStep()) || isEmptyStep(prevStep().type),
  );
  const nextDisabled = createMemo(
    () => isNil(nextStep()) || isEmptyStep(nextStep().type),
  );

  return (
    <Show when={currentIndex() !== -1}>
      <TooltipProvider>
        <div class="flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={prevDisabled()}
                onClick={() =>
                  !prevDisabled() &&
                  prevStep() &&
                  selectStepByName(prevStep().name)
                }
                aria-label={t('Previous step')}
              >
                <ChevronLeft class="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('Previous step')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={nextDisabled()}
                onClick={() =>
                  !nextDisabled() &&
                  nextStep() &&
                  selectStepByName(nextStep().name)
                }
                aria-label={t('Next step')}
              >
                <ChevronRight class="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('Next step')}</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </Show>
  );
};

const isEmptyStep = (type: string) => type === 'EMPTY';

export { StepNavigationButtons };
