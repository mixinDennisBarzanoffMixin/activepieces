import {
  getAuthPropertyForValue,
  PieceAuthProperty,
  PiecePropertyMap,
  PieceMetadataModel,
  PieceMetadataModelSummary,
  PropertyType,
} from '@activepieces/pieces-framework';
import {
  ApFlagId,
  AppConnectionScope,
  AppConnectionType,
  AppConnectionWithoutSensitiveData,
  BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE,
  isNil,
  UpsertAppConnectionRequestBody,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  createMemo,
  createSignal,
  For,
  Match,
  Show,
  Switch,
  untrack,
} from 'solid-js';

import { ApMarkdown } from '@/components/custom/markdown';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormError } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SkeletonList } from '@/components/ui/skeleton';
import { appConnectionsMutations } from '@/features/connections/hooks/app-connections-hooks';
import { oauthAppsQueries } from '@/features/connections/hooks/oauth-apps-hooks';
import {
  oauth2Utils,
  type PiecesOAuth2AppsMap,
} from '@/features/connections/utils/oauth2-utils';
import { newConnectionUtils } from '@/features/connections/utils/utils';
import { formUtils } from '@/features/pieces';
import { ProjectSelector } from '@/features/projects/components/projects-selector';
import { flagsHooks } from '@/hooks/flags-hooks';

import { BasicAuthConnectionSettings } from './basic-secret-connection-settings';
import {
  ErrorMap,
  getPath,
  issues,
  setPath,
  SolidConnectionForm,
} from './connection-form';
import { MutliAuthList, AuthListItem } from './multi-auth-list';
import { OAuth2ConnectionSettings } from './oauth2-connection-settings';
import { SecretInput } from './secret-input';
import { SecretTextConnectionSettings } from './secret-text-connection-settings';

