import type { Component } from 'solid-js';

import { AuthFormTemplate } from '@/features/authentication';

const SignInPage: Component = () => {
  return <AuthFormTemplate form={'signin'} />;
};

export { SignInPage };
