import { KnowledgeBaseFile } from '@activepieces/shared';
import {
  createMutation,
  createQuery,
  useQueryClient,
} from '@tanstack/solid-query';

import { authenticationSession } from '@/lib/authentication-session';

import { knowledgeBaseApi } from './knowledge-base-api';

export const useKnowledgeBaseFiles = () => {
  const projectId = authenticationSession.getProjectId();
  return createQuery<KnowledgeBaseFile[]>(() => ({
    queryKey: ['knowledge-base-files', projectId],
    queryFn: () => knowledgeBaseApi.list(),
  }));
};

export const useUploadKnowledgeBaseFile = () => {
  const queryClient = useQueryClient();
  const projectId = authenticationSession.getProjectId();
  return createMutation<KnowledgeBaseFile, Error, FormData>(() => ({
    mutationFn: (formData: FormData) => knowledgeBaseApi.upload(formData),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['knowledge-base-files', projectId],
      });
    },
  }));
};

export const useDeleteKnowledgeBaseFile = () => {
  const queryClient = useQueryClient();
  const projectId = authenticationSession.getProjectId();
  return createMutation<void, Error, string>(() => ({
    mutationFn: (fileId: string) => knowledgeBaseApi.delete(fileId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['knowledge-base-files', projectId],
      });
    },
  }));
};
