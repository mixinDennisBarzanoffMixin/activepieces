import {
  ApErrorParams,
  ErrorCode,
  isNil,
  PopulatedFlow,
  Template,
} from '@activepieces/shared';
import { useLocation, useNavigate } from '@solidjs/router';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { Show } from 'solid-js';
import { toast } from 'solid-sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { internalErrorToast } from '@/components/ui/sonner';
import { flowHooks } from '@/features/flows/hooks/flow-hooks';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { FROM_QUERY_PARAM } from '@/lib/navigation-utils';

import { PieceIconList } from '../../pieces/components/piece-icon-list';

const TemplateViewer = (props: { template: Template }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = authenticationSession.getToken();

  const { mutate, isPending } = createMutation(() => ({
    mutationFn: async (): Promise<PopulatedFlow | undefined> => {
      const flows = await flowHooks.importFlowsFromTemplates({
        templates: [props.template],
        projectId: authenticationSession.getProjectId()!,
      });
      return flows[0];
    },
    onSuccess: (data: PopulatedFlow | undefined) => {
      if (!data) {
        internalErrorToast();
        return;
      }
      navigate(`/flows/${data.id}`);
    },
    onError: (error) => {
      if (api.isError(error)) {
        const apError = error.response?.data as ApErrorParams;
        if (apError.code === ErrorCode.PERMISSION_DENIED) {
          toast.error(t('Import Failed'), {
            description: t("You don't have permission to import this template"),
            duration: 3000,
          });
          return;
        }
      }
      internalErrorToast();
    },
  }));

  const handleUseTemplate = () => {
    if (isNil(token)) {
      navigate(
        `/sign-in?${FROM_QUERY_PARAM}=${location.pathname}${location.search}`,
      );
      return;
    }
    mutate();
  };

  return (
    <Card class="min-w-[500px] shadow-lg border-2">
      <>
        <CardHeader class="space-y-3 pb-4">
          <h2 class="text-2xl font-bold tracking-tight">
            {props.template.name}
          </h2>
          <Separator />
        </CardHeader>
        <CardContent class="space-y-6">
          <div class="space-y-4">
            <div class="flex flex-row w-full justify-between items-center py-2">
              <span class="text-sm font-medium text-muted-foreground">
                {t('Steps in this flow')}
              </span>
              <Show when={props.template.flows?.[0]?.trigger}>
                (
                <PieceIconList
                  trigger={props.template.flows[0].trigger}
                  maxNumberOfIconsToShow={5}
                />
                )
              </Show>
            </div>
            <Show when={props.template.description}>
              (
              <>
                <Separator />
                <div class="space-y-2 py-2">
                  <h3 class="text-sm font-semibold">{t('Description')}</h3>
                  <p class="text-sm text-muted-foreground leading-relaxed">
                    {props.template.description}
                  </p>
                </div>
              </>
              )
            </Show>
          </div>
          <div class="flex items-center justify-end pt-2">
            <Button loading={isPending} onClick={handleUseTemplate} size="lg">
              {t('Use Template')}
            </Button>
          </div>
        </CardContent>
      </>
    </Card>
  );
};

const ShareTemplate = (props: { template: Template }) => {
  return (
    <div class="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-background to-muted/20 p-6">
      <div class="w-full max-w-2xl">
        <TemplateViewer template={props.template} />
      </div>
    </div>
  );
};

export { ShareTemplate };
