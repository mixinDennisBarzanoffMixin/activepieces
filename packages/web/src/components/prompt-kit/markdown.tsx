import { ApMarkdown } from '@/components/custom/markdown';
import { cn } from '@/lib/utils';

export type MarkdownProps = {
  children: string;
  id?: string;
  className?: string;
  components?: Record<string, unknown>;
};

function Markdown(props: MarkdownProps) {
  return (
    <ApMarkdown
      markdown={props.children}
      class={cn(
        '[&_pre]:overflow-x-auto [&_pre]:max-w-full',
        '[&_th]:text-left [&_th]:p-2.5 [&_th]:border-b [&_th]:border-border [&_th]:font-semibold',
        '[&_td]:p-2.5 [&_td]:border-b [&_td]:border-border',
        '[&_tr:last-child_td]:border-b-0',
        props.className,
      )}
    />
  );
}

export { Markdown };
