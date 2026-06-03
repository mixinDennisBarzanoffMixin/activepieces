import { Tag } from '@activepieces/shared';
import {
  createMutation,
  createQuery,
  useQueryClient,
} from '@tanstack/solid-query';
import { t } from 'i18next';
import { toast } from 'solid-sonner';

import { piecesTagsApi } from '../api/pieces-tags';

export const piecesTagKeys = {
  all: ['tags'] as const,
};

export const piecesTagQueries = {
  useTags: () =>
    createQuery(() => ({
      queryKey: piecesTagKeys.all,
      queryFn: async () => {
        const response = await piecesTagsApi.list({ limit: 100 });
        return response.data;
      },
    })),
};

export const piecesTagMutations = {
  useDeleteTag: ({ onSuccess }: { onSuccess: () => void }) => {
    const queryClient = useQueryClient();
    return createMutation(() => ({
      mutationFn: (id: string) => piecesTagsApi.delete(id),
      onSuccess: () => {
        toast.success(t('Tag deleted'));
        void queryClient.invalidateQueries({ queryKey: piecesTagKeys.all });
        void queryClient.invalidateQueries({ queryKey: ['pieces'] });
        onSuccess();
      },
    }));
  },
  useApplyTags: ({ onSuccess }: { onSuccess: () => void }) => {
    return createMutation(() => ({
      mutationFn: async ({ piecesName, tags }: ApplyTagsParams) => {
        await piecesTagsApi.tagPieces({ piecesName, tags });
      },
      onSuccess: () => {
        toast(t('Tags applied.'), {});
        onSuccess();
      },
    }));
  },
  useCreateTag: ({
    onTagCreated,
    setIsOpen,
  }: {
    onTagCreated: (tag: Tag) => void;
    setIsOpen: (open: boolean) => void;
  }) => {
    return createMutation(() => ({
      mutationFn: (name: string) => piecesTagsApi.upsert({ name }),
      onSuccess: (data) => {
        toast.success(t('Tag created'), {
          description: t(`Tag "${data.name}" has been created successfully.`),
        });
        onTagCreated(data);
        setIsOpen(false);
      },
    }));
  },
};

type ApplyTagsParams = {
  piecesName: string[];
  tags: string[];
};
