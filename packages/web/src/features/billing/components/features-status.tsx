import {
  PlatformPlanLimits,
  PlatformWithoutSensitiveData,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Check, Lock } from 'lucide-solid';
import { For, Show } from 'solid-js';

const LICENSE_PROPS_MAP = {
  environmentsEnabled: {
    label: 'Team Collaboration via Git',
  },
  analyticsEnabled: {
    label: 'Analytics',
  },
  auditLogEnabled: {
    label: 'Audit Log',
  },
  embeddingEnabled: {
    label: 'Embedding',
  },
  globalConnectionsEnabled: {
    label: 'Global Connections',
  },
  managePiecesEnabled: {
    label: 'Manage Pieces',
  },
  manageTemplatesEnabled: {
    label: 'Manage Templates',
  },
  customAppearanceEnabled: {
    label: 'Brand Activepieces',
  },
  teamProjectsLimit: {
    label: 'Team Projects Limit',
  },
  projectRolesEnabled: {
    label: 'Project Roles',
  },
  apiKeysEnabled: {
    label: 'API Keys',
  },
  ssoEnabled: {
    label: 'Single Sign On',
  },
  customRolesEnabled: {
    label: 'Custom Roles',
  },
  eventStreamingEnabled: {
    label: 'Event Streaming',
  },
  scimEnabled: {
    label: 'SCIM',
  },
  secretManagersEnabled: {
    label: 'Secret Managers',
  },
  agentsEnabled: {
    label: 'AI & Agents',
  },
  aiProvidersEnabled: {
    label: 'AI Providers',
  },
  chatEnabled: {
    label: 'Chat',
  },
};

export const FeatureStatus = (props: {
  platform: PlatformWithoutSensitiveData;
}) => {
  return (
    <div class="grid grid-cols-2 gap-x-6 gap-y-2">
      <For
        each={Object.entries(LICENSE_PROPS_MAP).sort(([aKey], [bKey]) => {
          const aEnabled =
            props.platform.plan[aKey as keyof PlatformPlanLimits];
          const bEnabled =
            props.platform.plan[bKey as keyof PlatformPlanLimits];
          return (aEnabled ? 0 : 1) - (bEnabled ? 0 : 1);
        })}
      >
        {([key, value]) => {
          const featureEnabled =
            props.platform.plan[key as keyof PlatformPlanLimits];
          return (
            <div class="flex items-center gap-2">
              <Show
                when={featureEnabled}
                fallback={
                  <Lock class="size-4 text-muted-foreground shrink-0" />
                }
              >
                <Check class="size-4 text-success shrink-0" />
              </Show>
              <span
                class={`text-sm ${
                  featureEnabled ? '' : 'text-muted-foreground'
                }`}
              >
                {t(value.label)}
              </span>
            </div>
          );
        }}
      </For>
    </div>
  );
};
