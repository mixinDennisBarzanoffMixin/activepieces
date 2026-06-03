import type { Component } from 'solid-js';

import { Badge } from '@/components/ui/badge';

const variantBadgeMap: Record<StatusVariant, BadgeVariant> = {
  success: 'success',
  error: 'destructive',
  default: 'accent',
  secondary: 'secondary',
};

const StatusIconWithText = (_props: StatusIconWithTextProps) => {
  const variant = () => _props.variant ?? 'default';
  return (
    <Badge variant={variantBadgeMap[variant()]}>
      <_props.icon class="size-4" />
      <span>{_props.text}</span>
    </Badge>
  );
};

export { StatusIconWithText };

type StatusVariant = 'success' | 'error' | 'default' | 'secondary';

interface StatusIconWithTextProps {
  icon: Component<{ class?: string }>;
  text: string;
  variant?: StatusVariant;
}

type BadgeVariant = 'success' | 'destructive' | 'accent' | 'secondary';
