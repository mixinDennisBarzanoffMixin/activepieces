import { ApFlagId } from '@activepieces/shared';
import type { JSX } from 'solid-js';

import { flagsHooks } from '@/hooks/flags-hooks';

type FlagGuardProps = {
  children: JSX.Element;
  flag: ApFlagId;
};
const FlagGuard = (props: FlagGuardProps) => {
  const { data: flagValue } = flagsHooks.useFlag<boolean>(props.flag);
  if (!flagValue) {
    return null;
  }
  return props.children;
};
export { FlagGuard };
