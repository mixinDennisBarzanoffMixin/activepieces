import { isNil } from '@activepieces/shared';
import { createQuery } from '@tanstack/solid-query';

import { useEmbedding } from '@/components/providers/embed-provider';
import { api } from '@/lib/api';
const defaultFont = 'Roboto';
const useDownloadEmbeddingFont = () => {
  const { embedState } = useEmbedding();
  createQuery(() => ({
    queryKey: ['font', embedState.fontFamily, embedState.fontUrl],
    queryFn: async () => {
      try {
        if (
          embedState.isEmbedded &&
          !isNil(embedState.fontUrl) &&
          !isNil(embedState.fontFamily)
        ) {
          return api.get(embedState.fontUrl).then(() => {
            const link = document.createElement('link');
            link.href = embedState.fontUrl!;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
            const fontFamilySplit = embedState
              .fontFamily!.split(',')
              .map((font) => `"${font}"`)
              .join(',');
            document.body.style.fontFamily = `${fontFamilySplit}, Roboto, sans-serif`;
            return embedState.fontFamily!;
          });
        }
        if (
          embedState.isEmbedded &&
          ((isNil(embedState.fontUrl) && !isNil(embedState.fontFamily)) ||
            (isNil(embedState.fontFamily) && !isNil(embedState.fontUrl)))
        ) {
          console.warn('fontUrl or fontFamily is not set, using default font', {
            fontUrl: embedState.fontUrl,
            fontFamily: embedState.fontFamily,
          });
        }
      } catch (error) {
        console.error(error);
        return defaultFont;
      }
      return defaultFont;
    },
  }));
};
const EmbeddingFontLoader = (props: { children: JSX.Element }) => {
  useDownloadEmbeddingFont();

  return <>{props.children}</>;
};

export { EmbeddingFontLoader };
