import { createMemo, mergeProps, Show } from 'solid-js';
interface Props {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export const CircularIcon = (_props: Props) => {
  const props = mergeProps({ size: 50, strokeWidth: 3.5 }, _props);
  const radius = createMemo(() => (props.size - props.strokeWidth) / 2);
  const circumference = createMemo(() => 2 * Math.PI * radius());
  const offset = createMemo(
    () => circumference() - (props.value / 100) * circumference(),
  );

  return (
    <div class="flex items-center gap-3">
      {/* Progress Circle */}
      <svg width={props.size} height={props.size} class="inline-block">
        {/* Background Circle */}
        <circle
          cx={props.size / 2}
          cy={props.size / 2}
          r={radius()}
          strokeWidth={props.strokeWidth}
          stroke="currentColor"
          class="text-gray-200 dark:text-gray-700"
          fill="transparent"
        />
        {/* Progress Circle */}
        <circle
          cx={props.size / 2}
          cy={props.size / 2}
          r={radius()}
          strokeWidth={props.strokeWidth}
          stroke="currentColor"
          class="text-primary"
          fill="transparent"
          strokeDasharray={circumference()}
          strokeDashoffset={offset()}
          transform={`rotate(-90 ${props.size / 2} ${props.size / 2})`}
        />
        {/* Percentage Label */}
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize={props.size * 0.225}
          fontWeight="bold"
          class="fill-current text-gray-700 dark:text-gray-200"
        >
          {props.value.toFixed(1)}%
        </text>
      </svg>

      {/* Label */}
      <Show when={props.label}>
        <div class="text-sm text-gray-700 dark:text-gray-400">
          {props.label}
        </div>
      </Show>
    </div>
  );
};