function CreateOrEditConnectionSection(
  props: CreateOrEditConnectionSectionProps,
) {
  const { data: redirectUrl } = flagsHooks.useFlag<string>(
    ApFlagId.THIRD_PARTY_AUTH_PROVIDER_REDIRECT_URL,
  );
  const blank = () => {
    if (!isNil(redirectUrl)) {
      return redirectUrl;
    }
    return '';
  };
  const schema = createMemo(() =>
    formUtils.buildConnectionSchema(props.selectedAuth.authProperty, {
      isGlobalConnection: props.isGlobalConnection,
      showConnectionNameField:
        isNil(props.externalIdComingFromSdk) ||
        props.externalIdComingFromSdk === '',
    }),
  );
  const initial = () =>
    untrack(() => {
      const name = newConnectionUtils.getConnectionName(
        props.piece,
        props.reconnectConnection,
        props.externalIdComingFromSdk,
      );
      return {
        request: {
          ...newConnectionUtils.createDefaultValues({
            auth: props.selectedAuth.authProperty,
            suggestedExternalId: name.externalId,
            suggestedDisplayName: name.displayName,
            pieceName: props.piece.name,
            oauth2App: props.selectedAuth.oauth2App,
            grantType: props.selectedAuth.grantType,
            redirectUrl: blank(),
            projectId: props.projectId,
          }),
          ...(props.isGlobalConnection
            ? { scope: AppConnectionScope.PLATFORM }
            : {}),
          projectIds: props.reconnectConnection
            ? props.reconnectConnection.projectIds
            : [],
          preSelectForNewProjects: false,
          pieceVersion: props.piece.version,
        },
      };
    });
  const [values, setValues] = createSignal<ConnectionFormValues>(initial());
  const [errors, setErrors] = createSignal<ErrorMap>({});
  const form: SolidConnectionForm<ConnectionFormValues> = {
    values,
    errors,
    getValue: (path) => getPath(values(), path),
    getValues: values,
    setValue: (path, value) => {
      setValues((prev) => setPath(prev, path, value));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[path];
        return next;
      });
    },
    setError: (path, error) =>
      setErrors((prev) => ({ ...prev, [path]: error.message })),
    clearError: (path) =>
      setErrors((prev) => {
        const next = { ...prev };
        delete next[path];
        return next;
      }),
    validate: () => {
      const result = schema().safeParse(values());
      if (result.success) {
        setErrors({});
        return result.data as ConnectionFormValues;
      }
      setErrors(issues(result.error));
      return null;
    },
  };

  const [errorMessage, setErrorMessage] = createSignal('');

  const { mutate: upsertConnection, isPending } = untrack(() =>
    appConnectionsMutations.useUpsertAppConnection({
      isGlobalConnection: props.isGlobalConnection,
      reconnectConnection: props.reconnectConnection,
      externalIdComingFromSdk: props.externalIdComingFromSdk,
      setErrorMessage,
      form,
      setOpen: props.setOpen,
    }),
  );

  return (
    <>
      <DialogHeader class="mb-0">
        <DialogTitle class="px-5">
          <div class="flex items-center gap-2">
            {props.reconnectConnection
              ? t('Reconnect {displayName} Connection', {
                  displayName: props.reconnectConnection.displayName,
                })
              : t('Connect to {displayName}', {
                  displayName: props.piece.displayName,
                })}
          </div>
        </DialogTitle>
      </DialogHeader>

      <form
        class="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (form.validate()) {
            upsertConnection();
          }
        }}
      >
        <ScrollArea
          class="px-2"
          viewPortClassName="max-h-[calc(70vh-180px)] px-4 py-2 mb-1"
        >
          {' '}
          <ApMarkdown
            markdown={props.selectedAuth.authProperty.description}
            variables={{
              redirectUrl: blank(),
            }}
          />
          <Show when={props.selectedAuth.authProperty.description}>
            <Separator class="my-4" />
          </Show>
          <Show
            when={
              isNil(props.externalIdComingFromSdk) ||
              props.externalIdComingFromSdk === ''
            }
          >
            <div class="flex flex-col gap-2">
              <Label for="displayName" showRequiredIndicator>
                {t('Connection Name')}
              </Label>
              <Input
                value={String(form.getValue('request.displayName') ?? '')}
                onInput={(e) =>
                  form.setValue('request.displayName', e.currentTarget.value)
                }
                required
                id="displayName"
                type="text"
                placeholder={t('Connection name')}
              />
              <Show when={errors()['request.displayName']}>
                <p class="text-sm font-medium text-destructive wrap-break-word">
                  {t(errors()['request.displayName'])}
                </p>
              </Show>
            </div>
          </Show>
          <Show
            when={props.isGlobalConnection && isNil(props.reconnectConnection)}
          >
            <div class="my-4 flex flex-col gap-4">
              <ProjectSelector
                value={form.getValue('request.projectIds') as string[]}
                onInput={(value) => form.setValue('request.projectIds', value)}
              />
              <div class="flex flex-row items-center gap-3">
                <Checkbox
                  id="preSelectForNewProjects"
                  checked={Boolean(
                    form.getValue('request.preSelectForNewProjects'),
                  )}
                  onCheckedChange={(value) =>
                    form.setValue(
                      'request.preSelectForNewProjects',
                      value === true,
                    )
                  }
                />
                <Label for="preSelectForNewProjects" class="cursor-pointer">
                  {t('Include by default in new projects')}
                </Label>
              </div>
              <Show when={isNil(props.reconnectConnection)}>
                <div>
                  <Label>{t('External ID')}</Label>
                  <Input
                    value={String(form.getValue('request.externalId') ?? '')}
                    onInput={(e) =>
                      form.setValue('request.externalId', e.currentTarget.value)
                    }
                  />
                </div>
              </Show>
            </div>
          </Show>
          <div class="mt-3.5">
            <ConnectionSettings
              selectedAuth={props.selectedAuth}
              piece={props.piece}
              form={form}
            />
          </div>
        </ScrollArea>
        <Show when={errorMessage()}>
          <FormError
            formMessageId="create-connection-server-error-message"
            class="text-left px-6"
          >
            {errorMessage()}
          </FormError>
        </Show>
        <DialogFooter class="mt-0">
          <div class="mx-5 flex gap-2 w-full">
            <Show when={props.showTryAnotherMethodButton}>
              <Button
                variant="outline"
                type="button"
                onClick={props.onTryAnotherMethodButtonClicked}
              >
                {t('Try another method')}
              </Button>
            </Show>
            <div class="grow" />
            <DialogClose asChild>
              <Button variant="outline">{t('Cancel')}</Button>
            </DialogClose>
            <Button loading={isPending} type="submit">
              {t('Save')}
            </Button>
          </div>
        </DialogFooter>
      </form>
    </>
  );
}
function ConnectionSettings(props: ConnectionSettingsProps) {
  return (
    <Switch>
      <Match
        when={props.selectedAuth.authProperty.type === PropertyType.SECRET_TEXT}
      >
        <SecretTextConnectionSettings
          authProperty={props.selectedAuth.authProperty}
          form={props.form}
        />
      </Match>
      <Match
        when={props.selectedAuth.authProperty.type === PropertyType.BASIC_AUTH}
      >
        <BasicAuthConnectionSettings
          authProperty={props.selectedAuth.authProperty}
          form={props.form}
        />
      </Match>
      <Match
        when={props.selectedAuth.authProperty.type === PropertyType.CUSTOM_AUTH}
      >
        <ConnectionPropertiesForm
          form={props.form}
          prefix="request.value.props"
          props={propertyMap(props.selectedAuth.authProperty.props)}
        />
      </Match>
      <Match
        when={props.selectedAuth.authProperty.type === PropertyType.OAUTH2}
      >
        <Show
          when={
            !isNil(props.selectedAuth.grantType) &&
            !isNil(props.selectedAuth.oauth2App)
          }
          fallback={<div>Error: Grant type and OAuth2 app are required</div>}
        >
          <OAuth2ConnectionSettings
            authProperty={props.selectedAuth.authProperty}
            piece={props.piece}
            grantType={props.selectedAuth.grantType}
            oauth2App={props.selectedAuth.oauth2App}
            form={props.form}
          />
          <ConnectionPropertiesForm
            form={props.form}
            prefix="request.value.props"
            props={propertyMap(props.selectedAuth.authProperty.props)}
          />
        </Show>
      </Match>
    </Switch>
  );
}

