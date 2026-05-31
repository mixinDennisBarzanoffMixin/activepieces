import { Button } from '@/components/ui/button';

const AnimatedIconButton = (
  props: any & { icon: any; iconSize?: number; ref?: HTMLButtonElement },
) => {
  let ref: HTMLButtonElement | undefined;
  let iconRef: any;

  const handleMouseEnter = (e: MouseEvent) => {
    iconRef?.startAnimation();
    props.onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: MouseEvent) => {
    iconRef?.stopAnimation();
    props.onMouseLeave?.(e);
  };

  const { icon: Icon, iconSize = 16, children, ...buttonProps } = props;

  return (
    <Button
      ref={(el) => (ref = el)}
      {...buttonProps}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Icon ref={(el) => (iconRef = el)} size={iconSize} />
      {children}
    </Button>
  );
};

AnimatedIconButton.displayName = 'AnimatedIconButton';

export { AnimatedIconButton };

type AnimatedIconHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};
