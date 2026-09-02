import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import {
  getJob,
  listDatasets,
  listPreps,
} from './lib/actions';

export const veritlyData = createPiece({
  displayName: 'Veritly Data',
  description: 'Inspect canonical project datasets, preparations, and durable data jobs.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/database.png',
  authors: ['mixinDennisBarzanoffMixin'],
  categories: [PieceCategory.PRODUCTIVITY],
  auth: PieceAuth.None(),
  actions: [listPreps, listDatasets, getJob],
  triggers: [],
});
