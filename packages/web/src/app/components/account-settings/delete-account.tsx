import { isCloudPlanButNotEnterprise, isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { Trash } from 'lucide-solid';
import { createSignal, Show } from 'solid-js';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';

export const DeleteAccount = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: user } = userHooks.useCurrentUser();
  const userEmail = user?.email;
  const [email, setEmail] = createSignal('');
  const { mutate: deleteAccount, isPending } = platformHooks.useDeleteAccount();
  const isDeleteButtonDisabled = () => email() !== userEmail;

  return (
    <Show
      when={
        isCloudPlanButNotEnterprise(platform.plan.plan) && !isNil(userEmail)
      }
    >
      <Separator />
      <form
        class="w-full"
        onSubmit={(event) => {
          event.preventDefault();
          if (!isDeleteButtonDisabled()) deleteAccount();
        }}
      >
        <div class="space-y-1">
          <Label class="flex items-center gap-2 mb-2">
            <Trash class="w-4 h-4" /> {t('Delete Your Account')}
          </Label>
          <div class="flex items-center gap-4 w-full">
            <Input
              value={email()}
              onInput={(event) => setEmail(event.currentTarget.value)}
              class="grow"
              placeholder={userEmail}
              autoComplete="off"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    variant="destructive"
                    type="submit"
                    disabled={isDeleteButtonDisabled()}
                    loading={isPending}
                  >
                    {t('Delete')}
                  </Button>
                </div>
              </TooltipTrigger>
              <Show when={isDeleteButtonDisabled()}>
                <TooltipContent>
                  {t('Please enter your email first.')}
                </TooltipContent>
              </Show>
            </Tooltip>
          </div>
          <p class="mt-2 text-sm text-muted-foreground">
            {t(
              'Enter your email to delete your account, including your flows, connections, agents, tables and projects.',
            )}{' '}
            <span class="text-foreground font-semibold">
              {t('This action is irreversible.')}
            </span>
          </p>
        </div>
      </form>
    </Show>
  );
};
