import { createMemo, createSignal } from 'solid-js';
import {
  FlowStatus,
  FolderDto,
  PopulatedFlow,
  SeekPage,
  Table,
  UncategorizedFolderId,
} from '@activepieces/shared';
import { createQuery, useQueryClient } from "@tanstack/solid-query";
import { useParams } from "@solidjs/router";

import { useEmbedding } from '@/components/providers/embed-provider';
import { flowsApi } from '@/features/flows/api/flows-api';
import { foldersApi } from '@/features/folders/api/folders-api';
import { tablesApi } from '@/features/tables/api/tables-api';
import { authenticationSession } from '@/lib/authentication-session';

import { AutomationsFilters, FolderContent } from '../lib/types';
import {
  buildFilteredTreeItems,
  buildTreeItems,
  DEFAULT_PAGE_SIZE,
  FOLDER_PAGE_SIZE,
  hasNonFolderFilters,
} from '../lib/utils';

export function useAutomationsData(
  filters: AutomationsFilters,
  pinnedList?: string[],
) {
  const { projectId: projectIdFromUrl } = useParams<{ projectId: string }>();
  const projectId = projectIdFromUrl ?? authenticationSession.getProjectId()!;
  const queryClient = useQueryClient();
  const { embedState } = useEmbedding();
  const hideTables = embedState.hideTables;
  const isFiltered = hasNonFolderFilters(filters);

  const [rootPage, setRootPage] = createSignal(0);
  const [pageSize, setPageSize] = createSignal(DEFAULT_PAGE_SIZE);
  const [expandedFolders, setExpandedFolders] = createSignal<Set<string>>(
    new Set(),
  );
  const [folderVisibleCounts, setFolderVisibleCounts] = createSignal<
    Map<string, number>
  >(new Map());
  const [loadingFolders, setLoadingFolders] = createSignal<Set<string>>(new Set());

  const foldersQuery = createQuery(() => ({
    queryKey: ['folders', projectId],
    queryFn: () => foldersApi.list(),
    staleTime: STALE_TIME,
    refetchOnMount: 'always',
    meta: { showErrorDialog: true, loadSubsetOptions: {} },
  }));

  const folderIds = foldersQuery.data?.map((f) => f.id).join(',') ?? '';

  const folderCountsQuery = createQuery<Map<string, number>>({
    queryKey: ['folder-counts', projectId, folderIds, hideTables],
    queryFn: async () => {
      const folders = foldersQuery.data!;
      const [folderFlowCounts, folderTableCounts] = await Promise.all([
        Promise.all(
          folders.map(({ id }) => flowsApi.count({ projectId, folderId: id })),
        ),
        hideTables
          ? Promise.resolve(folders.map(() => 0))
          : Promise.all(
              folders.map(({ id }) =>
                tablesApi.count({ projectId, folderId: id }),
              ),
            ),
      ]);
      const folderTotalCounts = folderFlowCounts.map(
        (count, index) => count + folderTableCounts[index],
      );
      return new Map(
        folderTotalCounts.map((count, index) => [folders[index].id, count]),
      );
    },
    enabled: !!foldersQuery.data && foldersQuery.data.length > 0,
    staleTime: STALE_TIME,
    refetchOnMount: 'always',
  });

  const folderContentsQuery = createQuery<FolderContentsMap>({
    queryKey: ['all-folder-contents', projectId, folderIds, hideTables],
    queryFn: async () => {
      const folders = foldersQuery.data!;
      const [folderFlowPages, folderTablePages] = await Promise.all([
        Promise.all(
          folders.map(({ id }) =>
            flowsApi.list({
              projectId,
              folderId: id,
              limit: FOLDER_PAGE_SIZE,
              cursor: undefined,
            }),
          ),
        ),
        hideTables
          ? Promise.resolve<SeekPage<Table>[]>(
              folders.map(() => emptyTablePage()),
            )
          : Promise.all(
              folders.map(({ id }) =>
                tablesApi.list({
                  projectId,
                  folderId: id,
                  limit: FOLDER_PAGE_SIZE,
                  cursor: undefined,
                }),
              ),
            ),
      ]);
      return buildFolderContentsMap(folders, folderFlowPages, folderTablePages);
    },
    enabled: !!foldersQuery.data && foldersQuery.data.length > 0,
    staleTime: STALE_TIME,
    refetchOnMount: 'always',
    meta: { showErrorDialog: true, loadSubsetOptions: {} },
  });

  const skipFlows =
    filters.typeFilter.length > 0 && !filters.typeFilter.includes('flow');
  const skipTables =
    filters.typeFilter.length > 0 && !filters.typeFilter.includes('table');

  const rootFlowsQuery = createQuery(() => ({
    queryKey: ['root-flows', projectId, filters],
    queryFn: () =>
      flowsApi.list({
        projectId,
        folderId: isFiltered ? undefined : UncategorizedFolderId,
        limit: 1000,
        cursor: undefined,
        name: filters.searchTerm || undefined,
        status:
          filters.statusFilter.length > 0
            ? (filters.statusFilter as FlowStatus[])
            : undefined,
        connectionExternalIds:
          filters.connectionFilter.length > 0
            ? filters.connectionFilter
            : undefined,
      }),
    enabled: !skipFlows,
    staleTime: STALE_TIME,
    refetchOnMount: 'always',
    meta: { showErrorDialog: true, loadSubsetOptions: {} },
  }));

  const rootTablesQuery = createQuery(() => ({
    queryKey: ['root-tables', projectId, filters],
    queryFn: () =>
      tablesApi.list({
        projectId,
        folderId: isFiltered ? undefined : UncategorizedFolderId,
        limit: 1000,
        cursor: undefined,
        name: filters.searchTerm || undefined,
      }),
    enabled: !skipTables && !hideTables,
    staleTime: STALE_TIME,
    refetchOnMount: 'always',
    meta: { showErrorDialog: true, loadSubsetOptions: {} },
  }));

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const loadMoreInFolder = async (folderId: string) => {
      const contents = folderContentsQuery.data?.get(folderId);

      if (!contents) {
        setFolderVisibleCounts((prev) => {
          const next = new Map(prev);
          const current = next.get(folderId) ?? FOLDER_PAGE_SIZE;
          next.set(folderId, current + FOLDER_PAGE_SIZE);
          return next;
        });
        return;
      }

      const hasMoreFlows = !!contents.flowsNextCursor;
      const hasMoreTables = !hideTables && !!contents.tablesNextCursor;
      if (!hasMoreFlows && !hasMoreTables) {
        setFolderVisibleCounts((prev) => {
          const next = new Map(prev);
          const current = next.get(folderId) ?? FOLDER_PAGE_SIZE;
          next.set(folderId, current + FOLDER_PAGE_SIZE);
          return next;
        });
        return;
      }

      setLoadingFolders((prev) => new Set(prev).add(folderId));

      const [newFlows, newTables] = await Promise.all([
        hasMoreFlows
          ? flowsApi.list({
              projectId,
              folderId,
              limit: FOLDER_PAGE_SIZE,
              cursor: contents.flowsNextCursor!,
            })
          : Promise.resolve({
              data: [],
              next: null,
              previous: null,
            } as SeekPage<PopulatedFlow>),
        hasMoreTables
          ? tablesApi.list({
              projectId,
              folderId,
              limit: FOLDER_PAGE_SIZE,
              cursor: contents.tablesNextCursor!,
            })
          : Promise.resolve({
              data: [],
              next: null,
              previous: null,
            } as SeekPage<Table>),
      ]);

      queryClient.setQueryData<FolderContentsMap>(
        ['all-folder-contents', projectId, folderIds, hideTables],
        (old) => {
          if (!old) return old;
          const next = new Map(old);
          const existing = next.get(folderId)!;
          next.set(folderId, {
            flows: [...existing.flows, ...newFlows.data],
            tables: [...existing.tables, ...newTables.data],
            flowsNextCursor: newFlows.next,
            tablesNextCursor: newTables.next,
          });
          return next;
        },
      );

      setFolderVisibleCounts((prev) => {
        const next = new Map(prev);
        const current = next.get(folderId) ?? FOLDER_PAGE_SIZE;
        next.set(folderId, current + FOLDER_PAGE_SIZE);
        return next;
      });

      setLoadingFolders((prev) => {
        const next = new Set(prev);
        next.delete(folderId);
        return next;
      });
  };

  const nextRootPage = () => {
    setRootPage((prev) => prev + 1);
  };

  const prevRootPage = () => {
    setRootPage((prev) => Math.max(0, prev - 1));
  };

  const resetPagination = () => {
    setRootPage(0);
    setFolderVisibleCounts(new Map());
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setRootPage(0);
  };

  const { treeItems, totalPageItems } = createMemo(() => {
    let folders = foldersQuery.data ?? [];
    let rootFlows = rootFlowsQuery.data?.data ?? [];
    let rootTables = rootTablesQuery.data?.data ?? [];
    const folderContents = folderContentsQuery.data ?? new Map();
    const folderCounts = folderCountsQuery.data ?? new Map();

    const hasFolderFilter = filters.folderFilter.length > 0;

    if (isFiltered) {
      if (hasFolderFilter) {
        const folderSet = new Set(filters.folderFilter);
        rootFlows = rootFlows.filter(
          (f) => f.folderId && folderSet.has(f.folderId),
        );
        rootTables = rootTables.filter(
          (t) => t.folderId && folderSet.has(t.folderId),
        );
      }

      const { items, totalItems } = buildFilteredTreeItems(
        rootFlows,
        rootTables,
        folders,
        folderVisibleCounts,
        rootPage,
        pageSize,
        pinnedList,
        filters.searchTerm,
        folderContents,
        folderCounts,
      );
      return { treeItems: items, totalPageItems: totalItems };
    }

    if (hasFolderFilter) {
      const folderSet = new Set(filters.folderFilter);
      folders = folders.filter((f) => folderSet.has(f.id));
      rootFlows = [];
      rootTables = [];
    }

    const { items, totalRootItems } = buildTreeItems(
      folders,
      rootFlows,
      rootTables,
      folderContents,
      folderCounts,
      folderVisibleCounts,
      rootPage,
      pageSize,
      pinnedList,
    );

    return { treeItems: items, totalPageItems: totalRootItems };
  }, [
    foldersQuery.data,
    rootFlowsQuery.data,
    rootTablesQuery.data,
    folderContentsQuery.data,
    folderCountsQuery.data,
    folderVisibleCounts,
    rootPage,
    pageSize,
    isFiltered,
    filters.searchTerm,
    filters.folderFilter,
    pinnedList,
  ]);

  const hasFolderFilter = filters.folderFilter.length > 0;
  const effectiveExpandedFolders = createMemo(() => {
    if (!isFiltered && !hasFolderFilter) return expandedFolders;
    const all = new Set(expandedFolders);
    for (const item of treeItems) {
      if (item.type === 'folder') {
        all.add(item.id);
      }
    }
    return all;
  }, [isFiltered, hasFolderFilter, expandedFolders, treeItems]);

  const totalPages = Math.ceil(totalPageItems / pageSize);
  const isLoading =
    foldersQuery.isLoading ||
    (rootFlowsQuery.isLoading && !skipFlows) ||
    (rootTablesQuery.isLoading && !skipTables && !hideTables) ||
    folderContentsQuery.isLoading;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['folders'] });
    queryClient.invalidateQueries({ queryKey: ['root-flows'] });
    queryClient.invalidateQueries({ queryKey: ['root-tables'] });
    queryClient.invalidateQueries({ queryKey: ['all-folder-contents'] });
    queryClient.invalidateQueries({ queryKey: ['folder-counts'] });
  };

  const invalidateRoot = () => {
    queryClient.invalidateQueries({ queryKey: ['root-flows'] });
    queryClient.invalidateQueries({ queryKey: ['root-tables'] });
  };

  const invalidateFolder = (_folderId: string) => {
    queryClient.invalidateQueries({ queryKey: ['all-folder-contents'] });
    queryClient.invalidateQueries({ queryKey: ['folders'] });
    queryClient.invalidateQueries({ queryKey: ['folder-counts'] });
  };

  return {
    treeItems,
    folders: foldersQuery.data ?? [],
    rootFlows: rootFlowsQuery.data?.data ?? [],
    rootTables: rootTablesQuery.data?.data ?? [],
    isLoading,
    isFiltered,
    expandedFolders: effectiveExpandedFolders,
    loadingFolders,
    toggleFolder,
    loadMoreInFolder,
    rootPage,
    pageSize,
    changePageSize,
    totalPages,
    nextRootPage,
    prevRootPage,
    resetPagination,
    invalidateAll,
    invalidateRoot,
    invalidateFolder,
  };
}

type FolderContentsMap = Map<string, FolderContent>;

function buildFolderContentsMap(
  folders: FolderDto[],
  flowPages: SeekPage<PopulatedFlow>[],
  tablePages: SeekPage<Table>[],
): FolderContentsMap {
  return new Map(
    folders.map((folder, i) => [
      folder.id,
      {
        flows: flowPages[i].data,
        tables: tablePages[i].data,
        flowsNextCursor: flowPages[i].next,
        tablesNextCursor: tablePages[i].next,
      },
    ]),
  );
}

function emptyTablePage(): SeekPage<Table> {
  return { data: [], next: null, previous: null };
}

const STALE_TIME = 30_000;
