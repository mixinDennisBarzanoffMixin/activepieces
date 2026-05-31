import {
  BadgeAwarded,
  BADGES,
  ApFlagId,
  WebsocketClientEvent,
} from '@activepieces/shared';
import confetti from 'canvas-confetti';
import { Trophy } from 'lucide-solid';
import { createSignal, createEffect } from 'solid-js';
import { toast } from 'solid-sonner';

import { useSocket } from '@/components/providers/socket-provider';
import { flagsHooks } from '@/hooks/flags-hooks';
import { userHooks } from '@/hooks/user-hooks';

import { AccountSettingsDialog } from './account-settings';

export const BadgeCelebrate = () => {
  const socket = useSocket();
  const { refetch } = userHooks.useCurrentUser();
  let cleanupRef = undefined;
  const { data: showBadges } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_BADGES,
  );
  let isCelebrating = false;
  let celebrationTimeout = undefined;
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

      const badgeTitle = badge?.title;
      const badgeDescription = badge?.description;
      const badgeImageUrl = badge?.imageUrl;

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

      refetch();
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

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
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
        celebrationTimeout = null;
      }, duration);
    };

    socket.on(WebsocketClientEvent.BADGE_AWARDED, handleBadgeAwarded);

    cleanupRef = () => {
      socket.off(WebsocketClientEvent.BADGE_AWARDED, handleBadgeAwarded);
      isCelebrating = false;
      if (celebrationTimeout) {
        clearTimeout(celebrationTimeout);
        celebrationTimeout = null;
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

const BadgeToast = ({
  imageUrl,
  title,
  description,
  onClick,
}: {
  imageUrl: string;
  title: string;
  description: string;
  onClick: () => void;
}) => (
  <div
    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
    onClick={onClick}
  >
    <img
      src={imageUrl}
      alt={title}
      className="w-12 h-12 rounded-lg object-cover shadow-md flex-shrink-0"
    />
    <div className="flex flex-col gap-0.5 min-w-0">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-foreground text-sm">{title}</span>
        <span className="text-[10px] font-medium text-primary uppercase tracking-wide flex items-center gap-1">
          <Trophy class="w-3 h-3" />
          Badge Earned!
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-snug">
        {description}
      </p>
    </div>
  </div>
);
