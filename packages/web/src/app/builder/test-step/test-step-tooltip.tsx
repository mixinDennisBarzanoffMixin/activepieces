import { t } from 'i18next';
import { Show, useContext } from 'solid-js';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { DynamicPropertiesContext } from '../piece-properties/dynamic-properties-context';

type TestButtonTooltipProps = {
  children: any;
  invalid: boolean;
  saving: boolean;
};

const TestButtonTooltip = ({
  children,
  invalid,
  saving,
}: TestButtonTooltipProps) => {
  const { isLoadingDynamicProperties } = useContext(DynamicPropertiesContext);
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild class="disabled:pointer-events-auto">
          {children}
        </TooltipTrigger>
        <Show when={(invalid || isLoadingDynamicProperties || saving)()}>
          <TooltipContent side="bottom">
            <Show
              when={invalid()}
              fallback={
                isLoadingDynamicProperties
                  ? t('Please wait until all inputs are loaded')
                  : t('Saving...')
              }
            >
              {t('Fill in the required fields first')}
            </Show>
          </TooltipContent>
        </Show>
      </Tooltip>
    </TooltipProvider>
  );
};

TestButtonTooltip.displayName = 'TestButtonTooltip';
export { TestButtonTooltip };
