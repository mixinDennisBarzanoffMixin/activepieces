import {
  ApFlagId,
  isNil,
  Permission,
  PlatformRole,
  ProjectType,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Bell, GitBranch, Puzzle, Settings, Users } from 'lucide-solid';
import { createEffect, createSignal, Show, For } from 'solid-js';
import { toast } from 'solid-sonner';

import { McpSvg } from '@/assets/img/custom/mcp';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { projectCollectionUtils } from '@/features/projects';
import { ApProjectDisplay } from '@/features/projects/components/ap-project-display';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';

import { ProjectAvatar } from '../project-avatar';

import { AlertsSettings } from './alerts';
import { EnvironmentSettings } from './environment';
import { GeneralSettings } from './general';
import type { FormValues } from './general';
import { McpServerSettings } from './mcp-server';
import { MembersSettings } from './members';
import { PiecesSettings } from './pieces';

type TabId =
  | 'general'
  | 'members'
  | 'alerts'
  | 'pieces'
  | 'environment'
  | 'mcp';

interface ProjectSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  initialTab?: TabId;
  initialValues?: {
    projectName?: string;
    externalId?: string;
  };
}

export function ProjectSettingsDialog({
  open,
  onClose,
  initialTab = 'general',
  initialValues,
}: ProjectSettingsDialogProps) {
  const [activeTab, setActiveTab] = createSignal<TabId>(initialTab);
  const { checkAccess } = useAuthorization();
  const { project } = projectCollectionUtils.useCurrentProject();
  let previousOpenRef = open;

  const { data: showAlerts } = flagsHooks.useFlag(ApFlagId.SHOW_ALERTS);
  const { data: showProjectMembers } = flagsHooks.useFlag(
    ApFlagId.SHOW_PROJECT_MEMBERS,
  );
  const { platform } = platformHooks.useCurrentPlatform();
  const platformRole = userHooks.getCurrentUserPlatformRole();

  const initial = (): FormValues => ({
    projectName: initialValues?.projectName ?? project.displayName,
    icon: project.icon,
    externalId: initialValues?.externalId,
    maxConcurrentJobs: project.maxConcurrentJobs,
  });
  const disabled = checkAccess(Permission.WRITE_PROJECT) === false;
  const [values, setValues] = createSignal<FormValues>(initial());
  const [dirty, setDirty] = createSignal(false);

  const setField = <K extends keyof FormValues>(
    field: K,
    value: FormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSave = () => {
    const data = values();
    projectCollectionUtils.update(project.id, {
      displayName: data.projectName,
      externalId: data.externalId,
      icon: data.icon,
      maxConcurrentJobs: data.maxConcurrentJobs,
    });
    setDirty(false);
    toast.success(t('Your changes have been saved.'), {
      duration: 3000,
    });
    onClose();
  };

  createEffect(() => {
    const dialogJustOpened = open && !previousOpenRef;
    if (dialogJustOpened && !isNil(project)) {
      setValues(initial());
      setDirty(false);
      setActiveTab(initialTab);
    }
    previousOpenRef = open;
  });

  const hasGeneralSettings =
    project.type === ProjectType.TEAM ||
    (platform.plan.embeddingEnabled && platformRole === PlatformRole.ADMIN);

  const tabs = [
    {
      id: 'general' as TabId,
      label: t('General'),
      icon: <Settings class="w-4 h-4" />,
      disabled: !hasGeneralSettings,
    },
    {
      id: 'members' as TabId,
      label: t('Members'),
      icon: <Users class="w-4 h-4" />,
      disabled:
        project.type !== ProjectType.TEAM ||
        !checkAccess(Permission.READ_PROJECT_MEMBER) ||
        !showProjectMembers,
    },
    {
      id: 'alerts' as TabId,
      label: t('Alert Emails'),
      icon: <Bell class="w-4 h-4" />,
      disabled: !checkAccess(Permission.READ_ALERT) || !showAlerts,
    },
    {
      id: 'mcp' as TabId,
      label: t('MCP Server'),
      icon: <McpSvg class="w-4 h-4" />,
      disabled: false,
    },
    {
      id: 'pieces' as TabId,
      label: t('Pieces'),
      icon: <Puzzle class="w-4 h-4" />,
      disabled: false,
    },
    {
      id: 'environment' as TabId,
      label: t('Environment'),
      icon: <GitBranch class="w-4 h-4" />,
      disabled: !checkAccess(Permission.READ_PROJECT_RELEASE),
    },
  ].filter((tab) => !tab.disabled);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <GeneralSettings
            values={values}
            setField={setField}
            disabled={disabled}
          />
        );
      case 'members':
        return <MembersSettings />;
      case 'alerts':
        return <AlertsSettings />;
      case 'pieces':
        return <PiecesSettings />;
      case 'environment':
        return <EnvironmentSettings />;
      case 'mcp':
        return <McpServerSettings />;
      default:
        return null;
    }
  };

  const renderTabHeader = () => {
    const hasUnsavedChanges = activeTab === 'general' && dirty();
    return (
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold">
          {tabs.find((tab) => tab.id === activeTab)?.label}
        </span>
        {
          <Show when={hasUnsavedChanges}>
            <Badge variant="ghost" class="text-muted-foreground">
              {t('Unsaved changes')}
            </Badge>
          </Show>
        }
      </div>
    );
  };
  const renderDialogFooter = () => {
    if (activeTab !== 'general') return null;

    return (
      <div className="border-t bg-background rounded-br-md">
        <div className="flex items-center justify-end gap-3 px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            {t('Close')}
          </Button>
          <Button
            disabled={!dirty()}
            size="sm"
            onClick={handleSave}
          >
            {t('Save Changes')}
          </Button>
        </div>
      </div>
    );
  };

  const currentIconColor = values().icon.color;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent class="max-w-5xl w-full max-h-[95vh] rounded-sm flex flex-col p-0">
        <div className="flex h-[700px]">
          <div className="w-[238px]">
            <nav className="bg-sidebar space-y-1 bg-muted rounded-sm rounded-r-none h-full flex flex-col rounded-l-md">
              <ApProjectDisplay
                title={values().projectName}
                icon={values().icon}
                containerClassName="px-3 my-4"
                titleClassName="text-sm font-medium"
                maxLengthToNotShowTooltip={18}
                projectType={project.type}
              />
              <div className="flex flex-col px-2 gap-1">
                {
                  <For each={tabs}>
                    {(tab) => (
                      <div
                        className={cn(
                          'flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm font-medium transition-all cursor-pointer hover:bg-sidebar-accent',
                          {
                            'bg-sidebar-accent': activeTab === tab.id,
                          },
                        )}
                        onClick={() => setActiveTab(tab.id)}
                      >
                        {tab.icon}
                        {tab.label}
                      </div>
                    )}
                  </For>
                }
              </div>
            </nav>
          </div>
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-hidden">
              <ScrollArea class="h-full">
                {
                  <Show when={activeTab === 'general'}>
                    <ProjectAvatar
                      displayName={project.displayName}
                      projectType={project.type}
                      iconColor={currentIconColor}
                      size="md"
                      showBackground={true}
                    />
                  </Show>
                }
                <div className="flex flex-col gap-3 px-10 pt-4">
                  {renderTabHeader()}
                  {renderTabContent()}
                </div>
              </ScrollArea>
            </div>
            {renderDialogFooter()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
