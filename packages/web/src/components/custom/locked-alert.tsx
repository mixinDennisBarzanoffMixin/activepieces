import { Lock } from 'lucide-solid';

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface LockedAlertProps {
  title: string;
  description: string;
  button: any;
}

export const LockedAlert = ({
  title,
  description,
  button,
}: LockedAlertProps) => {
  return (
    <Alert class="flex items-center gap-4 mb-4">
      <div className="flex items-start gap-3">
        <Lock class="h-5 w-5 text-primary-600 mt-1" />
        <div>
          <AlertTitle class="font-semibold text-lg">{title}</AlertTitle>
          <AlertDescription class="text-sm text-muted-foreground">
            {description}
          </AlertDescription>
        </div>
      </div>
      <div className="ml-auto">{button}</div>
    </Alert>
  );
};
