import { EventDestination } from '@activepieces/shared';
import { t } from 'i18next';
import { MoreVertical, Pencil, Trash } from 'lucide-solid';
import { createSignal } from 'solid-js';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { eventDestinationsCollectionUtils } from '../lib/event-destinations-collection';

import { EventDestinationDialog } from './event-destination-dialog';

const preventSelect = (e: Event) => {
  e.preventDefault();
};

const EventDestinationActions = (props: { destination: EventDestination }) => {
  const [dropdownOpen, setDropdownOpen] = createSignal(false);

  return (
    <div class="flex justify-end">
      <DropdownMenu
        modal={true}
        open={dropdownOpen}
        onOpenChange={setDropdownOpen}
      >
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" class="h-8 w-8 p-0">
            <MoreVertical class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <EventDestinationDialog destination={props.destination}>
            <DropdownMenuItem onSelect={preventSelect}>
              <Pencil class="h-4 w-4 mr-2" />
              {t('Edit')}
            </DropdownMenuItem>
          </EventDestinationDialog>

          <ConfirmationDeleteDialog
            title={t('Delete destination')}
            message={t(
              'Deleting this destination will stop all event notifications to its webhook.',
            )}
            entityName={t('destination')}
            buttonText={t('Delete')}
            showToast
            mutationFn={() =>
              eventDestinationsCollectionUtils.delete([props.destination.id])
            }
            isDanger
          >
            <DropdownMenuItem variant="destructive" onSelect={preventSelect}>
              <Trash class="h-4 w-4 mr-2" />
              {t('Delete')}
            </DropdownMenuItem>
          </ConfirmationDeleteDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default EventDestinationActions;
