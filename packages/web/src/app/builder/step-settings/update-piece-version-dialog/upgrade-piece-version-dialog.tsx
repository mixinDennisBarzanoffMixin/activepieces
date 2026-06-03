import { PieceAction, PieceTrigger } from '@activepieces/shared';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { Show, createSignal } from 'solid-js';

import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';

import { useBuilderStateContext } from '../../builder-hooks';

import {
  changeVersionUtils,
  LatestVersionAvailableAlert,
} from './update-piece-version-utils';

export const UpgradePieceVersionContent = (
  props: UpgradePieceVersionContentProps,
) => {
  const [serverError, setServerError] = createSignal<string | undefined>(
    undefined,
  );

  const applyOperation = useBuilderStateContext(
    (state) => state.applyOperation,
  );

  const { mutate: applyUpgrade, isPending: isUpgradePending } = createMutation(
    () => ({
      mutationFn: async () => {
        await changeVersionUtils.applyPieceVersionChange({
          step: props.step,
          targetVersion: props.latestVersion,
          currentVersion: props.currentVersion,
          applyOperation,
        });
      },
      onSuccess: () => {
        props.onClose();
      },
      onError: (error) => {
        setServerError(error.message);
      },
    }),
  );

  return (
    <div class="flex flex-col gap-4">
      <LatestVersionAvailableAlert
        isLatestMinorOrMajor={props.isLatestMinorOrMajor}
      />

      <Show when={serverError()}>
        <p class="text-sm font-medium text-destructive">{serverError()}</p>
      </Show>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          class="mr-auto"
          onClick={props.onOpenAdvanced}
        >
          {t('Advanced')}
        </Button>
        <Button type="button" variant="outline" onClick={props.onClose}>
          {t('Cancel')}
        </Button>
        <Button
          type="button"
          loading={isUpgradePending}
          onClick={() => applyUpgrade()}
        >
          <Show
            when={props.isLatestMinorOrMajor}
            fallback={t('Update to v{version}', {
              version: props.latestVersion,
            })}
          >
            {t('Upgrade to v{version}', { version: props.latestVersion })}
          </Show>
        </Button>
      </DialogFooter>
    </div>
  );
};

export type UpgradePieceVersionContentProps = {
  step: PieceAction | PieceTrigger;
  currentVersion: string;
  latestVersion: string;
  isLatestMinorOrMajor: boolean;
  onClose: () => void;
  onOpenAdvanced: () => void;
};
