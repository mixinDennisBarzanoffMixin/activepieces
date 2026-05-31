import { useParams } from '@solidjs/router';
import { createSignal } from 'solid-js';
import { t } from 'i18next';
import { toast } from 'solid-sonner';

import { authenticationSession } from '@/lib/authentication-session';

const STORAGE_KEY_PREFIX = 'ap_pinned_items_';

function getStorageKey(projectId: string, userId: string): string {
  return `${STORAGE_KEY_PREFIX}${projectId}_${userId}`;
}

/**
 * Stored as an ordered array where index 0 = most recently pinned (shown first).
 * New pins are prepended so "last pinned = very top".
 */
function readPinnedList(projectId: string, userId: string): string[] {
  try {
    const raw = localStorage.getItem(getStorageKey(projectId, userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      typeof parsed[0] === 'object'
    ) {
      return [];
    }
    return parsed as string[];
  } catch {
    return [];
  }
}

function writePinnedList(
  projectId: string,
  userId: string,
  list: string[],
): void {
  localStorage.setItem(getStorageKey(projectId, userId), JSON.stringify(list));
}

export function usePinnedItems() {
  const { projectId: projectIdFromUrl } = useParams<{ projectId: string }>();
  const projectId = projectIdFromUrl ?? authenticationSession.getProjectId()!;
  const userId = authenticationSession.getCurrentUserId()!;

  const [pinnedList, setPinnedList] = createSignal<string[]>(() =>
    readPinnedList(projectId, userId),
  );

  const pinnedIds = () => new Set(pinnedList());

  const isPinned = (itemId: string) => pinnedList().includes(itemId);

  const pinOrder = (itemId: string) => {
    const idx = pinnedList().indexOf(itemId);
    return idx === -1 ? Infinity : idx;
  };

  const togglePin = (itemId: string) => {
    const wasPinned = pinnedList().includes(itemId);
    setPinnedList((prev) => {
      const idx = prev.indexOf(itemId);
      const next =
        idx !== -1 ? prev.filter((id) => id !== itemId) : [itemId, ...prev];
      writePinnedList(projectId, userId, next);
      return next;
    });
    toast.success(
      wasPinned ? t('Removed from favorites.') : t('Favorited and moved to the top.'),
    );
  };

  const unpinItem = (itemId: string) => {
    setPinnedList((prev) => {
      if (!prev.includes(itemId)) return prev;
      const next = prev.filter((id) => id !== itemId);
      writePinnedList(projectId, userId, next);
      return next;
    });
  };

  return { pinnedIds, pinnedList, isPinned, pinOrder, togglePin, unpinItem };
}
