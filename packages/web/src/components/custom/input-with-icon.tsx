import { cn } from '@/lib/utils';

const inputClass =
  'grow flex h-9 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:outline-hidden focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 box-border';

const InputWithIcon = (
  props: any & {
    icon: any;
    ref?: HTMLInputElement;
  },
) => {
  return (
    <div className={cn(inputClass, props.className, 'items-center gap-2')}>
      {props.icon}
      <input
        ref={(el) => {
          if (typeof props.ref === 'function') props.ref(el);
          else if (props.ref) props.ref = el;
        }}
        className={cn(
          'flex h-full w-full rounded-md bg-transparent text-sm outline-hidden placeholder:text-muted-foreground',
          { 'cursor-not-allowed opacity-50': props.disabled },
        )}
        {...props}
      />
    </div>
  );
};
InputWithIcon.displayName = 'InputWithIcon';

export { InputWithIcon };
