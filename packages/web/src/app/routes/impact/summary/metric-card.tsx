import { Info } from 'lucide-solid';
import { Show } from 'solid-js';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type MetricCardProps = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  value: JSX.Element;
  description: string;
  subtitle?: string;
  iconColor: string;
  iconBgColor: string;
};

export const MetricCard = ({
  icon: Icon,
  title,
  value,
  description,
  subtitle,
  iconColor,
  iconBgColor,
}: MetricCardProps) => {
  return (
    <Card class="p-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {title}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info class="h-3.5 w-3.5 text-muted-foreground/70 cursor-help" />
            </TooltipTrigger>
            <TooltipContent class="max-w-xs">{description}</TooltipContent>
          </Tooltip>
          <div
            className={`size-8 rounded-full ${iconBgColor} flex items-center justify-center shrink-0 ml-auto`}
          >
            <Icon class={`size-4 ${iconColor}`} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-2xl font-semibold text-foreground">{value}</div>
          <Show when={subtitle}>
            <div className="text-sm text-muted-foreground">{subtitle}</div>
          </Show>
        </div>
      </div>
    </Card>
  );
};

export const MetricCardSkeleton = () => {
  return (
    <Card class="p-5">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <Skeleton class="h-4 w-24" />
            <Skeleton class="h-3.5 w-3.5 rounded-full" />
          </div>
          <div className="flex flex-col gap-1">
            <Skeleton class="h-8 w-28" />
            <Skeleton class="h-4 w-36" />
          </div>
        </div>
        <Skeleton class="size-9 rounded-full shrink-0" />
      </div>
    </Card>
  );
};
