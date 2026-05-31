import { t } from 'i18next';
import { SlidersHorizontal } from 'lucide-solid';
import { For } from 'solid-js';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export const WorkerConfigsPopover: any = ({ workerProps }) => {
  const entries = Object.entries(workerProps ?? {});

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          class="size-7 text-muted-foreground hover:text-foreground"
          title={t('Configs')}
        >
          <SlidersHorizontal size={14} />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-auto p-0" align="end">
        <table className="text-xs">
          <thead>
            <tr className="border-b">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                {t('Variable')}
              </th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                {t('Value')}
              </th>
            </tr>
          </thead>
          <tbody>
            <For each={entries}>
              {([key, value]) => (
                <tr key={key} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-mono font-medium">{key}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">
                    {value}
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </PopoverContent>
    </Popover>
  );
};

type Props = {
  workerProps: Record<string, string>;
};
