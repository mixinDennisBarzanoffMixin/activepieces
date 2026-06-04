import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { appendRow } from './lib/actions/append-row';
import { findRows } from './lib/actions/find-rows';
import { getRows } from './lib/actions/get-rows';
import { updateCell } from './lib/actions/update-cell';
import { newRowAdded } from './lib/triggers/new-row-added';
import { rowChanged } from './lib/triggers/row-changed';

export const veritlyUniver = createPiece({
  displayName: 'Veritly Univer',
  description: 'Trigger flows from Veritly Univer sheet changes and update workbook rows.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-sheets.png',
  authors: ['mixinDennisBarzanoffMixin'],
  categories: [PieceCategory.PRODUCTIVITY],
  auth: PieceAuth.None(),
  actions: [appendRow, updateCell, getRows, findRows],
  triggers: [newRowAdded, rowChanged],
});
