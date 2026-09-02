import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { downloadDocument } from './lib/actions/download-document';
import { newRowAdded } from './lib/triggers/new-row-added';
import { rowChanged } from './lib/triggers/row-changed';

export const veritlyOffice = createPiece({
  displayName: 'Veritly Spreadsheets',
  description: 'Trigger flows from Veritly sheet changes and export refreshed live documents.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/google-sheets.png',
  authors: ['mixinDennisBarzanoffMixin'],
  categories: [PieceCategory.PRODUCTIVITY],
  auth: PieceAuth.None(),
  actions: [downloadDocument],
  triggers: [newRowAdded, rowChanged],
});
