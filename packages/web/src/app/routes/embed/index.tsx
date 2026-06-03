import { AuthenticationResponse } from '@activepieces/shared';
import { createMutation } from '@tanstack/solid-query';
import {
  ActivepiecesClientAuthenticationFailed,
  ActivepiecesClientAuthenticationSuccess,
  ActivepiecesClientConfigurationFinished,
  ActivepiecesClientEventName,
  ActivepiecesClientInit,
  ActivepiecesVendorEventName,
  ActivepiecesVendorInit,
  ActivepiecesVendorRouteChanged,
} from 'ee-embed-sdk';
import i18n from 'i18next';
import { createEffect } from 'solid-js';

import { LoadingScreen } from '@/components/custom/loading-screen';
import { useEmbedding } from '@/components/providers/embed-provider';
import { useTheme } from '@/components/providers/theme-provider';
import { managedAuthApi } from '@/features/authentication';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { combinePaths, parentWindow } from '@/lib/dom-utils';
import {
  determineDefaultRoute,
  routesThatRequireProjectId,
} from '@/lib/route-utils';

const notifyVendorPostAuthentication = () => {
  const authenticationSuccessEvent: ActivepiecesClientAuthenticationSuccess = {
    type: ActivepiecesClientEventName.CLIENT_AUTHENTICATION_SUCCESS,
    data: {},
  };
  parentWindow.postMessage(authenticationSuccessEvent, '*');
  const configurationFinishedEvent: ActivepiecesClientConfigurationFinished = {
    type: ActivepiecesClientEventName.CLIENT_CONFIGURATION_FINISHED,
    data: {},
  };
  parentWindow.postMessage(configurationFinishedEvent, '*');
};

const handleVendorNavigation = ({ projectId }: { projectId: string }) => {
  const handleVendorRouteChange = (
    event: MessageEvent<ActivepiecesVendorRouteChanged>,
  ) => {
    if (
      event.source === parentWindow &&
      event.data.type === ActivepiecesVendorEventName.VENDOR_ROUTE_CHANGED
    ) {
      const targetRoute = event.data.data.vendorRoute;
      const targetRouteRequiresProjectId = Object.values(
        routesThatRequireProjectId,
      ).some((route) => targetRoute.includes(route));
      if (!targetRouteRequiresProjectId) {
        window.history.pushState(null, '', targetRoute);
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else {
        window.history.pushState(
          null,
          '',
          combinePaths({
            secondPath: targetRoute,
            firstPath: `/projects/${projectId}`,
          }),
        );
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  };
  window.addEventListener('message', handleVendorRouteChange);
};

const handleClientNavigation = () => {
  const handle = () => {
    const pathNameWithoutProjectOrProjectId = window.location.pathname.replace(
      /\/projects\/[^/]+/,
      '',
    );
    parentWindow.postMessage(
      {
        type: ActivepiecesClientEventName.CLIENT_ROUTE_CHANGED,
        data: {
          route: pathNameWithoutProjectOrProjectId + window.location.search,
        },
      },
      '*',
    );
  };
  window.addEventListener('popstate', handle);
};

const EmbedPage = () => {
  const { setEmbedState, embedState } = useEmbedding();
  const { mutateAsync } = createMutation<
    AuthenticationResponse,
    Error,
    {
      externalAccessToken: string;
      locale: string;
    }
  >({
    mutationFn: async ({
      externalAccessToken,
      locale,
    }: {
      externalAccessToken: string;
      locale: string;
    }) => {
      const data = await managedAuthApi.generateApToken({
        externalAccessToken,
      });
      await i18n.changeLanguage(locale);
      return data;
    },
  });
  const { setTheme } = useTheme();
  const { checkAccess } = useAuthorization();
  const initState = (event: MessageEvent<ActivepiecesVendorInit>) => {
    if (
      event.source === parentWindow &&
      event.data.type === ActivepiecesVendorEventName.VENDOR_INIT
    ) {
      if (event.data.data.jwtToken) {
        if (event.data.data.mode) {
          setTheme(event.data.data.mode);
        }
        void mutateAsync(
          {
            externalAccessToken: event.data.data.jwtToken,
            locale: event.data.data.locale ?? 'en',
          },
          {
            onSuccess: (data) => {
              authenticationSession.saveResponse(data, true);
              const configuredRoute = event.data.data.initialRoute ?? '/';

              const defaultRoute = determineDefaultRoute(checkAccess);
              const initialRoute =
                configuredRoute === '/' ? defaultRoute : configuredRoute;
              setEmbedState({
                hideSideNav: event.data.data.hideSidebar,
                isEmbedded: true,
                hideFlowNameInBuilder:
                  event.data.data.hideFlowNameInBuilder ?? false,
                disableNavigationInBuilder:
                  event.data.data.disableNavigationInBuilder !== false,
                hideFolders: event.data.data.hideFolders ?? false,
                hideTables: event.data.data.hideTables ?? false,
                sdkVersion: event.data.data.sdkVersion,
                fontUrl: event.data.data.fontUrl,
                fontFamily: event.data.data.fontFamily,
                useDarkBackground:
                  initialRoute.startsWith('/embed/connections'),
                hideExportAndImportFlow:
                  event.data.data.hideExportAndImportFlow ?? false,
                hideHomeButtonInBuilder:
                  event.data.data.disableNavigationInBuilder ===
                  'keep_home_button_only'
                    ? false
                    : event.data.data.disableNavigationInBuilder,
                emitHomeButtonClickedEvent:
                  event.data.data.emitHomeButtonClickedEvent ?? false,
                homeButtonIcon: event.data.data.homeButtonIcon ?? 'logo',
                hideDuplicateFlow: event.data.data.hideDuplicateFlow ?? false,
                hideFlowsPageNavbar:
                  event.data.data.hideFlowsPageNavbar ?? false,
                hidePageHeader: event.data.data.hidePageHeader ?? false,
              });
              window.history.pushState(null, '', initialRoute);
              window.dispatchEvent(new PopStateEvent('popstate'));
              if (data.projectId) {
                handleVendorNavigation({ projectId: data.projectId });
              }
              handleClientNavigation();
              notifyVendorPostAuthentication();
            },
            onError: (error) => {
              const errorEvent: ActivepiecesClientAuthenticationFailed = {
                type: ActivepiecesClientEventName.CLIENT_AUTHENTICATION_FAILED,
                data: error,
              };
              parentWindow.postMessage(errorEvent, '*');
            },
          },
        );
      } else {
        console.error('Token sent via the sdk is empty');
      }
    }
  };

  createEffect(() => {
    const event: ActivepiecesClientInit = {
      type: ActivepiecesClientEventName.CLIENT_INIT,
      data: {},
    };
    parentWindow.postMessage(event, '*');
    window.addEventListener('message', initState);
    return () => {
      window.removeEventListener('message', initState);
    };
  });
  return <LoadingScreen brightSpinner={embedState.useDarkBackground} />;
};

export { EmbedPage };
