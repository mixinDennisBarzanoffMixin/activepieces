import { A as Link } from '@solidjs/router';
import { ActivepiecesClientEventName } from 'ee-embed-sdk';
import { t } from 'i18next';
import { ChevronLeft } from 'lucide-solid';
import { Show } from 'solid-js';

import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flagsHooks } from '@/hooks/flags-hooks';
import { authenticationSession } from '@/lib/authentication-session';

const HomeButtonWrapper = (props: { children: any }) => {
  const { embedState } = useEmbedding();
  if (embedState.emitHomeButtonClickedEvent) {
    const handleClick = () => {
      window.parent.postMessage(
        {
          type: ActivepiecesClientEventName.CLIENT_BUILDER_HOME_BUTTON_CLICKED,
          data: {
            route: '/flows',
          },
        },
        '*',
      );
    };
    return <div onClick={handleClick}>{props.children}</div>;
  }
  return (
    <Link href={authenticationSession.appendProjectRoutePrefix('/flows')}>
      {props.children}
    </Link>
  );
};
const HomeButton = () => {
  const { embedState } = useEmbedding();
  const branding = flagsHooks.useWebsiteBranding();
  const showBackButton = embedState.homeButtonIcon === 'back';
  return (
    <>
      <Show when={!embedState.hideHomeButtonInBuilder}>
        <Tooltip>
          <HomeButtonWrapper>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={'icon'}
                class={showBackButton ? 'size-8' : 'size-10'}
              >
                <Show
                  when={!showBackButton}
                  fallback={<ChevronLeft class="h-4 w-4" />}
                >
                  <img
                    class="h-5 w-5 object-contain"
                    src={branding()?.logos.logoIconUrl}
                    alt={branding()?.websiteName}
                  />
                </Show>
              </Button>
            </TooltipTrigger>
          </HomeButtonWrapper>
          <Show when={!showBackButton}>
            <TooltipContent side="bottom">
              {t('Go to Dashboard')}
            </TooltipContent>
          </Show>
        </Tooltip>
      </Show>
    </>
  );
};

export { HomeButton };
