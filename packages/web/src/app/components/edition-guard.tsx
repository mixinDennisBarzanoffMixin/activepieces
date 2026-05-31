import { ApEdition, ApFlagId } from '@activepieces/shared';

import { flagsHooks } from '@/hooks/flags-hooks';

type EditionGuardProps = {
  children: JSX.Element;
  allowedEditions: ApEdition[];
};

const EditionGuard = ({ children, allowedEditions }: EditionGuardProps) => {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  if (!edition || !allowedEditions.includes(edition)) {
    return null;
  }
  return children;
};
export { EditionGuard };
