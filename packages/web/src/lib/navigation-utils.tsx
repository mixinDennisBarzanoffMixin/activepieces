import { useEmbedding } from '@/components/providers/embed-provider';

export const useNewWindow = () => {
  const { embedState } = useEmbedding();
  if (embedState.isEmbedded) {
    return (route: string, searchParams?: string) =>
      window.location.assign(`${route}${searchParams ? '?' + searchParams : ''}`);
  }

  return (route: string, searchParams?: string) =>
    window.open(
      `${route}${searchParams ? '?' + searchParams : ''}`,
      '_blank',
      'noopener noreferrer',
    );
};

export const FROM_QUERY_PARAM = 'from';
/**State param is for oauth2 flow, it is used to redirect to the page after login*/
export const STATE_QUERY_PARAM = 'state';
export const LOGIN_QUERY_PARAM = 'activepiecesLogin';
export const PROVIDER_NAME_QUERY_PARAM = 'providerName';

export const useDefaultRedirectPath = () => {
  return '/flows';
};

export const useRedirectAfterLogin = () => {
  const defaultRedirectPath = useDefaultRedirectPath();
  const from = new URLSearchParams(window.location.search).get(FROM_QUERY_PARAM);
  return () => window.location.assign(from || defaultRedirectPath);
};
