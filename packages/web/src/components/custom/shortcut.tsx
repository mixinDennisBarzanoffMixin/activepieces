import { cn } from '@/lib/utils';

const toTitleCase = (str: string) => {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
export type ShortcutProps = {
  //can't name it key because it conflicts with the key prop of the component
  shortcutKey: string;
  withCtrl?: boolean;
  withShift?: boolean;
};

export const Shortcut = (props: ShortcutProps & { className?: string }) => {
  const isMac = /(Mac)/i.test(navigator.userAgent);
  const isEscape = props.shortcutKey.toLocaleLowerCase() === 'esc';
  return (
    <span
      class={cn(
        'grow text-xs tracking-widest text-muted-foreground',
        props.className,
      )}
    >
      {!isEscape && props.withCtrl && (isMac ? '⌘' : 'Ctrl')}
      {!isEscape && props.withShift && 'Shift'}
      {!isEscape && (props.withCtrl || props.withShift) && ' + '}
      {props.shortcutKey && toTitleCase(props.shortcutKey)}
    </span>
  );
};
