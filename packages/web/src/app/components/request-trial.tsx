import { t } from 'i18next';
import { mergeProps } from 'solid-js';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { SendIcon } from '@/components/icons/send';
import { flagsHooks } from '@/hooks/flags-hooks';
import { userHooks } from '@/hooks/user-hooks';

export type FeatureKey =
  | 'PROJECTS'
  | 'BRANDING'
  | 'PIECES'
  | 'TEMPLATES'
  | 'TEAM'
  | 'GLOBAL_CONNECTIONS'
  | 'USERS'
  | 'EVENT_DESTINATIONS'
  | 'API'
  | 'SSO'
  | 'AUDIT_LOGS'
  | 'ENVIRONMENT'
  | 'ISSUES'
  | 'ANALYTICS'
  | 'ALERTS'
  | 'ENTERPRISE_PIECES'
  | 'UNIVERSAL_AI'
  | 'SIGNING_KEYS'
  | 'CUSTOM_ROLES'
  | 'AGENTS'
  | 'TABLES'
  | 'TODOS'
  | 'BILLING'
  | 'MCPS'
  | 'SECRET_MANAGERS'
  | 'DEDICATED_WORKERS';

type RequestTrialProps = {
  featureKey: FeatureKey;
  customButton?: JSX.Element;
  buttonVariant?: 'default' | 'basic';
  buttonSize?: 'default' | 'sm' | 'xs';
};

export const RequestTrial = (_props: RequestTrialProps) => {
  const props = mergeProps(
    { buttonVariant: 'default', buttonSize: 'default' },
    _props,
  );
  const { data: currentUser } = userHooks.useCurrentUser();
  const { data: flags } = flagsHooks.useFlags();

  const createQueryParams = () => {
    const params = {
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      email: currentUser?.email || '',
      featureKey: props.featureKey,
      flags: btoa(JSON.stringify(flags)),
    };

    return Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
  };

  const handleClick = () =>
    window.open(
      `https://www.activepieces.com/sales?${createQueryParams()}`,
      '_blank',
      'noopener noreferrer',
    );

  return (
    <AnimatedIconButton
      variant={props.buttonVariant}
      size={props.buttonSize}
      onClick={handleClick}
      icon={SendIcon}
      iconSize={14}
    >
      {t('Contact Sales')}
    </AnimatedIconButton>
  );
};
