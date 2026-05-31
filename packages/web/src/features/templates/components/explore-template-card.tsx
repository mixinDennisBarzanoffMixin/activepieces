import { Template } from '@activepieces/shared';
import { t } from 'i18next';
import { TagWithBright } from '@/components/custom/tag-with-bright';
import { Card, CardContent } from '@/components/ui/card';
import { PieceIconList } from '@/features/pieces';
import { useGradientFromPieces } from '@/features/templates';
import { Show } from "solid-js";

type TemplateCardProps = {
  template: Template;
  onTemplateSelect: (template: Template) => void;
};

export const ExploreTemplateCard =
  ({ template, onTemplateSelect }: TemplateCardProps) => {
    const displayTags = template.tags.slice(0, 2);
    const hasFlows = template.flows && template.flows.length > 0;
    const { gradient } = useGradientFromPieces(
      hasFlows ? template.flows![0]?.trigger : undefined,
    );

    return (
      <Card
        onClick={() => onTemplateSelect(template)}
        variant={'interactive'}
        class="h-[250px] w-full flex flex-col"
      >
        <CardContent class="py-5 px-4 flex flex-col gap-1 flex-1 min-h-0">
          <div class="h-12 flex flex-col justify-start flex-shrink-0">
            <h3 class="font-medium text-base leading-tight line-clamp-2">
              {template.name}
            </h3>
          </div>

          <p class="text-muted-foreground text-sm line-clamp-3 mt-1 flex-shrink-0">
            <Show when={template.summary} fallback={(
                                  <span class="italic">{t('No summary')}</span>
                                )}>(
                                  template.summary
                                )</Show>
          </p>

          <div class="h-8 flex gap-2 flex-wrap overflow-hidden mt-1 flex-shrink-0">
            <Show when={displayTags.length > 0} fallback={(
                                  <div />
                                )}>{displayTags
                                    .slice(0, 1)
                                    .map((tag, index) => (
                                      <TagWithBright
                                        key={index}
                                        index={index}
                                        prefix={t('Save')}
                                        title={tag.title}
                                        color={tag.color}
                                        size="sm"
                                      />
                                    ))}</Show>
          </div>
        </CardContent>

        <div
          class="h-16 flex items-center px-4 rounded-b-lg transition-all duration-300"
          style={{
            background: gradient || 'transparent',
          }}
        >
          <Show when={hasFlows && template.flows![0]?.trigger}>(
                            <PieceIconList
                              trigger={template.flows![0]?.trigger}
                              maxNumberOfIconsToShow={4}
                              size="md"
                              class="flex gap-0.5"
                              background="white"
                              excludeCore={true}
                            />
                          )</Show>
        </div>
      </Card>
    );
  };

ExploreTemplateCard.displayName = 'ExploreTemplateCard';
