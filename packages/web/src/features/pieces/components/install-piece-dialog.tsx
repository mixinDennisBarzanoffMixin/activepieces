import { ApFlagId, PackageType, PieceScope } from '@activepieces/shared';
import { createMutation } from '@tanstack/solid-query';
import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import pako from 'pako';
import { createSignal, Show } from 'solid-js';
import { toast } from 'solid-sonner';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { ApMarkdown } from '@/components/custom/markdown';
import { PlusIcon } from '@/components/icons/plus';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { api } from '@/lib/api';

type InstallPieceDialogProps = {
  onInstallPiece: () => void;
  scope: PieceScope;
};
const InstallPieceDialog = (props: InstallPieceDialogProps) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const isEnabled = platform.plan.managePiecesEnabled;
  const [isOpen, setIsOpen] = createSignal(false);

  const { data: privatePiecesEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.PRIVATE_PIECES_ENABLED,
  );

  const [packageType, setPackageType] = createSignal<PackageType>(
    PackageType.REGISTRY,
  );
  const [pieceName, setPieceName] = createSignal('');
  const [pieceVersion, setPieceVersion] = createSignal('');
  const [pieceArchive, setPieceArchive] = createSignal<File>();
  const [errors, setErrors] = createSignal<InstallPieceErrors>({});

  const reset = () => {
    setPackageType(PackageType.REGISTRY);
    setPieceName('');
    setPieceVersion('');
    setPieceArchive(undefined);
    setErrors({});
  };

  const handleArchiveUpload = async (file: File) => {
    setErrors({});
    if (file && file.name.endsWith('.tgz')) {
      try {
        const fileBuffer = await file.arrayBuffer();
        const decompressedData = pako.ungzip(new Uint8Array(fileBuffer));
        const text = new TextDecoder().decode(decompressedData);

        // Look for package.json content in the decompressed data
        const packageJsonMatch = text.match(
          /package\.json.*?{[^}]*"name"\s*:\s*"([^"]+)".*?"version"\s*:\s*"([^"]+)"/s,
        );
        if (packageJsonMatch) {
          setPieceName(packageJsonMatch[1]);
          setPieceVersion(packageJsonMatch[2]);
        } else {
          setErrors({ pieceArchive: t('package.json not found in archive') });
        }
      } catch (error) {
        console.error('Error processing file:', error);
        setErrors({ pieceArchive: t('Error processing archive file') });
      }
    } else {
      setErrors({ pieceArchive: t('Please upload a .tgz file') });
    }
  };

  const { mutate, isPending } = createMutation(() => ({
    mutationFn: async (data: InstallPieceData): Promise<void> => {
      const body = new FormData();
      body.set('packageType', data.packageType);
      body.set('pieceName', data.pieceName);
      body.set('pieceVersion', data.pieceVersion);
      body.set('scope', data.scope);
      if (data.packageType === PackageType.ARCHIVE) {
        body.append('pieceArchive', data.pieceArchive);
      }

      await api.post('/v1/pieces', body, undefined, {
        'Content-Type': 'multipart/form-data',
      });
    },
    onSuccess: () => {
      setIsOpen(false);
      reset();
      props.onInstallPiece();
      toast.success(t('Piece installed'), {
        duration: 3000,
      });
    },
    onError: (error: Error) => {
      if (api.isError(error)) {
        switch (error.response?.status) {
          case HttpStatusCode.Conflict:
            setErrors({
              server: t(
                'A piece with this name and version is already installed. Please update the version number in package.json and try again.',
              ),
            });
            break;
          default:
            setErrors({
              server: t('Something went wrong, please try again later'),
            });
            break;
        }
      }
    },
  }));

  const submit = (e: SubmitEvent) => {
    e.preventDefault();
    setErrors({});

    const data: Partial<InstallPieceData> & {
      packageType: PackageType;
      pieceName: string;
      pieceVersion: string;
      scope: PieceScope;
      pieceArchive?: File;
    } = {
      packageType: packageType(),
      pieceName: pieceName().trim(),
      pieceVersion: pieceVersion().trim(),
      pieceArchive: pieceArchive(),
      scope: props.scope,
    };

    if (data.packageType === PackageType.REGISTRY) {
      const next = {
        pieceName: !data.pieceName
          ? t('Piece name is required for NPM Registry')
          : undefined,
        pieceVersion: !data.pieceVersion
          ? t('Piece version is required for NPM Registry')
          : undefined,
      };
      if (next.pieceName || next.pieceVersion) {
        setErrors(next);
        return;
      }
      mutate({
        packageType: PackageType.REGISTRY,
        pieceName: data.pieceName,
        pieceVersion: data.pieceVersion,
        scope: data.scope,
      });
      return;
    }

    if (!data.pieceArchive) {
      setErrors({ pieceArchive: t('Please upload a .tgz file') });
      return;
    }

    mutate({
      packageType: PackageType.ARCHIVE,
      pieceName: data.pieceName,
      pieceVersion: data.pieceVersion,
      pieceArchive: data.pieceArchive,
      scope: data.scope,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <DialogTrigger asChild>
        <AnimatedIconButton icon={PlusIcon} iconSize={16} size="sm">
          {t('Install Piece')}
        </AnimatedIconButton>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Install a piece')}</DialogTitle>
          <DialogDescription>
            <ApMarkdown
              markdown={
                'Use this to install a [custom piece]("https://www.activepieces.com/docs/build-pieces/building-pieces/create-action") that you (or someone else) created. Once the piece is installed, you can use it in the flow builder.\n\nWarning: Make sure you trust the author as the piece will have access to your flow data and it might not be compatible with the current version of Activepieces.'
              }
            />
          </DialogDescription>
        </DialogHeader>
        <form class="flex flex-col gap-4" onSubmit={submit}>
          <div class="space-y-1">
            <Label for="packageType">{t('Package Type')}</Label>
            <Select
              value={packageType()}
              onValueChange={(value: string) => {
                setPackageType(toPackageType(value));
                if (value === String(PackageType.ARCHIVE)) {
                  setPieceName('');
                  setPieceVersion('');
                }
                setErrors({});
              }}
              defaultValue={PackageType.REGISTRY}
            >
              <SelectTrigger>
                <SelectValue defaultValue={PackageType.REGISTRY} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={PackageType.REGISTRY}>
                    {t('NPM Registry')}
                  </SelectItem>
                  <SelectItem
                    value={PackageType.ARCHIVE}
                    disabled={!isEnabled || !privatePiecesEnabled}
                  >
                    {t('Packed Archive (.tgz)')}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <Show when={packageType() === PackageType.REGISTRY}>
            <>
              <div class="space-y-1">
                <Label for="pieceName">{t('Piece Name')}</Label>
                <Input
                  value={pieceName()}
                  onInput={(e) => setPieceName(e.currentTarget.value)}
                  id="pieceName"
                  type="text"
                  placeholder="@activepieces/piece-name"
                  class="rounded-sm"
                />
                <Show when={errors().pieceName}>
                  <p class="text-sm font-medium text-destructive wrap-break-word">
                    {errors().pieceName}
                  </p>
                </Show>
              </div>
              <div class="space-y-1">
                <Label for="pieceVersion">{t('Piece Version')}</Label>
                <Input
                  value={pieceVersion()}
                  onInput={(e) => setPieceVersion(e.currentTarget.value)}
                  id="pieceVersion"
                  type="text"
                  placeholder="0.0.1"
                  class="rounded-sm"
                />
                <Show when={errors().pieceVersion}>
                  <p class="text-sm font-medium text-destructive wrap-break-word">
                    {errors().pieceVersion}
                  </p>
                </Show>
              </div>
            </>
          </Show>

          <Show when={packageType() === PackageType.ARCHIVE}>
            <div class="space-y-1">
              <Label for="pieceArchive">{t('Package Archive')}</Label>
              <Input
                id="pieceArchive"
                type="file"
                onInput={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (file) {
                    setPieceArchive(file);
                    void handleArchiveUpload(file);
                  }
                }}
                placeholder={t('Package archive')}
                class="rounded-sm"
              />
              <Show when={errors().pieceArchive}>
                <p class="text-sm font-medium text-destructive wrap-break-word">
                  {errors().pieceArchive}
                </p>
              </Show>
            </div>
          </Show>

          <Show when={errors().server}>
            <p class="text-sm font-medium text-destructive wrap-break-word">
              {errors().server}
            </p>
          </Show>
          <Button loading={isPending} type="submit">
            {t('Install')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

function toPackageType(value: string): PackageType {
  if (value === String(PackageType.REGISTRY)) return PackageType.REGISTRY;
  if (value === String(PackageType.ARCHIVE)) return PackageType.ARCHIVE;
  throw new Error('Invalid package type');
}

type InstallPieceData =
  | {
      packageType: PackageType.REGISTRY;
      scope: PieceScope;
      pieceName: string;
      pieceVersion: string;
    }
  | {
      packageType: PackageType.ARCHIVE;
      scope: PieceScope;
      pieceName: string;
      pieceVersion: string;
      pieceArchive: File;
    };

type InstallPieceErrors = Partial<{
  pieceName: string;
  pieceVersion: string;
  pieceArchive: string;
  server: string;
}>;

export { InstallPieceDialog };
