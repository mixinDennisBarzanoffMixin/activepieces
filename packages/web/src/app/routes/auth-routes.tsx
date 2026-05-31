import { PageTitle } from '@/app/components/page-title';
import { VerifyEmail } from '@/features/authentication';
import { AcceptInvitation } from '@/features/members';

import { ChangePasswordPage } from './change-password';
import { CreatePlatformPage } from './create-platform';
import { ResetPasswordPage } from './forget-password';
import { SignInPage } from './sign-in';
import { SignUpPage } from './sign-up';

export const authRoutes = [
  {
    path: '/forget-password',
    component: () => (
      <PageTitle title="Forget Password">
        <ResetPasswordPage />
      </PageTitle>
    ),
  },
  {
    path: '/reset-password',
    component: () => (
      <PageTitle title="Reset Password">
        <ChangePasswordPage />
      </PageTitle>
    ),
  },
  {
    path: '/sign-in',
    component: () => (
      <PageTitle title="Sign In">
        <SignInPage />
      </PageTitle>
    ),
  },
  {
    path: '/verify-email',
    component: () => (
      <PageTitle title="Verify Email">
        <VerifyEmail />
      </PageTitle>
    ),
  },
  {
    path: '/sign-up',
    component: () => (
      <PageTitle title="Sign Up">
        <SignUpPage />
      </PageTitle>
    ),
  },
  {
    path: '/create-platform',
    component: () => (
      <PageTitle title="Create Platform">
        <CreatePlatformPage />
      </PageTitle>
    ),
  },
  {
    path: '/invitation',
    component: () => (
      <PageTitle title="Accept Invitation">
        <AcceptInvitation />
      </PageTitle>
    ),
  },
];
