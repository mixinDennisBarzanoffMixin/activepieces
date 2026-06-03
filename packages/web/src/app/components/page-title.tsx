import { createEffect, type JSX } from 'solid-js';

import { flagsHooks } from '@/hooks/flags-hooks';

type PageTitleProps = {
  title: string;
  children: JSX.Element;
};

const PageTitle = (props: PageTitleProps) => {
  const websiteBranding = flagsHooks.useWebsiteBranding();

  createEffect(() => {
    const branding = websiteBranding();
    if (!branding) {
      return;
    }
    document.title = `${props.title} | ${branding.websiteName}`;
  });

  return props.children;
};

export { PageTitle };
