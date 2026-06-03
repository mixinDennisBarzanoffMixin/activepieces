import { ApEdition, ApFlagId } from '@activepieces/shared';
import type { JSX } from 'solid-js';

import { flagsHooks } from '@/hooks/flags-hooks';

type EditionGuardProps = {
  children: JSX.Element;
  allowedEditions: ApEdition[];
};

const EditionGuard = (props: EditionGuardProps) => {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  if (!edition || !props.allowedEditions.includes(edition)) {
    return null;
  }
  return props.children;
};
export { EditionGuard };
