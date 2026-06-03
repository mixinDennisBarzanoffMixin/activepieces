import { Match, Show, Switch } from 'solid-js';

import { FeatureKey, RequestTrial } from './request-trial';

type LockedFeatureGuardProps = {
  children: JSX.Element;
  locked: boolean;
  lockTitle: string;
  lockDescription: string;
  lockVideoUrl?: string;
  lockDocumentationUrl?: string;
  featureKey: FeatureKey;
  showContactSales?: boolean;
};

export const LockedFeatureGuard = (_props: LockedFeatureGuardProps) => {
  const props: LockedFeatureGuardProps = {
    ..._props,
    showContactSales: _props.showContactSales ?? true,
  };

  return (
    <Switch>
      <Match when={!props.locked}>{props.children}</Match>
      <Match when={props.locked}>
        <div class="flex w-full flex-col items-center justify-center gap-2">
          <div class="pt-8 text-center flex flex-col gap-2 justify-center items-center">
            <h1 class="text-3xl font-bold">{props.lockTitle}</h1>
            <div class="text-center w-[485px] my-4 flex flex-col gap-2 justify-center items-center">
              <p class="text-md leading-relaxed text-muted-foreground">
                {props.lockDescription}
                {
                  <Show when={props.lockDocumentationUrl}>
                    <>
                      {' '}
                      <a
                        href={props.lockDocumentationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-primary underline"
                      >
                        Learn more
                      </a>
                    </>
                  </Show>
                }
              </p>

              {
                <Show when={props.showContactSales}>
                  <div class="my-4">
                    <RequestTrial featureKey={props.featureKey} />
                  </div>
                </Show>
              }
            </div>

            {
              <Show when={props.lockVideoUrl}>
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  class="max-w-[70vh] rounded-lg"
                  controls={false}
                  src={props.lockVideoUrl}
                />
              </Show>
            }
          </div>
        </div>
      </Match>
    </Switch>
  );
};

export default LockedFeatureGuard;
