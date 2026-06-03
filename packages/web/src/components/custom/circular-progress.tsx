import { createMemo, mergeProps } from 'solid-js';

const ProgressCircularComponent = (_props: {
  data: {
    plan: number;
    usage: number;
  };
  size?: 'big' | 'small';
}) => {
  const props = mergeProps({ size: 'big' as const }, _props);
  const px = createMemo(() => (props.size === 'big' ? 40 : 25));
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const percent = createMemo(() =>
    Math.min(props.data.usage / props.data.plan, 1),
  );
  return (
    <svg width={px()} height={px()} viewBox="0 0 40 40" class="-rotate-90">
      <circle
        cx="20"
        cy="20"
        r={radius}
        fill="none"
        stroke="hsl(var(--muted))"
        stroke-width="6"
      />
      <circle
        cx="20"
        cy="20"
        r={radius}
        fill="none"
        stroke="hsl(var(--primary))"
        stroke-width="6"
        stroke-linecap="round"
        stroke-dasharray={circumference}
        stroke-dashoffset={circumference * (1 - percent())}
      >
        <title>{`${props.data.usage} / ${props.data.plan}`}</title>
      </circle>
    </svg>
  );
};

export { ProgressCircularComponent };
