import { LineChart, Clock } from 'lucide-solid';
import { mergeProps, Show } from 'solid-js';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type TagWithBrightProps = {
  index?: number;
  prefix?: string;
  title: string;
  color: string;
  icon?: string;
  size?: 'sm' | 'md';
};

export const TagWithBright = (_props: TagWithBrightProps) => {
  const props = mergeProps({ size: 'sm' }, _props);
  return (
    <>
      <style>{`
        @keyframes shine {
          0%, 70% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
      <Badge
        variant="outline"
        class={cn('border-0 h-fit relative overflow-hidden', {
          'text-xs px-2 py-1': props.size === 'sm',
          'text-sm': props.size !== 'sm',
        })}
        style={{
          'background-color': props.color,
          color: '#000000',
        }}
      >
        <span
          class="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 50%, transparent 100%)',
            animation: 'shine 2.5s ease-out infinite',
            width: '100%',
            transform: 'translateX(-100%)',
          }}
        />
        <Show when={props.index === 0}>
          <LineChart class="relative font-medium mr-1.5 w-3.5 h-3.5" />
        </Show>
        <Show when={props.index === 1}>
          <Clock class="relative font-medium mr-1.5 w-3.5 h-3.5" />
        </Show>
        <Show when={props.prefix}>
          <span class="relative font-medium mr-1">{props.prefix}</span>
        </Show>
        <span class="relative font-bold">{props.title}</span>
      </Badge>
    </>
  );
};
