import { Badge } from '@/components/ui/badge';

const variantBadgeMap: Record<StatusVariant, any> = {
  success: 'success',
  error: 'destructive',
  default: 'accent',
  secondary: 'secondary',
};

const StatusIconWithText = ({
  icon: Icon,
  text,
  variant = 'default',
}: StatusIconWithTextProps) => {
  return (
    <Badge variant={variantBadgeMap[variant]}>
      <Icon class="size-4" />
      <span>{text}</span>
    </Badge>
  );
};

StatusIconWithText.displayName = 'StatusIconWithText';
export { StatusIconWithText };

type StatusVariant = 'success' | 'error' | 'default' | 'secondary';

interface StatusIconWithTextProps {
  icon: any;
  text: string;
  variant?: StatusVariant;
}
