import { PageHeader } from '@/components/custom/page-header';

export const DashboardPageHeader = ({
  title,
  children,
  description,
}: {
  title: JSX.Element;
  children?: JSX.Element;
  description?: JSX.Element;
}) => {
  return (
    <PageHeader
      title={title}
      description={description}
      rightContent={children}
      class="min-w-full"
    />
  );
};
