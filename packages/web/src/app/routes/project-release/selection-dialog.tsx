import { ProjectReleaseType } from '@activepieces/shared';
import { createSignal, Show } from 'solid-js';

import { Button, ButtonProps } from '@/components/ui/button';
import { projectCollectionUtils } from '@/features/projects';

import { ProjectSelectionDialog } from './selection-release-dialog/project-dialog';

type SelectionButtonProps = ButtonProps & {
  ReleaseType: ProjectReleaseType;
  children: JSX.Element;
  onSuccess: () => void;
};
export function SelectionButton({
  ReleaseType,
  children,
  onSuccess,
  ...props
}: SelectionButtonProps) {
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
        {children}
      </Button>
      <Show when={ReleaseType === ProjectReleaseType.PROJECT}>
        <ProjectSelectionDialog
          open={open}
          setOpen={setOpen}
          projectId={project.id}
          onSuccess={onSuccess}
        />
      </Show>
    </>
  );
}
