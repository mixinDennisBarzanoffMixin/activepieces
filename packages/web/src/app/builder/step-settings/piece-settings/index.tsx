import { PiecePropertyMap } from '@activepieces/pieces-framework';
import {
  ApFlagId,
  isNil,
  PieceAction,
  PieceActionSettings,
  PieceTrigger,
  PieceTriggerSettings,
} from '@activepieces/shared';
import { createMemo, For, Show } from 'solid-js';

import { Skeleton } from '@/components/ui/skeleton';
import { flagsHooks } from '@/hooks/flags-hooks';

import { GenericPropertiesForm } from '../../piece-properties/generic-properties-form';
import { useStepSettingsContext } from '../step-settings-context';

import { ConnectionSelect } from './connection-select';

type PieceSettingsProps = {
  step: PieceAction | PieceTrigger;
  flowId: string;
  readonly: boolean;
};

const removeAuthFromProps = (map: PiecePropertyMap): PiecePropertyMap => {
  const { auth: _, ...rest } = map;
  return rest;
};

const PieceSettings = (props: PieceSettingsProps) => {
  const { pieceModel, updateFormSchema, updatePropertySettingsSchema } =
    useStepSettingsContext();

  const actionName = createMemo(
    () => (props.step.settings as PieceActionSettings).actionName,
  );
  const selectedAction = createMemo(() => {
    const name = actionName();
    return name ? pieceModel?.actions[name] : undefined;
  });
  const triggerName = createMemo(
    () => (props.step.settings as PieceTriggerSettings).triggerName,
  );
  const selectedTrigger = createMemo(() => {
    const name = triggerName();
    return name ? pieceModel?.triggers[name] : undefined;
  });

  const actionPropsWithoutAuth = createMemo(() =>
    removeAuthFromProps(selectedAction()?.props ?? {}),
  );
  const triggerPropsWithoutAuth = createMemo(() =>
    removeAuthFromProps(selectedTrigger()?.props ?? {}),
  );

  const { data: webhookPrefixUrl } = flagsHooks.useFlag<string>(
    ApFlagId.WEBHOOK_URL_PREFIX,
  );

  const { data: pausedFlowTimeoutDays } = flagsHooks.useFlag<number>(
    ApFlagId.PAUSED_FLOW_TIMEOUT_DAYS,
  );

  const { data: webhookTimeoutSeconds } = flagsHooks.useFlag<number>(
    ApFlagId.WEBHOOK_TIMEOUT_SECONDS,
  );

  const { data: frontendUrl } = flagsHooks.useFlag<string>(ApFlagId.PUBLIC_URL);
  const markdownVariables = createMemo(() => ({
    webhookUrl: `${webhookPrefixUrl}/${props.flowId}`,
    formUrl: `${frontendUrl}forms/${props.flowId}`,
    chatUrl: `${frontendUrl}chats/${props.flowId}`,
    pausedFlowTimeoutDays: pausedFlowTimeoutDays?.toString() ?? '',
    webhookTimeoutSeconds: webhookTimeoutSeconds?.toString() ?? '',
  }));

  const showAuthForAction = createMemo(
    () => !isNil(selectedAction()) && (selectedAction()?.requireAuth ?? true),
  );
  const showAuthForTrigger = createMemo(
    () => !isNil(selectedTrigger()) && (selectedTrigger()?.requireAuth ?? true),
  );
  return (
    <div class="flex flex-col gap-4 w-full">
      <Show when={!pieceModel}>
        <div class="space-y-3">
          <For each={Array.from({ length: 5 })}>
            {() => (
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <Skeleton class="w-40 h-4" />
                  <Skeleton class="size-8" />
                </div>
                <Skeleton class="w-full h-12" />
              </div>
            )}
          </For>
        </div>
      </Show>

      <Show when={pieceModel}>
        {(piece) => (
          <>
            <Show
              when={
                piece().auth && (showAuthForAction() || showAuthForTrigger())
              }
            >
              <ConnectionSelect
                isTrigger={!isNil(selectedTrigger())}
                piece={piece()}
                disabled={props.readonly}
              />
            </Show>
            <Show when={selectedAction()}>
              {(action) => (
                <GenericPropertiesForm
                  key={action().name}
                  prefixValue={'settings.input'}
                  props={actionPropsWithoutAuth()}
                  propertySettings={props.step.settings.propertySettings}
                  disabled={props.readonly}
                  useMentionTextInput={true}
                  markdownVariables={markdownVariables()}
                  dynamicPropsInfo={{
                    pieceName: piece().name,
                    pieceVersion: piece().version,
                    actionOrTriggerName: action().name,
                    placedInside: 'stepSettings',
                    updateFormSchema,
                    updatePropertySettingsSchema,
                  }}
                />
              )}
            </Show>
            <Show when={selectedTrigger()}>
              {(trigger) => (
                <GenericPropertiesForm
                  dynamicPropsInfo={{
                    pieceName: piece().name,
                    pieceVersion: piece().version,
                    actionOrTriggerName: trigger().name,
                    placedInside: 'stepSettings',
                    updateFormSchema,
                    updatePropertySettingsSchema,
                  }}
                  key={trigger().name}
                  prefixValue={'settings.input'}
                  props={triggerPropsWithoutAuth()}
                  useMentionTextInput={false}
                  propertySettings={props.step.settings.propertySettings}
                  disabled={props.readonly}
                  markdownVariables={markdownVariables()}
                />
              )}
            </Show>
          </>
        )}
      </Show>
    </div>
  );
};

export { PieceSettings };
