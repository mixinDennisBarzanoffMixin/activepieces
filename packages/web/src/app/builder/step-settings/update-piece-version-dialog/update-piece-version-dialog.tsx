import { formErrors, PieceAction, PieceTrigger } from '@activepieces/shared';
import { createMutation } from '@tanstack/solid-query';
import { t } from 'i18next';
import { ArrowUp, ArrowUpDown } from 'lucide-solid';
import { Show, createMemo, createSignal, untrack } from 'solid-js';
import { z } from 'zod';

import {
  BuilderField,
  createForm,
  zodResolver,
} from '@/app/builder/builder-form';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { piecesHooks } from '@/features/pieces';

import { useBuilderStateContext } from '../../builder-hooks';

import {
  changeVersionUtils,
  MinorOrMajorSelectionAlert,
  PatchDowngradeInfoAlert,
  PatchUpgradeInfoAlert,
  VersionChangeType,
} from './update-piece-version-utils';
import { UpgradePieceVersionContent } from './upgrade-piece-version-dialog';

type DialogView = 'upgrade' | 'advanced';

const UpdatePieceVersionDialog = (props: UpdatePieceVersionDialogProps) => {
  const step = untrack(() => props.step);
  const currentVersion = untrack(() => props.currentVersion);
  const [view, setView] = createSignal<DialogView | null>(null);
  const usePieceVersions = piecesHooks.usePieceVersions as (
    pieceName: string,
  ) => PieceVersionsResult;
  const { pieceVersions, isLoading } = usePieceVersions(getPieceName(step));
  const latestVersion = createMemo(() =>
    changeVersionUtils.getLatestVersion({
      currentVersion,
      versions: pieceVersions ?? [],
    }),
  );
  const hasNewerVersion = createMemo(() => latestVersion() !== undefined);
  const isLatestMinorOrMajor = createMemo(
    () =>
      latestVersion() !== undefined &&
      changeVersionUtils.getVersionChangeType({
        currentVersion,
        selectedVersion: latestVersion(),
      }) === VersionChangeType.MINOR_OR_MAJOR,
  );

  const handleOpen = () => {
    setView(hasNewerVersion() ? 'upgrade' : 'advanced');
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="size-6"
            onClick={handleOpen}
            loading={isLoading}
          >
            <Show
              when={hasNewerVersion()}
              fallback={<ArrowUpDown class="size-3.5" />}
            >
              <ArrowUp class="size-3.5 text-green-500" />
            </Show>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <Show when={hasNewerVersion()} fallback={t('Switch version')}>
            {t('New version available')}
          </Show>
        </TooltipContent>
      </Tooltip>

      <Dialog
        open={view() !== null}
        onOpenChange={(open: boolean) => !open && setView(null)}
      >
        <DialogContent>
          <DialogHeader class="mb-0">
            <DialogTitle>
              <Show
                when={view() === 'upgrade'}
                fallback={t('Update Piece Version')}
              >
                {t('New Version Available')}
              </Show>
            </DialogTitle>
          </DialogHeader>
          <Show when={view() === 'upgrade' && latestVersion()}>
            <UpgradePieceVersionContent
              key="upgrade"
              step={step}
              currentVersion={currentVersion}
              latestVersion={latestVersion()!}
              isLatestMinorOrMajor={isLatestMinorOrMajor()}
              onClose={() => setView(null)}
              onOpenAdvanced={() => setView('advanced')}
            />
          </Show>
          <Show when={view() === 'advanced'}>
            <AdvancedForm
              key="advanced"
              step={step}
              currentVersion={currentVersion}
              onClose={() => setView(null)}
              onBack={hasNewerVersion() ? () => setView('upgrade') : undefined}
            />
          </Show>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { UpdatePieceVersionDialog };

type UpdatePieceVersionDialogProps = {
  step: PieceAction | PieceTrigger;
  currentVersion: string;
};

const AdvancedForm = (props: AdvancedFormProps) => {
  const step = untrack(() => props.step);
  const currentVersion = untrack(() => props.currentVersion);
  const usePieceVersions = piecesHooks.usePieceVersions as (
    pieceName: string,
  ) => PieceVersionsResult;
  const { pieceVersions, isLoading } = usePieceVersions(getPieceName(step));
  const applyOperation = useBuilderStateContext((state) => ({
    value: state.applyOperation,
  })).value;
  const [showAllVersions, setShowAllVersions] = createSignal(false);
  const [versionSelectOpen, setVersionSelectOpen] = createSignal(false);
  const [selectedVersion, setSelectedVersion] = createSignal(currentVersion);

  const patchVersions = createMemo(() =>
    (pieceVersions ?? []).filter((p) => {
      const changeType = changeVersionUtils.getVersionChangeType({
        currentVersion,
        selectedVersion: p.version,
      });
      return changeType !== VersionChangeType.MINOR_OR_MAJOR;
    }),
  );

  const visibleVersions = createMemo(() =>
    showAllVersions() ? pieceVersions ?? [] : patchVersions(),
  );

  const latestVersion = createMemo(() =>
    changeVersionUtils.getLatestVersion({
      currentVersion,
      versions: pieceVersions ?? [],
    }),
  );
  const latestPatchVersion = createMemo(() => patchVersions()[0]?.version);

  const versionOptions = createMemo(() =>
    visibleVersions().map((p) => {
      const isCurrent = p.version === currentVersion;
      const isLatest =
        latestVersion() !== undefined &&
        p.version === latestVersion() &&
        !isCurrent;
      const isLatestPatch =
        latestPatchVersion() !== undefined &&
        p.version === latestPatchVersion() &&
        p.version !== currentVersion &&
        !isLatest;
      return {
        value: p.version,
        label: `${p.version} ${
          isCurrent
            ? `(${t('Current')})`
            : isLatest
            ? `(${t('Latest')})`
            : isLatestPatch
            ? `(${t('Latest patch')})`
            : ''
        }`,
      };
    }),
  );

  const form = createForm<FormSchema>({
    resolver: zodResolver(FormSchema),
    defaultValues: { version: currentVersion },
    mode: 'onChange',
  });

  const versionChangeType = createMemo(() =>
    changeVersionUtils.getVersionChangeType({
      currentVersion,
      selectedVersion: selectedVersion(),
    }),
  );
  const isMinorOrMajor = createMemo(
    () => versionChangeType() === VersionChangeType.MINOR_OR_MAJOR,
  );
  const isPatchDowngrade = createMemo(
    () => versionChangeType() === VersionChangeType.PATCH_DOWNGRADE,
  );
  const isPatchUpgrade = createMemo(
    () =>
      versionChangeType() === VersionChangeType.PATCH_UPGRADE &&
      selectedVersion() !== currentVersion,
  );

  const { mutate: applyVersionChange, isPending: isApplyPending } =
    createMutation(() => ({
      mutationFn: async ({ version }: FormSchema) => {
        await changeVersionUtils.applyPieceVersionChange({
          step,
          targetVersion: version,
          currentVersion,
          applyOperation,
        });
      },
      onSuccess: () => {
        props.onClose();
      },
      onError: (error) => {
        form.setError('root.serverError', {
          type: 'manual',
          message: error instanceof Error ? error.message : t('Unknown error'),
        });
      },
    }));

  return (
    <Form {...form}>
      <form
        class="flex flex-col gap-4"
        onSubmit={form.handleSubmit((data) => applyVersionChange(data))}
      >
        <FormField
          control={form.control}
          name="version"
          render={({ field }: { field: BuilderField<string> }) => (
            <FormItem class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">{t('Version')}</span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  class="h-auto p-0 text-xs"
                  onClick={() => {
                    setShowAllVersions((v) => !v);
                    setVersionSelectOpen(true);
                  }}
                >
                  <Show
                    when={showAllVersions()}
                    fallback={t('Show all versions')}
                  >
                    {t('Patch versions only')}
                  </Show>
                </Button>
              </div>
              <SearchableSelect
                options={versionOptions()}
                value={field.value}
                loading={isLoading}
                openState={{
                  open: versionSelectOpen,
                  setOpen: setVersionSelectOpen,
                }}
                onChange={(v) => {
                  if (v) {
                    setSelectedVersion(v);
                    field.onChange(v);
                  }
                }}
                placeholder={t('Search versions...')}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <Show when={isMinorOrMajor()}>
          <MinorOrMajorSelectionAlert />
        </Show>

        <Show when={isPatchUpgrade()}>
          <PatchUpgradeInfoAlert />
        </Show>

        <Show when={isPatchDowngrade()}>
          <PatchDowngradeInfoAlert />
        </Show>

        <Show when={getServerErrorMessage(form.formState.errors)}>
          <p class="text-sm font-medium text-destructive">
            {getServerErrorMessage(form.formState.errors)}
          </p>
        </Show>

        <DialogFooter>
          <Show when={props.onBack}>
            <Button
              type="button"
              variant="outline"
              class="mr-auto"
              onClick={() => props.onBack?.()}
            >
              {t('Back')}
            </Button>
          </Show>
          <Button type="button" variant="outline" onClick={props.onClose}>
            {t('Cancel')}
          </Button>
          <Button
            type="submit"
            loading={isApplyPending}
            disabled={selectedVersion() === props.currentVersion}
          >
            {t('Apply')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

type AdvancedFormProps = {
  step: PieceAction | PieceTrigger;
  currentVersion: string;
  onClose: () => void;
  onBack?: () => void;
};

type PieceVersionsResult = {
  pieceVersions: { version: string }[] | undefined;
  isLoading: boolean;
};

function getPieceName(step: PieceAction | PieceTrigger) {
  return step.settings.pieceName;
}

const FormSchema = z.object({
  version: z.string().min(1, formErrors.required),
});

function getServerErrorMessage(errors: unknown) {
  if (!isRecord(errors)) return undefined;
  const root = errors.root;
  if (!isRecord(root)) return undefined;
  const error = root.serverError;
  if (!isRecord(error)) return undefined;
  return typeof error.message === 'string' ? error.message : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

type FormSchema = z.infer<typeof FormSchema>;
