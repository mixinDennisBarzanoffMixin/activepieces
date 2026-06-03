import { cn } from '@/lib/utils';

const LargeWidgetWrapper = (props: {
  children: any;
  containerClassName?: string;
}) => {
  return (
    <div class="absolute top-[12px] z-40 w-full px-2 flex justify-center">
      <div
        class={cn(
          'py-1.5 px-3.5 border min-h-11.5  border border-border  bg-background z-40  w-full animate animate-fade duration-300 rounded-md  flex items-center justify-between',
          props.containerClassName,
        )}
      >
        {props.children}
      </div>
    </div>
  );
};

export default LargeWidgetWrapper;
