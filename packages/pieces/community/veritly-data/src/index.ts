import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import {
  deleteRow,
  insertRow,
  listDatasets,
  listPreps,
  listRows,
  publish,
  reconcile,
  updateRow,
  upsertRow,
  writeback,
} from './lib/actions';
import {
  publicationCompleted,
  publicationFailed,
  reconciliationConflictCreated,
  reconciliationConflictResolved,
  rowCreated,
  rowDeleted,
  rowUpdated,
} from './lib/triggers';

export const veritlyData = createPiece({
  displayName: 'Veritly Data',
  description: 'Automate row-level project data without exposing PostgreSQL credentials or raw SQL.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/database.png',
  authors: ['mixinDennisBarzanoffMixin'],
  categories: [PieceCategory.PRODUCTIVITY],
  auth: PieceAuth.None(),
  actions: [listPreps, listDatasets, listRows, insertRow, updateRow, deleteRow, upsertRow, publish, writeback, reconcile],
  triggers: [
    rowCreated,
    rowUpdated,
    rowDeleted,
    publicationCompleted,
    publicationFailed,
    reconciliationConflictCreated,
    reconciliationConflictResolved,
  ],
});
