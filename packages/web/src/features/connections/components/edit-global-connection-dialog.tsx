import { t } from 'i18next';
import { Pencil } from 'lucide-solid';
import { createSignal, Show } from 'solid-js';
import { z } from 'zod';

import { GlobalConnectionWarning } from '@/components/custom/global-connection-utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { ProjectSelector } from '../../projects/components/projects-selector';
import { globalConnectionsMutations } from '../hooks/global-connections-hooks';

const EditGlobalConnectionSchema = z.object({
  displayName: z.string(),
  projectIds: z.array(z.string()),
  preSelectForNewProjects: z.boolean(),
});

type EditGlobalConnectionSchema = z.infer<typeof EditGlobalConnectionSchema>;

type EditGlobalConnectionDialogProps = {
  connectionId: string;
  currentName: string;
  projectIds: string[];
  preSelectForNewProjects: boolean;
  onEdit: () => void;
  userHasPermissionToEdit: boolean;
};

const EditGlobalConnectionDialog = (props: EditGlobalConnectionDialogProps) => {
  const [isOpen, setIsOpen] = createSignal(false);
  const [values, setValues] = createSignal<EditGlobalConnectionSchema>({
    displayName: props.currentName,
    projectIds: props.projectIds,
    preSelectForNewProjects: props.preSelectForNewProjects,
  });
  const [errors, setErrors] = createSignal<Record<string, string>>({});
  const editConnectionForm = {
    setError: (
      name: 'displayName' | 'projectIds',
      error: { message: string },
    ) => setErrors((prev) => ({ ...prev, [name]: error.message })),
  };

  const {
    mutate: updateGlobalConnection,
    isPending: isUpdatingGlobalConnection,
  } = globalConnectionsMutations.useUpdateGlobalConnection(
    props.onEdit,
    setIsOpen,
    editConnectionForm,
  );

  return (
    <Tooltip>
      <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
        <DialogTrigger asChild>
          <>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={!props.userHasPermissionToEdit}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsOpen(true);
                }}
              >
                <Pencil class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {!props.userHasPermissionToEdit
                ? t('Permission needed')
                : t('Edit')}
            </TooltipContent>
          </>
        </DialogTrigger>
        <DialogContent
          onInteractOutside={(event: Event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{t('Edit Global Connection')}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const result = EditGlobalConnectionSchema.safeParse(values());
              if (!result.success) {
                setErrors(
                  Object.fromEntries(
                    result.error.issues.map((issue) => [
                      issue.path.join('.'),
                      issue.message,
                    ]),
                  ),
                );
                return;
              }
              updateGlobalConnection({
                connectionId: props.connectionId,
                displayName: result.data.displayName,
                projectIds: result.data.projectIds,
                preSelectForNewProjects: result.data.preSelectForNewProjects,
                currentName: props.currentName,
              });
            }}
          >
            <div class="grid space-y-4">
              <GlobalConnectionWarning />
              <div class="grid space-y-2">
                <Label for="displayName">{t('Name')}</Label>
                <Input
                  value={values().displayName}
                  onInput={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      displayName: e.currentTarget.value,
                    }))
                  }
                  id="displayName"
                  placeholder={t('Connection Name')}
                  class="rounded-sm"
                />
                <Show when={errors().displayName}>
                  <p class="text-sm font-medium text-destructive wrap-break-word">
                    {t(errors().displayName)}
                  </p>
                </Show>
              </div>
              <ProjectSelector
                value={values().projectIds}
                onInput={(ids) =>
                  setValues((prev) => ({ ...prev, projectIds: ids }))
                }
              />
              <Show when={errors().projectIds}>
                <p class="text-sm font-medium text-destructive wrap-break-word">
                  {t(errors().projectIds)}
                </p>
              </Show>
              <div class="flex flex-row items-center gap-3">
                <Checkbox
                  id="preSelectForNewProjects"
                  checked={values().preSelectForNewProjects}
                  onCheckedChange={(checked) =>
                    setValues((prev) => ({
                      ...prev,
                      preSelectForNewProjects: checked === true,
                    }))
                  }
                />
                <Label for="preSelectForNewProjects" class="cursor-pointer">
                  {t('Include by default in new projects')}
                </Label>
              </div>
            </div>
            <DialogFooter class="mt-8">
              <Button
                type="button"
                variant="outline"
                disabled={isUpdatingGlobalConnection}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsOpen(false);
                }}
              >
                {t('Cancel')}
              </Button>
              <Button loading={isUpdatingGlobalConnection}>{t('Save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Tooltip>
  );
};

export { EditGlobalConnectionDialog };
