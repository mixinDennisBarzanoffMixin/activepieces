import { createMemo, createSignal } from 'solid-js';
import { useDebouncedCallback } from '@/lib/debounce';
import { useSearchParams } from '@solidjs/router';

import { AutomationsFilters } from '../lib/types';
import { hasActiveFilters } from '../lib/utils';

const SEARCH_PARAM = 'search';
const TYPE_PARAM = 'type';
const STATUS_PARAM = 'status';
const CONNECTION_PARAM = 'connection';
const OWNER_PARAM = 'owner';
const FOLDER_PARAM = 'folder';

const FILTER_PARAMS = [
  SEARCH_PARAM,
  TYPE_PARAM,
  STATUS_PARAM,
  CONNECTION_PARAM,
  OWNER_PARAM,
  FOLDER_PARAM,
] as const;

export function useAutomationsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchInput, setSearchInput] = createSignal(
    searchParams.get(SEARCH_PARAM) ?? '',
  );
  const [searchTerm, setSearchTerm] = createSignal(
    searchParams.get(SEARCH_PARAM) ?? '',
  );
  const [typeFilter, setTypeFilterState] = createSignal<string[]>(
    searchParams.getAll(TYPE_PARAM),
  );
  const [statusFilter, setStatusFilterState] = createSignal<string[]>(
    searchParams.getAll(STATUS_PARAM),
  );
  const [connectionFilter, setConnectionFilterState] = createSignal<string[]>(
    searchParams.getAll(CONNECTION_PARAM),
  );
  const [ownerFilter, setOwnerFilterState] = createSignal<string[]>(
    searchParams.getAll(OWNER_PARAM),
  );
  const folderParamStr = searchParams.getAll(FOLDER_PARAM).join('\0');
  const folderFilter = createMemo(() => searchParams.getAll(FOLDER_PARAM));

  const updateParams = (updates: Record<string, string | string[] | null>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(updates)) {
          next.delete(key);
          if (value === null || value === '') continue;
          if (Array.isArray(value)) {
            value.forEach((v) => next.append(key, v));
          } else {
            next.set(key, value);
          }
        }
        return next;
      },
      { replace: true },
    );
  };

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setSearchTerm(value);
    updateParams({ [SEARCH_PARAM]: value || null });
  }, 300);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    debouncedSetSearch(value);
  };

  const setTypeFilter = (value: string[]) => {
    setTypeFilterState(value);
    updateParams({ [TYPE_PARAM]: value.length > 0 ? value : null });
  };

  const setStatusFilter = (value: string[]) => {
    setStatusFilterState(value);
    updateParams({ [STATUS_PARAM]: value.length > 0 ? value : null });
  };

  const setConnectionFilter = (value: string[]) => {
    setConnectionFilterState(value);
    updateParams({ [CONNECTION_PARAM]: value.length > 0 ? value : null });
  };

  const setOwnerFilter = (value: string[]) => {
    setOwnerFilterState(value);
    updateParams({ [OWNER_PARAM]: value.length > 0 ? value : null });
  };

  const setFolderFilter = (value: string[]) => {
    updateParams({ [FOLDER_PARAM]: value.length > 0 ? value : null });
  };

  const filters: AutomationsFilters = {
    searchTerm: searchTerm(),
    typeFilter: typeFilter(),
    statusFilter: statusFilter(),
    connectionFilter: connectionFilter(),
    ownerFilter: ownerFilter(),
    folderFilter: folderFilter(),
  };

  const filtersActive = hasActiveFilters(filters);

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setTypeFilterState([]);
    setStatusFilterState([]);
    setConnectionFilterState([]);
    setOwnerFilterState([]);
    updateParams(Object.fromEntries(FILTER_PARAMS.map((key) => [key, null])));
  };

  return {
    searchInput: searchInput(),
    handleSearchChange,
    typeFilter: typeFilter(),
    setTypeFilter,
    statusFilter: statusFilter(),
    setStatusFilter,
    connectionFilter: connectionFilter(),
    setConnectionFilter,
    ownerFilter: ownerFilter(),
    setOwnerFilter,
    folderFilter: folderFilter(),
    setFolderFilter,
    filters,
    filtersActive,
    clearAllFilters,
  };
}
