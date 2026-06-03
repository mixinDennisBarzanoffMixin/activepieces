import { A as Link } from '@solidjs/router';
import { t } from 'i18next';
import { LucideIcon, SearchX } from 'lucide-solid';
import { Show } from 'solid-js';

import { Button } from '@/components/ui/button';

interface NotFoundPageProps {
  title?: string;
  description?: string;
  showHomeButton?: boolean;
  buttonText?: string;
  icon?: LucideIcon;
}

const NotFoundPage = (_props: NotFoundPageProps) => {
  const props: Required<NotFoundPageProps> = {
    title: 'Oops! Page Not Found',
    description:
      "The page you're looking for isn't here. Want to try going back home?",
    showHomeButton: true,
    buttonText: 'Go Home',
    icon: SearchX,
    ..._props,
  };
  return (
    <div class="mx-auto max-w-(--breakpoint-xl) px-4 py-8 lg:px-6 lg:py-16 bg-background">
      <div class="mx-auto max-w-(--breakpoint-sm) text-center">
        <div class="mx-auto mb-8 flex justify-center">
          <props.icon class="h-24 w-24" />
        </div>
        <p class="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {t(props.title)}
        </p>

        <p class="mb-4 text-lg font-light text-foreground">
          {t(props.description)}
        </p>
        <Show when={props.showHomeButton}>
          <Link href="/">
            <Button size="lg" variant={'default'}>
              {t(props.buttonText)}
            </Button>
          </Link>
        </Show>
      </div>
    </div>
  );
};

export default NotFoundPage;
