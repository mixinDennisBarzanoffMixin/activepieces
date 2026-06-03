import { t } from 'i18next';
import { Show } from 'solid-js';

import { flagsHooks } from '@/hooks/flags-hooks';

const FullLogo = () => {
  const branding = flagsHooks.useWebsiteBranding();

  return (
    <Show when={branding()}>
      <div class="h-[60px]">
        <img
          class="h-full"
          src={branding()?.logos.fullLogoUrl}
          alt={t('logo')}
        />
      </div>
    </Show>
  );
};
export { FullLogo };
