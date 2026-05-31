import { TemplateType, isNil } from '@activepieces/shared';
import { useParams } from '@solidjs/router';

import { PageTitle } from '@/app/components/page-title';
import { ProjectDashboardLayout } from '@/app/components/project-layout';
import { TemplateDetailsPage } from '@/app/routes/templates/id';
import { LoadingScreen } from '@/components/custom/loading-screen';
import { ShareTemplate, templatesHooks } from '@/features/templates';
import { authenticationSession } from '@/lib/authentication-session';
import { FROM_QUERY_PARAM } from '@/lib/navigation-utils';

const TemplateDetailsWrapper = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const { data: template, isLoading } = templatesHooks.useTemplate(templateId!);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!template) {
    window.location.replace('/templates');
    return null;
  }

  const token = authenticationSession.getToken();
  const isNotAuthenticated = isNil(token);
  const useProjectLayout = template.type !== TemplateType.SHARED;

  if (isNotAuthenticated && useProjectLayout) {
    if (window.location.pathname === '/sign-in') {
      return null;
    }
    window.location.replace(
      `/sign-in?${FROM_QUERY_PARAM}=${window.location.pathname}${window.location.search}`,
    );
    return null;
  }

  const content = (
    <PageTitle title={template.name}>
      <TemplateDetailsPage template={template} />
    </PageTitle>
  );

  if (useProjectLayout) {
    return <ProjectDashboardLayout>{content}</ProjectDashboardLayout>;
  }

  return <ShareTemplate template={template} />;
};

export { TemplateDetailsWrapper };