function ConnectionPropertiesForm(props: ConnectionPropertiesFormProps) {
  return (
    <div class="flex flex-col gap-4">
      <For each={Object.entries(props.props)}>
        {([name, prop]) => {
          const path = `${props.prefix}.${name}`;
          if (prop.type === PropertyType.MARKDOWN) {
            return <ApMarkdown markdown={prop.description} variables={{}} />;
          }
          return (
            <div class="flex flex-col gap-2">
              <Label showRequiredIndicator={prop.required}>
                {prop.displayName}
              </Label>
              <SecretInput
                value={String(props.form.getValue(path) ?? '')}
                onInput={(value) => props.form.setValue(path, value)}
                type={
                  prop.type === PropertyType.SECRET_TEXT ? 'password' : 'text'
                }
              />
              <Show when={prop.description}>
                <p class="text-sm text-muted-foreground">{prop.description}</p>
              </Show>
            </div>
          );
        }}
      </For>
    </div>
  );
}

function propertyMap(props: unknown): PiecePropertyMap {
  if (!props || typeof props !== 'object' || Array.isArray(props)) {
    return {};
  }
  return props as PiecePropertyMap;
}

function CreateOrEditConnectionDialogContent(
  props: CreateOrEditConnectionDialogContentProps,
) {
  const [selectedAuth, setSelectedAuth] = createSignal<AuthListItem | null>(
    untrack(() => {
      if (isNil(props.piece.auth)) {
        return null;
      }
      return getInitiallySelectedAuthListItem(
        props.piece.auth,
        props.reconnectConnection,
        props.piecesOAuth2AppsMap,
        props.piece.name,
      );
    }),
  );
  const [showMultiAuthList, setShowMultiAuthList] = createSignal(false);
  const auth = createMemo(() => props.piece.auth);
  const has = createMemo(
    () =>
      !isNil(auth()) &&
      !isNil(
        oauth2Utils.getPredefinedOAuth2App(
          props.piecesOAuth2AppsMap,
          props.piece.name,
        ),
      ),
  );
  const many = createMemo(() => {
    if (isNil(auth())) {
      return false;
    }
    return (
      Array.isArray(auth()) ||
      doesAuthPropertySupportBothGrantTypes(auth()!) ||
      has()
    );
  });
  return (
    <Show when={auth()}>
      <Show when={!showMultiAuthList() && selectedAuth()}>
        <CreateOrEditConnectionSection
          {...props}
          selectedAuth={selectedAuth()}
          onTryAnotherMethodButtonClicked={() => setShowMultiAuthList(true)}
          showTryAnotherMethodButton={many()}
        />
      </Show>
      <Show when={showMultiAuthList() && many() && selectedAuth()}>
        {(item) => (
          <MutliAuthList
            pieceName={props.piece.name}
            piecesOAuth2AppsMap={props.piecesOAuth2AppsMap}
            selectedItem={item()}
            pieceAuth={Array.isArray(auth()) ? auth() : [auth()!]}
            setSelectedItem={setSelectedAuth}
            confirmSelectedItem={() => {
              setShowMultiAuthList(false);
            }}
          />
        )}
      </Show>
    </Show>
  );
}

