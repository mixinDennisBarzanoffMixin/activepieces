import { Component } from 'solid-js';
import {
  Bot,
  ChartLine,
  Compass,
  FileHeart,
  FileJson2,
  Frame,
  KeyRound,
  LayoutGrid,
  LogIn,
  MousePointerClick,
  Palette,
  Puzzle,
  Receipt,
  Server,
  Settings2,
  Shield,
  SquareDashedBottomCode,
  Trophy,
  Unplug,
  Users,
  Webhook,
  Workflow,
} from 'lucide-solid';

export type StaticPage = {
  id: string;
  label: string;
  href: string;
  icon: Component<any>;
  requiresPlatformAdmin?: boolean;
};

export const STATIC_PAGES: StaticPage[] = [
  {
    id: 'page-automations',
    label: 'Automations',
    href: '/automations',
    icon: Workflow,
  },
  {
    id: 'page-explore',
    label: 'Explore Templates',
    href: '/templates',
    icon: Compass,
  },
  {
    id: 'page-impact',
    label: 'Impact',
    href: '/impact',
    icon: ChartLine,
  },
  {
    id: 'page-leaderboard',
    label: 'Leaderboard',
    href: '/leaderboard',
    icon: Trophy,
  },
  // Platform Admin pages
  {
    id: 'page-platform-projects',
    label: 'Platform Admin — Projects',
    href: '/platform/projects',
    icon: LayoutGrid,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-users',
    label: 'Platform Admin — Users',
    href: '/platform/users',
    icon: Users,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-ai',
    label: 'Platform Admin — AI Providers',
    href: '/platform/setup/ai',
    icon: Bot,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-branding',
    label: 'Platform Admin — Branding',
    href: '/platform/setup/branding',
    icon: Palette,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-connections',
    label: 'Platform Admin — Global Connections',
    href: '/platform/setup/connections',
    icon: Unplug,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-pieces',
    label: 'Platform Admin — Pieces',
    href: '/platform/setup/pieces',
    icon: Puzzle,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-templates',
    label: 'Platform Admin — Templates',
    href: '/platform/setup/templates',
    icon: LayoutGrid,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-billing',
    label: 'Platform Admin — Billing',
    href: '/platform/setup/billing',
    icon: Receipt,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-embedding',
    label: 'Platform Admin — Embedding',
    href: '/platform/security/embed',
    icon: Frame,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-audit-logs',
    label: 'Platform Admin — Audit Logs',
    href: '/platform/security/audit-logs',
    icon: SquareDashedBottomCode,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-sso',
    label: 'Platform Admin — Single Sign On',
    href: '/platform/security/sso',
    icon: LogIn,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-project-roles',
    label: 'Platform Admin — Project Roles',
    href: '/platform/security/project-roles',
    icon: Settings2,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-api-keys',
    label: 'Platform Admin — API Keys',
    href: '/platform/security/api-keys',
    icon: FileJson2,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-secret-managers',
    label: 'Platform Admin — Secret Managers',
    href: '/platform/security/secret-managers',
    icon: KeyRound,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-workers',
    label: 'Platform Admin — Workers',
    href: '/platform/infrastructure/workers',
    icon: Server,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-health',
    label: 'Platform Admin — Health',
    href: '/platform/infrastructure/health',
    icon: FileHeart,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-triggers',
    label: 'Platform Admin — Triggers',
    href: '/platform/infrastructure/triggers',
    icon: MousePointerClick,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-event-streaming',
    label: 'Platform Admin — Event Streaming',
    href: '/platform/infrastructure/event-destinations',
    icon: Webhook,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-admin',
    label: 'Platform Admin',
    href: '/platform/projects',
    icon: Shield,
    requiresPlatformAdmin: true,
  },
];
