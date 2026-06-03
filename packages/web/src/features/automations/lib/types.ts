import {
  FolderDto,
  PopulatedFlow,
  SeekPage,
  Table,
} from '@activepieces/shared';

export type TreeItemType = 'folder' | 'flow' | 'table' | 'load-more-folder';

export type SelectableItemType = 'folder' | 'flow' | 'table';

export type SelectedItemsMap = Map<string, SelectableItemType>;

type TreeItemBase = {
  id: string;
  name: string;
  depth: number;
  folderId: string | null;
};

export type TreeItem =
  | (TreeItemBase & {
      type: 'folder';
      data: FolderDto;
      childCount: number;
    })
  | (TreeItemBase & {
      type: 'flow';
      data: PopulatedFlow;
    })
  | (TreeItemBase & {
      type: 'table';
      data: Table;
    })
  | (TreeItemBase & {
      type: 'load-more-folder';
      data: null;
      loadMoreCount: number;
    });

export type AutomationsFilters = {
  searchTerm: string;
  typeFilter: string[];
  statusFilter: string[];
  connectionFilter: string[];
  ownerFilter: string[];
  folderFilter: string[];
};

export type FolderContent = {
  flows: PopulatedFlow[];
  tables: Table[];
  flowsNextCursor: string | null;
  tablesNextCursor: string | null;
};

export type RootPage = {
  flows: SeekPage<PopulatedFlow>;
  tables: SeekPage<Table>;
};