function CreateOrEditConnectionDialog(props: ConnectionDialogProps) {
  const { data: piecesOAuth2AppsMap, isPending: loadingPiecesOAuth2AppsMap } =
    oauthAppsQueries.usePiecesOAuth2AppsMap();
  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => props.setOpen(open)}
      key={props.piece.name}
    >
      <DialogContent
        onInteractOutside={(e: Event) => e.preventDefault()}
        class="max-h-[70vh] px-0  min-w-[450px] max-w-[450px] lg:min-w-[650px] lg:max-w-[650px] overflow-y-auto"
      >
        <Show
          when={loadingPiecesOAuth2AppsMap && hasOAuth2PieceAuth(props.piece)}
          fallback={
            <CreateOrEditConnectionDialogContent
              piece={props.piece}
              piecesOAuth2AppsMap={piecesOAuth2AppsMap ?? {}}
              setOpen={props.setOpen}
              reconnectConnection={props.reconnectConnection}
              isGlobalConnection={props.isGlobalConnection}
              externalIdComingFromSdk={props.externalIdComingFromSdk}
              projectId={props.projectId}
            />
          }
        >
          <>
            <DialogHeader class="mb-0">
              <DialogTitle class="px-5">
                <div class="flex items-center gap-2">
                  {props.reconnectConnection
                    ? t('Reconnect {displayName} Connection', {
                        displayName: props.reconnectConnection.displayName,
                      })
                    : t('Connect to {displayName}', {
                        displayName: props.piece.displayName,
                      })}
                </div>
              </DialogTitle>
            </DialogHeader>
            <SkeletonList numberOfItems={4} class="h-7 mt-2" />
          </>
        </Show>
      </DialogContent>
    </Dialog>
  );
}
function hasOAuth2PieceAuth(
  piece: PieceMetadataModelSummary | PieceMetadataModel,
) {
  if (isNil(piece.auth)) {
    return false;
  }
  if (Array.isArray(piece.auth)) {
    return piece.auth.some((auth) => auth.type === PropertyType.OAUTH2);
  }
  return piece.auth.type === PropertyType.OAUTH2;
}

