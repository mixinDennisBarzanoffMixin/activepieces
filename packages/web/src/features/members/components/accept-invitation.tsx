import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import { createSignal, createEffect } from 'solid-js';

import { LoadingSpinner } from '@/components/custom/spinner';
import { internalErrorToast } from '@/components/ui/sonner';

import { api } from '../../../lib/api';
import { userInvitationMutations } from '../hooks/user-invitations-hooks';

const AcceptInvitation = () => {
  const [isInvitationLinkValid, setIsInvitationLinkValid] = createSignal(true);
  const searchParams = new URLSearchParams(window.location.search);
  const { mutate, isPending } = userInvitationMutations.useAcceptInvitation({
    onSuccess: (registered) => {
      setIsInvitationLinkValid(true);
      if (!registered) {
        setTimeout(() => {
          const email = searchParams.get('email');
          window.location.assign(`/sign-up?email=${email || ''}`);
        }, 3000);
      } else {
        window.location.assign('/sign-in');
      }
    },
    onError: (error) => {
      setIsInvitationLinkValid(false);
      if (api.isError(error)) {
        switch (error.response?.status) {
          case HttpStatusCode.InternalServerError: {
            console.log(error);
            internalErrorToast();
            break;
          }
          default: {
            break;
          }
        }
      }
    },
  });
  createEffect(() => {
    const invitationToken = searchParams.get('token');
    if (!invitationToken) {
      setIsInvitationLinkValid(false);
      return;
    }
    mutate(invitationToken);
  });

  return isPending ? (
    <div className="w-screen h-screen flex justify-center items-center">
      <LoadingSpinner isLarge={true}></LoadingSpinner>
    </div>
  ) : (
    <div className="container mx-auto mt-10 max-w-md">
      {isInvitationLinkValid ? (
        <>
          <p className="text-2xl font-bold text-center">
            {t('Team Invitation Accepted')}
          </p>
          <p className="mt-4 text-lg text-center text-gray-700">
            {t(
              'Thank you for accepting the invitation. We are redirecting you right now...',
            )}
          </p>
        </>
      ) : (
        <p className="mt-4 text-lg text-center text-destructive">
          {t('Invalid invitation token. Please try again.')}
        </p>
      )}
    </div>
  );
};
AcceptInvitation.displayName = 'AcceptInvitation';
export { AcceptInvitation };
