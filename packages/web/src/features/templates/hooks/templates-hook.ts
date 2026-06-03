import { Template, TemplateType } from '@activepieces/shared';
import { useSearchParams } from '@solidjs/router';
import {
  createMutation,
  createQuery,
  useQueryClient,
} from '@tanstack/solid-query';
import { t } from 'i18next';
import { toast } from 'solid-sonner';

import { useDebounce } from '@/lib/debounce';

import { templatesApi } from '../api/templates-api';

export const templatesHooks = {
  useTemplateCategories: () => {
    return createQuery<string[], Error>(() => ({
      queryKey: ['template', 'categories'],
      queryFn: async () => {
        const result = await templatesApi.getCategories();
        return result.value ?? [];
      },
      staleTime: 5 * 60 * 1000,
    }));
  },

  useTemplate: (id: string) => {
    return createQuery<Template, Error>(() => ({
      queryKey: ['template', id],
      queryFn: () => templatesApi.getTemplate(id),
    }));
  },

  useAllOfficialTemplates: () => {
    return createQuery<Template[], Error>(() => ({
      queryKey: ['templates', 'all'],
      queryFn: async () => {
        const result = await templatesApi.list({
          type: TemplateType.OFFICIAL,
        });
        return result.data;
      },
      staleTime: 5 * 60 * 1000,
    }));
  },

  useTemplates: (type?: TemplateType) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const search = () => searchParams.search ?? '';
    const category = () => searchParams.category;

    const [debouncedSearch] = useDebounce(search, 300);

    const { data: templates, isLoading } = createQuery<Template[], Error>(
      () => ({
        queryKey: ['templates', debouncedSearch(), category()],
        queryFn: async () => {
          const templates = await templatesApi.list({
            type,
            search: debouncedSearch() || undefined,
            category: category(),
          });
          return templates.data;
        },
        staleTime: 5 * 60 * 1000,
      }),
    );

    const setSearch = (newSearch: string) => {
      setSearchParams({ search: newSearch || undefined });
    };

    const setCategory = (newCategory: string) => {
      setSearchParams({
        category:
          newCategory && newCategory !== 'All' ? newCategory : undefined,
      });
    };

    return {
      templates,
      isLoading,
      search: search(),
      setSearch,
      category: category() || 'All',
      setCategory,
    };
  },
};

export const templateKeys = {
  all: ['templates'] as const,
  custom: ['custom-templates'] as const,
};

export const templatesMutations = {
  useCreateTemplate: ({
    onDone,
    onError,
  }: {
    onDone: () => void;
    onError?: (error: Error) => void;
  }) => {
    const queryClient = useQueryClient();
    return createMutation(() => ({
      mutationFn: (request: Parameters<typeof templatesApi.create>[0]) =>
        templatesApi.create(request),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: templateKeys.custom });
        toast.success(t('Template created successfully'), { duration: 3000 });
        onDone();
      },
      onError,
    }));
  },
  useUpdateTemplate: ({
    onDone,
    onError,
  }: {
    onDone: () => void;
    onError?: (error: Error) => void;
  }) => {
    const queryClient = useQueryClient();
    return createMutation(() => ({
      mutationFn: ({
        templateId,
        request,
      }: {
        templateId: string;
        request: Parameters<typeof templatesApi.update>[1];
      }) => templatesApi.update(templateId, request),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: templateKeys.custom });
        toast.success(t('Template updated successfully'), { duration: 3000 });
        onDone();
      },
      onError,
    }));
  },
  useBulkDeleteTemplates: ({ onSuccess }: { onSuccess: () => void }) => {
    const queryClient = useQueryClient();
    return createMutation(() => ({
      mutationFn: async (templateIds: string[]) => {
        await Promise.all(templateIds.map((id) => templatesApi.delete(id)));
      },
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: templateKeys.custom });
        onSuccess();
      },
    }));
  },
};
