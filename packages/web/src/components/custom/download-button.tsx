import { t } from 'i18next';
import { Download } from 'lucide-solid';
import { splitProps } from 'solid-js';

import { Button, ButtonProps } from '@/components/ui/button';

import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';

interface DownloadButtonProps extends ButtonProps {
  fileName: string;
  textToDownload: string;
  tooltipSide?: TooltipSide;
}

export const DownloadButton = (_props: DownloadButtonProps) => {
  const [local, rest] = splitProps(_props, [
    'fileName',
    'className',
    'textToDownload',
    'tooltipSide',
  ]);
  const downloadFile = () => {
    const blob = new Blob([local.textToDownload], {
      type: 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${local.fileName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          class={local.className}
          onClick={() => downloadFile()}
          {...rest}
        >
          <Download class="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side={local.tooltipSide}>{t('Download')}</TooltipContent>
    </Tooltip>
  );
};

type TooltipSide = 'top' | 'right' | 'bottom' | 'left';
