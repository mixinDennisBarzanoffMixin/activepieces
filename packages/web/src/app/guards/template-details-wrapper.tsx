import { TemplateType, isNil } from '@activepieces/shared';
import { useParams } from '@solidjs/router';
import { Show, createEffect } from 'solid-js';

import { PageTitle } from '@/app/components/page-title';
import { ProjectDashboardLayout } from '@/app/components/project-layout';
import { TemplateDetailsPage } from '@/app/routes/templates/id';
import { LoadingScreen } from '@/components/custom/loading-screen';
import { ShareTemplate, templatesHooks } from '@/features/templates';
import { authenticationSession } from '@/lib/authentication-session';
import { FROM_QUERY_PARAM } from '@/lib/navigation-utils';

const TemplateDetailsWrapper = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const { data: template, isLoading } = templatesHooks.useTemplate(templateId);

  createEffect(() => {
    if (isLoading) {
      return;
    }
    if (!template) {
      window.location.replace('/templates');
      return;
    }
    if (
      !isNil(authenticationSession.getToken()) ||
      template.type === TemplateType.SHARED
    ) {
      return;
    }
    if (window.location.pathname === '/sign-in') {
      return;
    }
    window.location.replace(
      `/sign-in?${FROM_QUERY_PARAM}=${window.location.pathname}${window.location.search}`,
    );
  });

  return (
    <Show when={!isLoading} fallback={<LoadingScreen />}>
      <Show when={template} keyed>
        {(item) => (
          <Show
            when={
              !isNil(authenticationSession.getToken()) ||
              item.type === TemplateType.SHARED
            }
          >
            <Show
              when={item.type !== TemplateType.SHARED}
              fallback={<ShareTemplate template={item} />}
            >
              <ProjectDashboardLayout>
                <PageTitle title={item.name}>
                  <TemplateDetailsPage template={item} />
                </PageTitle>
              </ProjectDashboardLayout>
            </Show>
          </Show>
        )}
      </Show>
    </Show>
  );
};

export { TemplateDetailsWrapper };
