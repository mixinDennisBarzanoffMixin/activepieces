import { Accessor, createMemo, createSignal } from 'solid-js';

import { authenticationSession } from '@/lib/authentication-session';

import { convertToSeconds, TIME_UNITS, TimeUnit } from './impact-utils';
import { FlowDetailRow, Owner } from './use-flow-details-data';

type TimeSavedRangeState = {
  min: string;
  max: string;
  unitMin: TimeUnit;
  unitMax: TimeUnit;
};

type OwnerFilterState = {
  selectedIds: string[];
  searchQuery: string;
  popoverOpen: boolean;
};

const DEFAULT_TIME_SAVED_RANGE: TimeSavedRangeState = {
  min: '',
  max: '',
  unitMin: 'Sec',
  unitMax: 'Sec',
};

export function useDetailsFilters(
  flowDetails: Accessor<FlowDetailRow[] | undefined>,
  uniqueOwners: Accessor<Owner[]>,
) {
  const [searchQuery, setSearchQuery] = createSignal('');
  const [showMyFlowsOnly, setShowMyFlowsOnly] = createSignal(false);

  const [appliedTimeSaved, setAppliedTimeSaved] =
    createSignal<TimeSavedRangeState>(DEFAULT_TIME_SAVED_RANGE);
  const [draftTimeSaved, setDraftTimeSaved] = createSignal<TimeSavedRangeState>(
    DEFAULT_TIME_SAVED_RANGE,
  );
  const [timeSavedPopoverOpen, setTimeSavedPopoverOpen] = createSignal(false);

  const [ownerFilter, setOwnerFilter] = createSignal<OwnerFilterState>({
    selectedIds: [],
    searchQuery: '',
    popoverOpen: false,
  });

  const currentUserId = authenticationSession.getCurrentUserId();

  const updateDraftTimeSaved = (updates: Partial<TimeSavedRangeState>) => {
    setDraftTimeSaved((prev) => ({ ...prev, ...updates }));
  };

  const updateOwnerFilter = (updates: Partial<OwnerFilterState>) => {
    setOwnerFilter((prev) => ({ ...prev, ...updates }));
  };

  const cycleDraftTimeUnitMin = () => {
    const draft = draftTimeSaved();
    const idx = TIME_UNITS.indexOf(draft.unitMin);
    const newMinUnit = TIME_UNITS[(idx + 1) % TIME_UNITS.length];
    const newMinIdx = TIME_UNITS.indexOf(newMinUnit);
    const maxIdx = TIME_UNITS.indexOf(draft.unitMax);
    if (newMinIdx > maxIdx) {
      updateDraftTimeSaved({ unitMin: newMinUnit, unitMax: newMinUnit });
    } else {
      updateDraftTimeSaved({ unitMin: newMinUnit });
    }
  };

  const cycleDraftTimeUnitMax = () => {
    const draft = draftTimeSaved();
    const idx = TIME_UNITS.indexOf(draft.unitMax);
    const newMaxUnit = TIME_UNITS[(idx + 1) % TIME_UNITS.length];
    const newMaxIdx = TIME_UNITS.indexOf(newMaxUnit);
    const minIdx = TIME_UNITS.indexOf(draft.unitMin);
    if (newMaxIdx < minIdx) {
      updateDraftTimeSaved({ unitMax: newMaxUnit, unitMin: newMaxUnit });
    } else {
      updateDraftTimeSaved({ unitMax: newMaxUnit });
    }
  };

  const handleTimeSavedPopoverOpen = (open: boolean) => {
    if (open) {
      setDraftTimeSaved(appliedTimeSaved());
    }
    setTimeSavedPopoverOpen(open);
  };

  const applyTimeSavedFilter = () => {
    setAppliedTimeSaved(draftTimeSaved());
    setTimeSavedPopoverOpen(false);
  };

  const clearTimeSavedFilter = () => {
    setDraftTimeSaved(DEFAULT_TIME_SAVED_RANGE);
    setAppliedTimeSaved(DEFAULT_TIME_SAVED_RANGE);
    setTimeSavedPopoverOpen(false);
  };

  const timeSavedLabel = createMemo(() => {
    const applied = appliedTimeSaved();
    if (!applied.min && !applied.max) return null;
    const min = applied.min ? `${applied.min} ${applied.unitMin}` : '0';
    const max = applied.max ? `${applied.max} ${applied.unitMax}` : '∞';
    return `${min} – ${max}`;
  });

  const toggleOwner = (ownerId: string) => {
    setOwnerFilter((prev) => ({
      ...prev,
      selectedIds: prev.selectedIds.includes(ownerId)
        ? prev.selectedIds.filter((id) => id !== ownerId)
        : [...prev.selectedIds, ownerId],
    }));
  };

  const filteredOwners = createMemo(() => {
    const filter = ownerFilter();
    if (!filter.searchQuery.trim()) return uniqueOwners();
    const query = filter.searchQuery.toLowerCase();
    return uniqueOwners().filter((o) => o.name.toLowerCase().includes(query));
  });

  const selectedOwners = createMemo(() =>
    uniqueOwners().filter((o) => ownerFilter().selectedIds.includes(o.id)),
  );

  const hasActiveFilters = createMemo(() => {
    const applied = appliedTimeSaved();
    return (
      searchQuery() !== '' ||
      applied.min !== '' ||
      applied.max !== '' ||
      ownerFilter().selectedIds.length > 0
    );
  });

  const clearAllFilters = () => {
    setSearchQuery('');
    setAppliedTimeSaved(DEFAULT_TIME_SAVED_RANGE);
    updateOwnerFilter({ selectedIds: [] });
  };

  const filteredData = createMemo(() => {
    const details = flowDetails();
    if (!details) return [];

    let filtered = details;

    if (searchQuery().trim()) {
      const query = searchQuery().toLowerCase();
      filtered = filtered.filter((f) =>
        f.flowName.toLowerCase().includes(query),
      );
    }

    if (showMyFlowsOnly()) {
      filtered = filtered.filter((f) => f.ownerId === currentUserId);
    }

    const filter = ownerFilter();
    if (filter.selectedIds.length > 0) {
      filtered = filtered.filter(
        (f) => f.ownerId && filter.selectedIds.includes(f.ownerId),
      );
    }

    const applied = appliedTimeSaved();
    const minValue = applied.min ? parseFloat(applied.min) : null;
    const maxValue = applied.max ? parseFloat(applied.max) : null;

    if (minValue !== null) {
      filtered = filtered.filter(
        (f) => f.minutesSaved >= convertToSeconds(minValue, applied.unitMin),
      );
    }

    if (maxValue !== null) {
      filtered = filtered.filter(
        (f) => f.minutesSaved <= convertToSeconds(maxValue, applied.unitMax),
      );
    }

    return filtered.sort((a, b) => b.minutesSaved - a.minutesSaved);
  });

  return {
    searchQuery,
    setSearchQuery,
    showMyFlowsOnly,
    setShowMyFlowsOnly,

    draftTimeSaved,
    updateDraftTimeSaved,
    cycleDraftTimeUnitMin,
    cycleDraftTimeUnitMax,
    timeSavedPopoverOpen,
    handleTimeSavedPopoverOpen,
    applyTimeSavedFilter,
    clearTimeSavedFilter,
    timeSavedLabel,

    ownerFilter,
    updateOwnerFilter,
    toggleOwner,
    filteredOwners,
    selectedOwners,

    hasActiveFilters,
    clearAllFilters,
    filteredData,
  };
}
