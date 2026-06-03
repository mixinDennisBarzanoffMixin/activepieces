import type { Component } from 'solid-js';

import { AuthFormTemplate } from '@/features/authentication';

const SignUpPage: Component = () => {
  return <AuthFormTemplate form={'signup'} />;
};

export { SignUpPage };
