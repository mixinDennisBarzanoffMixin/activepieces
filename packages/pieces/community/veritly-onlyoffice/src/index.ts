import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { appendRow } from './lib/actions/append-row';
import { downloadDocument } from './lib/actions/download-document';
import { findRows } from './lib/actions/find-rows';
import { getRows } from './lib/actions/get-rows';
import { updateCell } from './lib/actions/update-cell';
import { newRowAdded } from './lib/triggers/new-row-added';
import { chartChanged } from './lib/triggers/chart-changed';
import { rowChanged } from './lib/triggers/row-changed';

export const veritlyOnlyOffice = createPiece({
  displayName: 'Veritly Spreadsheets',
  description: 'Trigger flows from Veritly chart and sheet changes, then export refreshed live documents.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-sheets.png',
  authors: ['mixinDennisBarzanoffMixin'],
  categories: [PieceCategory.PRODUCTIVITY],
  auth: PieceAuth.None(),
  actions: [downloadDocument, appendRow, updateCell, getRows, findRows],
  triggers: [chartChanged, newRowAdded, rowChanged],
});
