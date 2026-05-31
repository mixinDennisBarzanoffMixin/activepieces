import { createEffect } from 'solid-js';

import { flagsHooks } from '@/hooks/flags-hooks';

type PageTitleProps = {
  title: string;
  children: JSX.Element;
};

const PageTitle = ({ title, children }: PageTitleProps) => {
  const websiteBranding = flagsHooks.useWebsiteBranding();

  createEffect(() => {
    const branding = websiteBranding();
    if (!branding) {
      return;
    }
    document.title = `${title} | ${branding.websiteName}`;
  });

  return children;
};

export { PageTitle };
