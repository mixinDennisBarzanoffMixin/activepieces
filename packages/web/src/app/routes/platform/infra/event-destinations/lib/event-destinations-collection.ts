import {
  ApplicationEvent,
  ApplicationEventName,
  buildMockEvent,
  CreatePlatformEventDestinationRequestBody,
  EventDestination,
  FlowOperationType,
  PopulatedFlow,
  ProjectType,
  SampleDataFileType,
  SeekPage,
  Template,
  TestPlatformEventDestinationRequestBody,
  UpdatePlatformEventDestinationRequestBody,
} from '@activepieces/shared';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { t } from 'i18next';

import { queryClient } from '@/app/query-client';
import { flowHooks, flowsApi, triggerEventsApi } from '@/features/flows';
import { projectCollectionUtils } from '@/features/projects';
import { userHooks } from '@/hooks/user-hooks';
import { api } from '@/lib/api';

export const eventDestinationsCollectionUtils = {
  useAll: (enabled: boolean) => {
    return createQuery(
      () => ({
        queryKey: ['event-destinations'],
        queryFn: async () => {
          const response = await api.get<SeekPage<EventDestination>>(
            '/v1/event-destinations',
          );
          return response.data;
        },
        enabled,
        staleTime: 60_000,
        initialData: [] as EventDestination[],
      }),
      () => queryClient,
    );
  },

  useCreateEventDestination: (
    onSuccess: (destination: EventDestination) => void,
    onError: (error: Error) => void,
  ) => {
    return createMutation(
      () => ({
        mutationFn: (request: CreatePlatformEventDestinationRequestBody) =>
          api.post<EventDestination>('/v1/event-destinations', request),
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: ['event-destinations'] });
          onSuccess(data);
        },
        onError: (error) => {
          onError(error);
        },
      }),
      () => queryClient,
    );
  },

  update: (
    destinationId: string,
    request: UpdatePlatformEventDestinationRequestBody,
  ) => {
    queryClient.setQueryData<EventDestination[]>(
      ['event-destinations'],
      (destinations) =>
        destinations?.map((destination) =>
          destination.id === destinationId
            ? { ...destination, ...request }
            : destination,
        ),
    );
    return api.patch<EventDestination>(
      `/v1/event-destinations/${destinationId}`,
      request,
    );
  },

  delete: (destinationIds: string[]) => {
    queryClient.setQueryData<EventDestination[]>(
      ['event-destinations'],
      (destinations) =>
        destinations?.filter(
          (destination) => !destinationIds.includes(destination.id),
        ),
    );
    return Promise.all(
      destinationIds.map((destinationId) =>
        api.delete<void>(`/v1/event-destinations/${destinationId}`),
      ),
    );
  },

  useTestEventDestination: () => {
    return createMutation(
      () => ({
        mutationFn: (request: TestPlatformEventDestinationRequestBody) =>
          api.post<void>(`/v1/event-destinations/test`, request),
      }),
      () => queryClient,
    );
  },

  useImportHandlerFlow: (
    onSuccess: (flow: PopulatedFlow) => void,
    onError: (error: Error) => void,
  ) => {
    const { data: currentUser } = userHooks.useCurrentUser();
    const { data: allProjects = [] } = projectCollectionUtils.useAll();

    return createMutation<PopulatedFlow, Error, ImportHandlerFlowParams>(
      () => ({
        mutationFn: async ({ template, selectedEvents }) => {
          const personalProject = allProjects.find(
            (project) =>
              project.type === ProjectType.PERSONAL &&
              project.ownerId === currentUser?.id,
          );
          if (!personalProject) {
            throw new Error(
              t('You need a personal project to generate the handler flow.'),
            );
          }

          projectCollectionUtils.setCurrentProject(personalProject.id);
          const flows = await flowHooks.importFlowsFromTemplates({
            templates: [template],
            projectId: personalProject.id,
          });
          const createdFlow = flows[0];
          if (!createdFlow) {
            throw new Error(t('Flow import returned no flow.'));
          }

          const triggerStepName = createdFlow.version.trigger.name;
          const triggerPayloads = selectedEvents.map((eventName) =>
            buildWebhookTriggerPayload(
              buildMockEvent({
                event: eventName,
                platformId: personalProject.platformId,
                projectId: personalProject.id,
              }),
            ),
          );

          for (const triggerPayload of triggerPayloads) {
            await triggerEventsApi.saveTriggerMockdata({
              projectId: personalProject.id,
              flowId: createdFlow.id,
              mockData: triggerPayload,
            });
          }
          await flowsApi.update(createdFlow.id, {
            type: FlowOperationType.SAVE_SAMPLE_DATA,
            request: {
              stepName: triggerStepName,
              payload: triggerPayloads[0],
              type: SampleDataFileType.OUTPUT,
            },
          });

          return createdFlow;
        },
        onSuccess,
        onError,
      }),
      () => queryClient,
    );
  },
};

function buildWebhookTriggerPayload(
  event: ApplicationEvent,
): WebhookTriggerPayload {
  return {
    body: event,
    headers: {},
    queryParams: {},
  };
}

export type ImportHandlerFlowParams = {
  template: Template;
  selectedEvents: ApplicationEventName[];
};

type WebhookTriggerPayload = {
  body: ApplicationEvent;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
};
