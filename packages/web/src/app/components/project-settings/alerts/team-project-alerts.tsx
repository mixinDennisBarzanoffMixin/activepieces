import { Permission } from '@activepieces/shared';
import { t } from 'i18next';
import { Bell, Trash } from 'lucide-solid';
import { Show, For } from 'solid-js';

import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/custom/item';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { alertMutations, alertQueries } from '@/features/alerts';
import { useAuthorization } from '@/hooks/authorization-hooks';

import { AddAlertEmailForm } from './add-alert-email-form';

export const TeamProjectAlerts = () => {
  const { checkAccess } = useAuthorization();
  const {
    data: alertsData,
    isLoading: alertsLoading,
    isError: alertsError,
  } = alertQueries.useAlertsEmailList();
  const { mutate: deleteAlert } = alertMutations.useDeleteAlert();

  const writeAlertPermission =
    checkAccess(Permission.WRITE_ALERT) &&
    checkAccess(Permission.WRITE_PROJECT);

  return (
    <>
      <Alert variant="default">
        <Bell class="inline w-4 h-4 text-amber-900" />
        <div className="flex flex-col gap-1">
          <AlertTitle>{t('Frequency')}</AlertTitle>
          <AlertDescription class="text-sm">
            {t(
              'You’ll get an email if any flow fails. Only the first failure per flow each day sends an alert. Other failures are summarized in a daily email.',
            )}
          </AlertDescription>
        </div>
      </Alert>
      <div>
        {
          <Show when={alertsLoading}>
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner class="w-6 h-6" />
            </div>
          </Show>
        }
        {
          <Show when={alertsError}>
            <div className="text-center text-destructive py-8 text-sm">
              {t('Error, please try again.')}
            </div>
          </Show>
        }
        {
          <Show when={alertsData && alertsData.length === 0}>
            <div className="text-center text-muted-foreground py-8 text-sm">
              {t('No emails added yet.')}
            </div>
          </Show>
        }
        {
          <Show when={Array.isArray(alertsData) && alertsData.length > 0}>
            <ItemGroup class="gap-2">
              {
                <For each={alertsData}>
                  {(alert) => (
                    <Item variant="outline" size="sm">
                      <ItemMedia variant="icon">
                        <Bell />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>{alert.receiver}</ItemTitle>
                      </ItemContent>
                      <ItemActions>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              class="size-8 p-0 hover:bg-destructive-50"
                              onClick={() => deleteAlert(alert)}
                              disabled={writeAlertPermission === false}
                            >
                              <Trash class="size-4 text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          {
                            <Show when={writeAlertPermission === false}>
                              <TooltipContent side="bottom">
                                {t('Only project admins can do this')}
                              </TooltipContent>
                            </Show>
                          }
                        </Tooltip>
                      </ItemActions>
                    </Item>
                  )}
                </For>
              }
            </ItemGroup>
          </Show>
        }
      </div>
      <AddAlertEmailForm />
    </>
  );
};
