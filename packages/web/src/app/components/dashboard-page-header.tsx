import type { JSXElement } from 'solid-js';

import { PageHeader } from '@/components/custom/page-header';

export const DashboardPageHeader = (props: {
  title: JSXElement;
  children?: JSXElement;
  description?: JSXElement;
}) => {
  return (
    <PageHeader
      title={props.title}
      description={props.description}
      rightContent={props.children}
      class="min-w-full"
    />
  );
};
