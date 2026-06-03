import { CreateOtpRequestBody, OtpType } from '@activepieces/shared';
import { t } from 'i18next';
import { MailCheck } from 'lucide-solid';
import { toast } from 'solid-sonner';

import { authMutations } from '../hooks/auth-hooks';

const CheckEmailNote = (props: CreateOtpRequestBody) => {
  const { mutate: resendVerification } = authMutations.useSendOtpEmail({
    onSuccess: () => {
      toast.success(
        props.type === OtpType.EMAIL_VERIFICATION
          ? t('Verification email resent, if previous one expired.')
          : t('Password reset link resent, if previous one expired.'),
        {
          duration: 3000,
        },
      );
    },
  });
  return (
    <div class="gap-2 w-full flex flex-col">
      <div class="gap-4 w-full flex flex-row items-center justify-center">
        <MailCheck class="w-16 h-16" />
        <span class="text-left w-fit">
          {props.type === OtpType.EMAIL_VERIFICATION
            ? t('We sent you a link to complete your registration to')
            : t('We sent you a link to reset your password to')}
          <strong>&nbsp;{props.email}</strong>.
        </span>
      </div>
      <div class="flex flex-row gap-1">
        {t("Didn't receive an email or it expired?")}
        <button
          class="cursor-pointer text-primary underline"
          onClick={() =>
            resendVerification({
              email: props.email,
              type: props.type,
            })
          }
        >
          {t('Resend')}
        </button>
      </div>
    </div>
  );
};
export { CheckEmailNote };
