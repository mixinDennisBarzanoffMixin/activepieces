import {
  BadgeAwarded,
  BADGES,
  ApFlagId,
  WebsocketClientEvent,
} from '@activepieces/shared';
import confetti from 'canvas-confetti';
import { Trophy } from 'lucide-solid';
import { createSignal, createEffect, type JSX } from 'solid-js';
import { toast } from 'solid-sonner';

import { useSocket } from '@/components/providers/socket-provider';
import { flagsHooks } from '@/hooks/flags-hooks';
import { userHooks } from '@/hooks/user-hooks';

import { AccountSettingsDialog } from './account-settings';

export const BadgeCelebrate = () => {
  const socket = useSocket();
  const { refetch } = userHooks.useCurrentUser();
  let cleanupRef: (() => void) | undefined;
  const { data: showBadges } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_BADGES,
  );
  let isCelebrating = false;
  let celebrationTimeout: ReturnType<typeof setTimeout> | undefined;
  const [showAccountSettings, setShowAccountSettings] = createSignal(false);
  const openAccountSettingsRef = () => setShowAccountSettings(true);

  createEffect(() => {
    if (!socket || !showBadges) return;
    if (cleanupRef) {
      cleanupRef();
    }

    const handleBadgeAwarded = (data: BadgeAwarded) => {
      const badge = BADGES[data.badge as keyof typeof BADGES];
      if (!badge) {
        return;
      }

      const badgeTitle = badge.title;
      const badgeDescription = badge.description;
      const badgeImageUrl = badge.imageUrl;

      toast.custom(
        () => (
          <BadgeToast
            imageUrl={badgeImageUrl}
            title={badgeTitle}
            description={badgeDescription}
            onClick={openAccountSettingsRef}
          />
        ),
        {
          duration: 10000,
          className:
            'bg-background border border-border rounded-xl shadow-lg p-3',
        },
      );

      void refetch();
      if (isCelebrating) {
        return;
      }
      isCelebrating = true;

      const duration = 6000;
      const animationEnd = Date.now() + duration;
      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }
        const defaults = {
          startVelocity: 30,
          spread: 360,
          ticks: 60,
          zIndex: 9999,
        };
        const particleCount = 50 * (timeLeft / duration);

        void confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        void confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      // Set a timeout to reset the celebrating flag when finished
      if (celebrationTimeout) {
        clearTimeout(celebrationTimeout);
      }
      celebrationTimeout = window.setTimeout(() => {
        isCelebrating = false;
        celebrationTimeout = undefined;
      }, duration);
    };

    socket.on(WebsocketClientEvent.BADGE_AWARDED, handleBadgeAwarded);

    cleanupRef = () => {
      socket.off(WebsocketClientEvent.BADGE_AWARDED, handleBadgeAwarded);
      isCelebrating = false;
      if (celebrationTimeout) {
        clearTimeout(celebrationTimeout);
        celebrationTimeout = undefined;
      }
    };

    return cleanupRef;
  });

  return (
    <AccountSettingsDialog
      open={showAccountSettings}
      onClose={() => setShowAccountSettings(false)}
    />
  );
};

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

const BadgeToast = (props: {
  imageUrl: string;
  title: string;
  description: string;
  onClick: () => void;
}): JSX.Element => (
  <div
    class="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
    onClick={props.onClick}
  >
    <img
      src={props.imageUrl}
      alt={props.title}
      class="w-12 h-12 rounded-lg object-cover shadow-md flex-shrink-0"
    />
    <div class="flex flex-col gap-0.5 min-w-0">
      <div class="flex items-center gap-2">
        <span class="font-semibold text-foreground text-sm">{props.title}</span>
        <span class="text-[10px] font-medium text-primary uppercase tracking-wide flex items-center gap-1">
          <Trophy class="w-3 h-3" />
          Badge Earned!
        </span>
      </div>
      <p class="text-xs text-muted-foreground leading-snug">
        {props.description}
      </p>
    </div>
  </div>
);