export { CreateOrEditConnectionDialog, CreateOrEditConnectionDialogContent };

function getInitallySelectedAuthProperty(
  auth: PieceAuthProperty[] | PieceAuthProperty,
  reconnectConnection: AppConnectionWithoutSensitiveData | null,
): PieceAuthProperty | undefined {
  if (Array.isArray(auth)) {
    if (reconnectConnection) {
      return getAuthPropertyForValue({
        authValueType: reconnectConnection.type,
        pieceAuth: auth,
      });
    }
    return auth.at(0);
  }
  return auth;
}

function getInitiallySelectedAuthListItem(
  auth: PieceAuthProperty[] | PieceAuthProperty,
  reconnectConnection: AppConnectionWithoutSensitiveData | null,
  piecesOAuth2AppsMap: PiecesOAuth2AppsMap,
  pieceName: string,
): AuthListItem | null {
  const authProperty = getInitallySelectedAuthProperty(
    auth,
    reconnectConnection,
  );
  if (!authProperty) {
    return null;
  }
  if (authProperty.type === PropertyType.OAUTH2) {
    return {
      authProperty,
      grantType: oauth2Utils.getGrantType(authProperty),
      oauth2App: oauth2Utils.getPredefinedOAuth2App(
        piecesOAuth2AppsMap,
        pieceName,
      ) ?? {
        oauth2Type: AppConnectionType.OAUTH2,
        clientId: null,
      },
    };
  }
  return {
    authProperty,
    grantType: null,
    oauth2App: null,
  };
}
function doesAuthPropertySupportBothGrantTypes(
  authProperty: PieceAuthProperty | PieceAuthProperty[],
): boolean {
  if (Array.isArray(authProperty)) {
    return authProperty.some(doesAuthPropertySupportBothGrantTypes);
  }
  return (
    authProperty.type === PropertyType.OAUTH2 &&
    authProperty.grantType === BOTH_CLIENT_CREDENTIALS_AND_AUTHORIZATION_CODE
  );
}
type ConnectionDialogProps = {
  piece: PieceMetadataModelSummary | PieceMetadataModel;
  open: boolean;
  setOpen: (
    open: boolean,
    connection?: AppConnectionWithoutSensitiveData,
  ) => void;
  reconnectConnection: AppConnectionWithoutSensitiveData | null;
  isGlobalConnection: boolean;
  externalIdComingFromSdk?: string | null;
  projectId?: string | null;
};

type CreateOrEditConnectionDialogContentProps = {
  piece: PieceMetadataModelSummary | PieceMetadataModel;
  piecesOAuth2AppsMap: PiecesOAuth2AppsMap;
  reconnectConnection: AppConnectionWithoutSensitiveData | null;
  isGlobalConnection: boolean;
  externalIdComingFromSdk?: string | null;
  setOpen: (
    open: boolean,
    connection?: AppConnectionWithoutSensitiveData,
  ) => void;
  projectId?: string | null;
};

type CreateOrEditConnectionSectionProps =
  CreateOrEditConnectionDialogContentProps & {
    onTryAnotherMethodButtonClicked: () => void;
    showTryAnotherMethodButton: boolean;
    selectedAuth: AuthListItem;
  };

type ConnectionSettingsProps = {
  piece: PieceMetadataModelSummary | PieceMetadataModel;
  selectedAuth: AuthListItem;
  form: SolidConnectionForm<ConnectionFormValues>;
};

type ConnectionPropertiesFormProps = {
  form: SolidConnectionForm<ConnectionFormValues>;
  prefix: string;
  props: PiecePropertyMap;
};

type ConnectionFormValues = {
  request: UpsertAppConnectionRequestBody & {
    projectIds: string[];
    preSelectForNewProjects: boolean;
    scope?: AppConnectionScope;
  };
};
