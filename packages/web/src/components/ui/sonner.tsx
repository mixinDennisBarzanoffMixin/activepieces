import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-solid';
import { Toaster as Sonner, toast, type ToasterProps } from 'solid-sonner';

import { useTheme } from '@/components/providers/theme-provider';

export const INTERNAL_ERROR_MESSAGE =
  'An unexpected error occurred. Please try again in a moment.';

export function internalErrorToast() {
  console.error('internalErrorToast', INTERNAL_ERROR_MESSAGE);
  toast.error('Something went wrong', {
    description: INTERNAL_ERROR_MESSAGE,
    duration: 3000,
  });
}

export const UNSAVED_CHANGES_TOAST = {
  id: 'unsaved-changes',
  title: 'Unsaved Changes',
  description:
    'Something went wrong and there are unsaved changes, please refresh and contact support if the problem persists.',
  variant: 'destructive',
  duration: Infinity,
};

function Toaster({ ...props }: ToasterProps) {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      class="toaster group"
      expand={true}
      toastOptions={{
        classNames: {
          toast: `
            data-[type=error]:text-destructive-700!
            data-[type=warning]:text-warning-700!
            data-[type=success]:text-success-700!
          `,
          description: `
            data-[type=error]:text-destructive-700!
            data-[type=warning]:text-warning-700!
            data-[type=success]:text-success-700!
          `,
        },
        descriptionClassName: 'text-inherit!',
      }}
      icons={{
        success: <CircleCheckIcon class="size-4" />,
        info: <InfoIcon class="size-4" />,
        warning: <TriangleAlertIcon class="size-4" />,
        error: <OctagonXIcon class="size-4" />,
        loading: <Loader2Icon class="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-text': 'var(--foreground)',
          '--normal-bg': 'var(--background)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as JSX.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
