import { Globe } from 'lucide-solid';
import { createMemo, createSignal, Show } from 'solid-js';

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function getFaviconUrl(url: string): string {
  try {
    const origin = new URL(url).origin;
    if (!origin || origin === 'null') return '';
    return `${origin}/favicon.ico`;
  } catch {
    return '';
  }
}

function FaviconOrGlobe(props: { url: string; size: 'sm' | 'md' }) {
  const favicon = createMemo(() => getFaviconUrl(props.url));
  const [failed, setFailed] = createSignal(false);
  const globe = createMemo(() =>
    props.size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
  );
  const img = createMemo(() => (props.size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'));

  return (
    <Show
      when={favicon() && !failed()}
      fallback={<Globe class={cn(globe(), 'shrink-0 text-muted-foreground')} />}
    >
      <img
        src={favicon()}
        alt=""
        class={cn(img(), 'shrink-0 rounded-sm')}
        onError={() => setFailed(true)}
      />
    </Show>
  );
}

function Source(props: SourceProps) {
  const domain = createMemo(() => getDomain(props.href));

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <a
          href={props.href}
          target="_blank"
          rel="noopener noreferrer"
          class={cn(
            'inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-1 text-xs transition-colors hover:bg-muted no-underline',
            props.className,
          )}
        >
          <FaviconOrGlobe url={props.href} size="sm" />
          <span class="max-w-[200px] truncate text-foreground/80">
            {domain()}
          </span>
        </a>
      </HoverCardTrigger>
      <HoverCardContent align="start" class="w-72 p-3">
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <FaviconOrGlobe url={props.href} size="md" />
            <span class="text-xs text-muted-foreground truncate">
              {domain()}
            </span>
          </div>
          <Show when={props.title}>
            <p class="text-sm font-medium leading-snug line-clamp-2">
              {props.title}
            </p>
          </Show>
          <p class="text-xs text-muted-foreground truncate">{props.href}</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export { Source };

export type SourceProps = {
  href: string;
  title?: string;
  className?: string;
};
