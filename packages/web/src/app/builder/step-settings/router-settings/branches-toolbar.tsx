import { t } from 'i18next';
import { Plus } from 'lucide-solid';

import { Button } from '@/components/ui/button';

type BranchesToolbarProps = {
  addButtonClicked: () => void;
};

const BranchesToolbar = (props: BranchesToolbarProps) => {
  return (
    <div class="flex items-center gap-2 justify-end mb-2">
      <Button
        variant={'basic'}
        class="gap-1 items-center"
        onClick={() => props.addButtonClicked()}
      >
        <Plus class="w-4 h-4" />
        {t('Add Branch')}
      </Button>
    </div>
  );
};

export default BranchesToolbar;
