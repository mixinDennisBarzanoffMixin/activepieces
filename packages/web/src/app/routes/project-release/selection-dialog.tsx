import { ProjectReleaseType } from '@activepieces/shared';
import { createSignal, ParentProps, Show, splitProps } from 'solid-js';

import { Button, ButtonProps } from '@/components/ui/button';
import { projectCollectionUtils } from '@/features/projects';

import { ProjectSelectionDialog } from './selection-release-dialog/project-dialog';

type SelectionButtonProps = ParentProps<
  ButtonProps & {
    ReleaseType: ProjectReleaseType;
    onSuccess: () => void;
  }
>;
export function SelectionButton(_props: SelectionButtonProps) {
  const [local, props] = splitProps(_props, [
    'ReleaseType',
    'children',
    'onSuccess',
  ]);
  const { project } = projectCollectionUtils.useCurrentProject();
  const [open, setOpen] = createSignal(false);

  return (
    <>
      <Button
        {...props}
        onClick={() => {
          setOpen(true);
        }}
      >
        {local.children}
      </Button>
      <Show when={local.ReleaseType === ProjectReleaseType.PROJECT}>
        <ProjectSelectionDialog
          open={open}
          setOpen={setOpen}
          projectId={project.id}
          onSuccess={local.onSuccess}
        />
      </Show>
    </>
  );
}
