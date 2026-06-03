import { ChatUIResponse } from '@activepieces/shared';

interface ChatIntroProps {
  chatUI: ChatUIResponse | null | undefined;
  botName: string;
}

export function ChatIntro(props: ChatIntroProps) {
  return (
    <div class="flex items-center justify-center py-8 px-4 font-bold">
      <div class="flex flex-col items-center gap-1">
        <div class="flex items-center justify-center p-3 rounded-full">
          <img
            src={props.chatUI?.platformLogoUrl}
            alt="Bot Avatar"
            class="w-10 h-10"
          />
        </div>
        <div class="flex items-center gap-1 justify-center">
          <p class="animate-typing overflow-hidden whitespace-nowrap pr-1 hidden lg:block lg:text-xl text-foreground leading-8">
            Hi! I&apos;m {props.botName} 👋 How can I help you today?
          </p>
          <p class="animate-typing-sm overflow-hidden whitespace-nowrap pr-1 lg:hidden text-xl text-foreground leading-8">
            Hi! I&apos;m {props.botName} 👋
          </p>
          <span class="w-4 h-4 rounded-full bg-foreground animate-[fade_0.15s_ease-out_forwards_0.7s_reverse]" />
        </div>
      </div>
    </div>
  );
}
