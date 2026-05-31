import { AuthFormTemplate } from '@/features/authentication';

const SignUpPage: any = () => {
  return <AuthFormTemplate form={'signup'} />;
};

SignUpPage.displayName = 'SignUpPage';

export { SignUpPage };
