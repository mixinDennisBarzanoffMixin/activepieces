import { ImageWithColorBackground } from '@/components/custom/image-with-color-background';
import { cn } from '@/lib/utils';

const StepNodeLogo = (props: {
  isSkipped: boolean;
  logoUrl: string;
  displayName: string;
}) => {
  return (
    <div
      class={cn('flex items-center justify-center rounded-sm shrink-0', {
        'opacity-80': props.isSkipped,
      })}
    >
      <ImageWithColorBackground
        src={props.logoUrl}
        alt={props.displayName}
        key={props.logoUrl + props.displayName}
        border={true}
        class="w-9 h-9 p-2"
        roundedCorner={true}
      />
    </div>
  );
};

export { StepNodeLogo };
