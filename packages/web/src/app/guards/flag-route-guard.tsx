import { ApFlagId } from '@activepieces/shared';
import { JSX } from 'solid-js';

import { flagsHooks } from '../../hooks/flags-hooks';

export const FlagRouteGuard = ({
  flag,
  children,
}: {
  flag: ApFlagId;
  children: JSX.Element;
}) => {
  const { data: flagValue } = flagsHooks.useFlag<boolean>(flag);
  if (!flagValue) {
    window.location.replace('/');
    return null;
  }
  return children;
};
