import { FolderDto, UncategorizedFolderId } from '@activepieces/shared';
import { createMutation, createQuery } from '@tanstack/solid-query';

import { authenticationSession } from '@/lib/authentication-session';

import { foldersApi } from '../api/folders-api';

export const foldersHooks = {
  useFolders: () => {
    const folderQuery = createQuery<FolderDto[]>(() => ({
      queryKey: ['folders', authenticationSession.getProjectId()],
      queryFn: () => foldersApi.list(),
    }));
    return {
      folders: folderQuery.data,
      isLoading: folderQuery.isLoading,
      refetch: folderQuery.refetch,
    };
  },
  useFolder: (folderId: string) => {
    return createQuery(() => ({
      queryKey: ['folder', folderId],
      queryFn: () => foldersApi.get(folderId),
      enabled: folderId !== UncategorizedFolderId,
    }));
  },
};

export const foldersMutations = {
  useRenameFolder: ({
    onSuccess,
    onError,
  }: {
    onSuccess: () => void;
    onError?: (error: unknown) => void;
  }) => {
    return createMutation(() => ({
      mutationFn: async ({
        folderId,
        displayName,
      }: {
        folderId: string;
        displayName: string;
      }) => {
        return await foldersApi.renameFolder(folderId, { displayName });
      },
      onSuccess,
      onError,
    }));
  },
  useCreateFolder: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (folder: FolderDto) => void;
    onError?: (error: unknown) => void;
  }) => {
    return createMutation(() => ({
      mutationFn: (data: { displayName: string }) => {
        return foldersApi.create({
          displayName: data.displayName.trim(),
          projectId: authenticationSession.getProjectId()!,
        });
      },
      onSuccess,
      onError,
    }));
  },
};
