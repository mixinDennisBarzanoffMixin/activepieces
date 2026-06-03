import {
  OAuth2Property,
  PieceAuthProperty,
  PropertyType,
  DEFAULT_CONNECTION_DISPLAY_NAME,
  OAuth2Props,
} from '@activepieces/pieces-framework';
import {
  AppConnectionType,
  BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE,
  OAuth2GrantType,
} from '@activepieces/shared';
import deepEqual from 'deep-equal';
import { t } from 'i18next';

import {
  RadioGroupList,
  RadioGroupListItem,
} from '@/components/custom/radio-group-list';
import { Button } from '@/components/ui/button';
import {
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  oauth2Utils,
  type OAuth2App,
  type PiecesOAuth2AppsMap,
} from '@/features/connections/utils/oauth2-utils';
import { formatUtils } from '@/lib/format-utils';

export function MutliAuthList(props: MutliAuthListProps) {
  const authItems: RadioGroupListItem<AuthListItem>[] = props.pieceAuth.flatMap(
    (auth) => {
      const displayName = getDisplayName(auth);
      if (auth.type === PropertyType.OAUTH2) {
        const predefinedOAuth2App = oauth2Utils.getPredefinedOAuth2App(
          props.piecesOAuth2AppsMap,
          props.pieceName,
        );
        return createOAuth2Options(auth, predefinedOAuth2App);
      }

      return {
        label: displayName,
        value: { authProperty: auth, grantType: null, oauth2App: null },
        description: '',
      };
    },
  );

  const selectedOption = authItems.find((auth) =>
    deepEqual(auth.value, props.selectedItem),
  );

  return (
    <>
      <DialogHeader class="mb-0">
        <DialogTitle class="px-5">
          <div class="flex items-center gap-2">
            {t('Select an Authentication Method')}
          </div>
        </DialogTitle>
      </DialogHeader>
      <RadioGroupList
        class="px-5 mt-5"
        items={authItems}
        onInput={props.setSelectedItem}
        value={selectedOption?.value ?? null}
      />
      <DialogFooter class="mt-4">
        <div class="mx-5 w-full flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">{t('Cancel')}</Button>
          </DialogClose>
          <Button variant="default" onClick={() => props.confirmSelectedItem()}>
            {t('Next')}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

const getDisplayName = (auth: PieceAuthProperty): string => {
  if (
    auth.displayName !== DEFAULT_CONNECTION_DISPLAY_NAME &&
    auth.type !== PropertyType.OAUTH2
  ) {
    return auth.displayName;
  } else if (auth.type === PropertyType.OAUTH2) {
    return 'OAuth2';
  }
  return formatUtils.convertEnumToHumanReadable(auth.type);
};

function createOAuth2Options(
  auth: OAuth2Property<OAuth2Props>,
  predefinedOAuth2App: OAuth2App | null,
): RadioGroupListItem<AuthListItem>[] {
  const options: RadioGroupListItem<AuthListItem>[] = [];
  const grantType = auth.grantType ?? OAuth2GrantType.AUTHORIZATION_CODE;

  const emptyOAuth2App: OAuth2App = {
    oauth2Type: AppConnectionType.OAUTH2,
    clientId: null,
  };

  const canConnectWithPredefinedOAuth2App =
    predefinedOAuth2App &&
    (grantType === OAuth2GrantType.AUTHORIZATION_CODE ||
      grantType === BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE);
  if (canConnectWithPredefinedOAuth2App) {
    options.push({
      label: `OAuth2 (Recommended)`,
      value: {
        authProperty: auth,
        grantType: OAuth2GrantType.AUTHORIZATION_CODE,
        oauth2App: predefinedOAuth2App,
      },
      description: t(
        'Quickly connect using a preconfigured OAuth2 app. No setup required.',
      ),
    });
  }

  const canConnectWithOwnOAuth2App =
    grantType === OAuth2GrantType.AUTHORIZATION_CODE ||
    grantType === BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE;
  if (canConnectWithOwnOAuth2App) {
    options.push({
      label: `Custom OAuth2 App (Advanced)`,
      value: {
        authProperty: auth,
        grantType: OAuth2GrantType.AUTHORIZATION_CODE,
        oauth2App: emptyOAuth2App,
      },
      description: t(
        'Connect using your own OAuth2 credentials for more flexibility and control.',
      ),
    });
  }

  const canConnectWithClientCredentials =
    grantType === OAuth2GrantType.CLIENT_CREDENTIALS ||
    grantType === BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE;
  if (canConnectWithClientCredentials) {
    options.push({
      label: `Server-to-Server (Client Credentials)`,
      value: {
        authProperty: auth,
        grantType: OAuth2GrantType.CLIENT_CREDENTIALS,
        oauth2App: emptyOAuth2App,
      },
      description: t(
        'Authenticate securely from your server using the Client Credentials flow. Ideal for backend integrations.',
      ),
    });
  }

  return options;
}

export type AuthListItem =
  | {
      authProperty: Exclude<PieceAuthProperty, OAuth2Property<OAuth2Props>>;
      grantType: null;
      oauth2App: null;
    }
  | {
      authProperty: OAuth2Property<OAuth2Props>;
      grantType: OAuth2GrantType;
      oauth2App: OAuth2App;
    };

type MutliAuthListProps = {
  pieceAuth: PieceAuthProperty[];
  setSelectedItem: (auth: AuthListItem) => void;
  confirmSelectedItem: () => void;
  piecesOAuth2AppsMap: PiecesOAuth2AppsMap;
  selectedItem: AuthListItem;
  pieceName: string;
};
