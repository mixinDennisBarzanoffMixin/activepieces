import { createAction } from '@activepieces/pieces-framework';
import { document as download } from '../common/client';
import { document } from '../common/props';

export const downloadDocument = createAction({
  name: 'download_document',
  displayName: 'Export Live Document',
  description: 'Export a DOCX or PPTX with every linked chart refreshed from its latest live data.',
  effect: 'non_idempotent',
  props: document,
  async run(context) {
    const id = context.propsValue.document_id;
    if (!id) throw new Error('Document ID is required');
    const file = await download({ server: context.server, id });
    return await context.files.write({
      fileName: file.name,
      data: Buffer.from(file.data),
    });
  },
});
