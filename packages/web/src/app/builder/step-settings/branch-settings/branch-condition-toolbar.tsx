import { t } from 'i18next';
import { Show } from 'solid-js';

import { Button } from '@/components/ui/button';

type BranchConditionToolbarProps = {
  onAnd: () => void;
  onOr: () => void;
  showOr: boolean;
  showAnd: boolean;
  readonly: boolean;
};

const BranchConditionToolbar = (props: BranchConditionToolbarProps) => {
  return (
    <div class="flex gap-2 text-center justify-end">
      <Show when={props.showAnd}>
        <Button
          variant="basic"
          size="sm"
          onClick={props.onAnd}
          disabled={props.readonly}
        >
          {t('+ And')}
        </Button>
      </Show>

      <Show when={props.showOr}>
        <Button
          variant="basic"
          size="sm"
          onClick={props.onOr}
          disabled={props.readonly}
        >
          {t('+ Or')}
        </Button>
      </Show>
    </div>
  );
};

export { BranchConditionToolbar };
