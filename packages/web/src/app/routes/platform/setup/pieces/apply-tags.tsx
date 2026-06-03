import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { t } from 'i18next';
import { Trash2 } from 'lucide-solid';
import { createSignal, createEffect, For, Show } from 'solid-js';
import { toast } from 'solid-sonner';

import { CreateTagDialog } from '@/app/routes/platform/setup/pieces/create-tag-dialog';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  piecesTagQueries,
  piecesTagMutations,
} from '@/features/platform-admin';

type ApplyTagsProps = {
  selectedPieces: PieceMetadataModelSummary[];
  onApplyTags: () => void;
};

const ApplyTags = (props: ApplyTagsProps) => {
  const { data: tags = [] } = piecesTagQueries.useTags();
  const [open, setOpen] = createSignal(false);
  const [selectedTags, setSelectedTags] = createSignal<Set<string>>(new Set());
  let clicked = new Set<string>();
  const [createDialogOpen, setCreateDialogOpen] = createSignal(false);
  createEffect(() => {
    setSelectedTags(
      new Set(
        tags
          .map((tag) => tag.name)
          .filter((tag) =>
            props.selectedPieces.every((piece) => piece.tags?.includes(tag)),
          ),
      ),
    );
  });

  const { mutate: applyTags } = piecesTagMutations.useApplyTags({
    onSuccess: () => props.onApplyTags(),
  });

  const { mutate: deleteTag } = piecesTagMutations.useDeleteTag({
    onSuccess: () => props.onApplyTags(),
  });

  const [tagOptions, setTagOptions] = createSignal<
    { id: string; label: string; value: string }[]
  >([]);
  createEffect(() => {
    setTagOptions(
      tags.map((tag) => ({
        id: tag.id,
        label: tag.name,
        value: tag.name,
      })),
    );
  });

  return (
    <Popover
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        clicked = new Set<string>();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={props.selectedPieces.length === 0}
        >
          {t('Apply Tags')}
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-[200px] p-0" align="start">
        <Command>
          <CommandList>
            <Show
              when={tagOptions().length === 0}
              fallback={
                <ScrollArea viewPortClassName="max-h-[200px]">
                  <CommandGroup>
                    <For each={tagOptions()}>
                      {(option) => {
                        const isSelected = selectedTags().has(option.value);
                        const isIndeterminate =
                          props.selectedPieces.some((piece) =>
                            piece.tags?.includes(option.value),
                          ) &&
                          !props.selectedPieces.every((piece) =>
                            piece.tags?.includes(option.value),
                          ) &&
                          !clicked.has(option.value);
                        return (
                          <CommandItem
                            key={option.value}
                            onSelect={() => {
                              clicked.add(option.value);
                              const newSelectedTags = new Set(selectedTags());
                              if (isSelected && !isIndeterminate) {
                                newSelectedTags.delete(option.value);
                              } else {
                                newSelectedTags.add(option.value);
                              }
                              setSelectedTags(newSelectedTags);
                            }}
                          >
                            <Checkbox
                              checked={
                                isIndeterminate ? 'indeterminate' : isSelected
                              }
                              class="mr-2"
                            />

                            <span class="flex-grow">{option.label}</span>
                            <ConfirmationDeleteDialog
                              title={t('Delete Tag')}
                              message={String(
                                t(
                                  'Are you sure you want to delete the tag "{tagName}"? It will be removed from all pieces.',
                                  { tagName: option.label },
                                ),
                              )}
                              entityName={option.label}
                              mutationFn={() => {
                                deleteTag(option.id);
                                setTagOptions((prev) =>
                                  prev.filter((o) => o.id !== option.id),
                                );
                              }}
                            >
                              <button
                                onClick={(e) => e.stopPropagation()}
                                class="hover:text-destructive"
                              >
                                <Trash2 class="size-4" />
                              </button>
                            </ConfirmationDeleteDialog>
                          </CommandItem>
                        );
                      }}
                    </For>
                  </CommandGroup>
                </ScrollArea>
              }
            >
              <CommandEmpty>{t('No tags created.')}</CommandEmpty>
            </Show>

            <CreateTagDialog
              onTagCreated={(tag) => {
                if (tagOptions().some((option) => option.value === tag.name)) {
                  return;
                }
                setTagOptions([
                  ...tagOptions(),
                  { id: tag.id, label: tag.name, value: tag.name },
                ]);
              }}
              isOpen={createDialogOpen}
              setIsOpen={setCreateDialogOpen}
            >
              <CommandItem
                class="justify-center text-center"
                onSelect={() => {
                  setCreateDialogOpen(true);
                }}
              >
                + {t('New Tag')}
              </CommandItem>
            </CreateTagDialog>
            <Separator />
            <CommandGroup>
              <CommandItem
                class="justify-center text-center text-primary"
                onSelect={() => {
                  toast(t('Applying Tags...'), {});
                  applyTags({
                    piecesName: props.selectedPieces.map((piece) => piece.name),
                    tags: Array.from(selectedTags()),
                  });
                  setOpen(false);
                }}
              >
                {t('Apply Tags')}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export { ApplyTags };
