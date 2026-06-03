import { t } from 'i18next';
import { Package } from 'lucide-solid';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { projectCollectionUtils } from '@/features/projects';
import { cn } from '@/lib/utils';

const ReleaseCard = () => {
  const { project } = projectCollectionUtils.useCurrentProject();

  return (
    <Card class="w-full px-4 py-4">
      <div class="flex w-full gap-2 justify-center items-center">
        <div class="flex flex-col gap-2 text-center mr-2">
          <Package class="size-8" />
        </div>
        <div class="flex grow flex-col">
          <div class="text-lg">{t('Releases')}</div>
          <div class="text-sm text-muted-foreground">
            {t('Enable releases to easily create and manage project releases.')}
          </div>
        </div>
        <div class="flex flex-row justify-center items-center gap-1">
          <Button
            variant={'basic'}
            onClick={() =>
              projectCollectionUtils.update(project.id, {
                releasesEnabled: !project.releasesEnabled,
              })
            }
            class={cn('', {
              'text-destructive': project.releasesEnabled,
            })}
          >
            {project.releasesEnabled ? t('Disable') : t('Enable')}
          </Button>
        </div>
      </div>
    </Card>
  );
};
export { ReleaseCard };
