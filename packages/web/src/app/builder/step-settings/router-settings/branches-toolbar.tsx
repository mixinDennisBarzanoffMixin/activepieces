import { t } from 'i18next';
import { Plus } from 'lucide-solid';

import { Button } from '@/components/ui/button';

interface BranchesToolbarProps {
  addButtonClicked: () => void;
}

const BranchesToolbar: any = ({ addButtonClicked }) => {
  return (
    <div className="flex items-center gap-2 justify-end mb-2">
      <Button
        variant={'basic'}
        class="gap-1 items-center"
        onClick={addButtonClicked}
      >
        <Plus class="w-4 h-4"></Plus>
        {t('Add Branch')}
      </Button>
    </div>
  );
};

export default BranchesToolbar;
