import { ProjectType, ProjectWithLimits, SeekPage } from '@activepieces/shared';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { t } from 'i18next';
import { jwtDecode } from 'jwt-decode';
import { CheckCircle, FolderKanban, Lock, Plug, Workflow } from 'lucide-solid';
import { createMemo, createSignal, Show } from 'solid-js';

import { queryClient } from '@/app/query-client';
import { FullLogo } from '@/components/custom/full-logo';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MultiSelectFilter } from '@/features/automations/components/multi-select-filter';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { useDebouncedCallback } from '@/lib/debounce';

function McpAuthorizePage() {
  const searchParams = new URLSearchParams(window.location.search);
  const authRequestId = searchParams.get('authRequestId');
  const { clientName, isPlatformScoped } = decodeJwtPayload(authRequestId);
  const [selectedProjectId, setSelectedProjectId] = createSignal<
    string | undefined
  >(undefined);
  const [searchValue, setSearchValue] = createSignal('');
  const [selectedTypes, setSelectedTypes] = createSignal<string[]>([]);
  const [authorized, setAuthorized] = createSignal(false);
  const debouncedSetSearchValue = useDebouncedCallback(setSearchValue, 300);
  const isLoggedIn = authenticationSession.isLoggedIn();
  const projectTypeOptions = [
    { value: ProjectType.TEAM, label: t('Team') },
    { value: ProjectType.PERSONAL, label: t('Personal') },
  ];

  const { data: projectsPage, isLoading: projectsLoading } = createQuery(
    () => ({
      queryKey: ['mcp-authorize-projects', searchValue(), selectedTypes()],
      queryFn: () =>
        api.get<SeekPage<ProjectWithLimits>>('/v1/projects', {
          limit: 1000,
          ...(searchValue() && { displayName: searchValue() }),
          ...(selectedTypes().length > 0 && { types: selectedTypes() }),
        }),
      enabled: isLoggedIn && !!authRequestId && !isPlatformScoped,
    }),
    () => queryClient,
  );

  const approveMutation = createMutation(
    () => ({
      mutationFn: (body: { authRequestId: string; projectId?: string }) =>
        api.post<{ redirectUrl: string }>('/v1/mcp-oauth/approve', body),
      onSuccess: (data) => {
        window.location.href = data.redirectUrl;
        setAuthorized(true);
      },
    }),
    () => queryClient,
  );

  const projects = createMemo(() => {
    const list = projectsPage?.data ?? [];
    return {
      projectsMap: new Map(list.map((p) => [p.id, p])),
      options: list.map((p) => ({ value: p.id, label: p.displayName })),
    };
  });

  if (!authRequestId) {
    window.location.replace('/404');
    return null;
  }

  if (!isLoggedIn) {
    const returnUrl = `/mcp-authorize?${searchParams.toString()}`;
    const loginParams = new URLSearchParams({ from: returnUrl });
    window.location.replace(`/sign-in?${loginParams.toString()}`);
    return null;
  }

  const handleAuthorize = () => {
    if (!isPlatformScoped && !selectedProjectId()) return;
    approveMutation.mutate({
      authRequestId,
      ...(selectedProjectId() && { projectId: selectedProjectId() }),
    });
  };

  if (authorized()) {
    return (
      <div class="flex h-screen flex-col items-center justify-center px-4">
        <FullLogo />
        <Card class="mt-4 w-full max-w-md rounded-sm drop-shadow-xl">
          <CardContent class="flex flex-col items-center gap-5 pt-8 pb-8">
            <div class="flex h-14 w-14 items-center justify-center rounded-full bg-success-100">
              <CheckCircle class="h-7 w-7 text-success" />
            </div>
            <div class="flex flex-col items-center gap-2 text-center">
              <CardTitle class="text-2xl">{t('Connected')}</CardTitle>
              <CardDescription>
                <span class="font-medium text-foreground">{clientName}</span>{' '}
                <Show
                  when={isPlatformScoped}
                  fallback={t('is now connected to your project.')}
                >
                  {t('is now connected to your platform.')}
                </Show>
              </CardDescription>
            </div>
            <Separator />
            <p class="text-sm text-muted-foreground">
              {t('You can close this tab and return to the application.')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div class="flex h-screen flex-col items-center justify-center px-4">
      <FullLogo />
      <Card class="mt-4 w-full max-w-md rounded-sm drop-shadow-xl">
        <CardHeader class="text-center">
          <div class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Plug class="h-5 w-5 text-primary" />
          </div>
          <CardTitle class="text-2xl">{t('Authorize Application')}</CardTitle>
          <CardDescription>
            <span class="font-semibold text-foreground">{clientName}</span>{' '}
            {t('wants to connect to your Activepieces account')}
          </CardDescription>
        </CardHeader>

        <CardContent class="flex flex-col gap-5">
          <div class="flex flex-col gap-3">
            <PermissionItem
              icon={<Workflow class="h-4 w-4 text-primary" />}
              text={t('Build, test, and manage automations')}
            />
            <PermissionItem
              icon={<Lock class="h-4 w-4 text-primary" />}
              text={t('Use connections and execute flows')}
            />
          </div>

          <Separator />

          <Show when={!isPlatformScoped}>
            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium">{t('Select Project')}</label>
                <MultiSelectFilter
                  label={t('Type')}
                  icon={<FolderKanban class="size-4" />}
                  options={projectTypeOptions}
                  selectedValues={selectedTypes()}
                  onChange={setSelectedTypes}
                />
              </div>
              <SearchableSelect<string>
                options={projects().options}
                onChange={(value) => setSelectedProjectId(value ?? undefined)}
                value={selectedProjectId()}
                placeholder={t('Search projects...')}
                disabled={projectsLoading}
                loading={projectsLoading}
                refreshOnSearch={debouncedSetSearchValue}
                valuesRendering={(value) => {
                  const project = projects().projectsMap.get(String(value));
                  if (!project) return null;
                  return (
                    <div class="flex w-full items-center justify-between gap-2">
                      <span class="truncate">{project.displayName}</span>
                      <Badge variant="outline" class="shrink-0 text-[10px]">
                        <Show
                          when={project.type === ProjectType.PERSONAL}
                          fallback={t('Team')}
                        >
                          {t('Personal')}
                        </Show>
                      </Badge>
                    </div>
                  );
                }}
              />
            </div>
          </Show>

          <Show when={approveMutation.isError}>
            <div class="rounded-md border border-destructive/50 bg-destructive-100 p-3 text-sm text-destructive">
              {t('Authorization failed. Please try again.')}
            </div>
          </Show>

          <div class="flex gap-3">
            <Button
              type="button"
              variant="outline"
              class="flex-1"
              onClick={() => window.history.back()}
            >
              {t('Deny')}
            </Button>
            <Button
              type="button"
              class="flex-1"
              loading={approveMutation.isPending}
              disabled={!isPlatformScoped && !selectedProjectId()}
              onClick={handleAuthorize}
            >
              {t('Authorize')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PermissionItem(props: { icon: JSX.Element; text: string }) {
  return (
    <div class="flex items-center gap-3 rounded-md border bg-accent/50 px-3 py-2.5 text-sm">
      <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
        {props.icon}
      </div>
      <span>{props.text}</span>
    </div>
  );
}

function decodeJwtPayload(token: string | null): {
  clientName: string;
  isPlatformScoped: boolean;
} {
  try {
    if (!token)
      return { clientName: t('Unknown app'), isPlatformScoped: false };
    const payload = jwtDecode<{ clientName?: string; resource?: string }>(
      token,
    );
    const clientName = payload.clientName ?? t('Unknown app');
    const isPlatformScoped =
      payload.resource?.endsWith('/mcp/platform') ?? false;
    return { clientName, isPlatformScoped };
  } catch {
    return { clientName: t('Unknown app'), isPlatformScoped: false };
  }
}

export { McpAuthorizePage };
