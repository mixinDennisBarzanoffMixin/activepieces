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

const TestButtonTooltip = (props: TestButtonTooltipProps) => {
  const { isLoadingDynamicProperties } = useContext(DynamicPropertiesContext);
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild class="disabled:pointer-events-auto">
          {props.children}
        </TooltipTrigger>
        <Show
          when={props.invalid || isLoadingDynamicProperties || props.saving}
        >
          <TooltipContent side="bottom">
            <Show
              when={props.invalid}
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

export { TestButtonTooltip };
