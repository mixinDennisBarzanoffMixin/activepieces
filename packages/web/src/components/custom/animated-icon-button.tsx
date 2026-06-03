import { type Component, createSignal, splitProps } from 'solid-js';

import { Button, ButtonProps } from '@/components/ui/button';

const AnimatedIconButton = (props: AnimatedIconButtonProps) => {
  const [local, rest] = splitProps(props, ['icon', 'iconSize', 'children']);
  const [icon, setIcon] = createSignal<AnimatedIconHandle>();

  const handleMouseEnter = (e: MouseEvent) => {
    icon()?.startAnimation();
    props.onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: MouseEvent) => {
    icon()?.stopAnimation();
    props.onMouseLeave?.(e);
  };

  const Icon = local.icon;

  return (
    <Button
      {...rest}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Icon ref={setIcon} size={local.iconSize || 16} />
      {local.children}
    </Button>
  );
};

export { AnimatedIconButton };

type AnimatedIconHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};

type AnimatedIconButtonProps = ButtonProps & {
  icon: Component<{
    ref?: (handle: AnimatedIconHandle) => void;
    size?: number;
  }>;
  iconSize?: number;
};
