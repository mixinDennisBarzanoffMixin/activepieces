import { isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { Match, Show, Switch, useContext } from 'solid-js';

import { Dot } from '@/components/custom/dot';
import { Button } from '@/components/ui/button';

import { DynamicPropertiesContext } from '../../piece-properties/dynamic-properties-context';
import { TestButtonTooltip } from '../test-step-tooltip';

import { TestType } from './trigger-event-utils';

type FirstTimeTestingSectionProps = {
  isValid: boolean;
  testType: TestType;
  isTesting: boolean;
  mockData: unknown;
  isSaving: boolean;
  onSimulateTrigger: () => void;
  onPollTrigger: () => void;
  onMcpToolTesting: () => void;
  onSaveMockAsSampleData: (mockData: unknown) => void;
};

export const FirstTimeTestingSection = (
  props: FirstTimeTestingSectionProps,
) => {
  const { isLoadingDynamicProperties } = useContext(DynamicPropertiesContext);

  return (
    <Switch>
      <Match
        when={
          props.testType === 'simulation' ||
          props.testType === 'webhook' ||
          props.testType === 'chat-trigger'
        }
      >
        <div class="flex justify-center flex-col gap-2 items-center">
          <TestButtonTooltip saving={props.isSaving} invalid={!props.isValid}>
            <Button
              variant="outline"
              size="sm"
              onClick={props.onSimulateTrigger}
              keyboardShortcut="G"
              onKeyboardShortcut={props.onSimulateTrigger}
              disabled={!props.isValid || isLoadingDynamicProperties}
              loading={props.isSaving}
            >
              <Dot animation={true} variant={'primary'} />
              {t('Test Trigger')}
            </Button>
          </TestButtonTooltip>

          <Show
            when={
              !isNil(props.mockData) && JSON.stringify(props.mockData) !== '{}'
            }
          >
            <>
              {t('Or')}
              <Button
                variant="outline"
                size="sm"
                onClick={() => props.onSaveMockAsSampleData(props.mockData)}
                loading={props.isSaving}
              >
                {t('Use Mock Data')}
              </Button>
            </>
          </Show>
        </div>
      </Match>
      <Match when={props.testType === 'mcp-tool'}>
        <div class="flex justify-center">
          <TestButtonTooltip saving={props.isSaving} invalid={!props.isValid}>
            <Button
              variant="outline"
              size="sm"
              onClick={props.onMcpToolTesting}
              keyboardShortcut="G"
              onKeyboardShortcut={props.onMcpToolTesting}
              loading={props.isTesting}
              disabled={!props.isValid || isLoadingDynamicProperties}
            >
              <Dot animation={true} variant={'primary'} />
              {t('Test Tool')}
            </Button>
          </TestButtonTooltip>
        </div>
      </Match>
      <Match when={true}>
        <div class="flex justify-center">
          <TestButtonTooltip saving={props.isSaving} invalid={!props.isValid}>
            <Button
              variant="outline"
              size="sm"
              onClick={props.onPollTrigger}
              keyboardShortcut="G"
              onKeyboardShortcut={props.onPollTrigger}
              loading={props.isTesting}
              disabled={!props.isValid || isLoadingDynamicProperties}
            >
              <Dot animation={true} variant={'primary'} />
              {t('Load Sample Data')}
            </Button>
          </TestButtonTooltip>
        </div>
      </Match>
    </Switch>
  );
};
