import { AuthFormTemplate } from '@/features/authentication';

const SignInPage: any = () => {
  return <AuthFormTemplate form={'signin'} />;
};

SignInPage.displayName = 'SignInPage';

export { SignInPage };
