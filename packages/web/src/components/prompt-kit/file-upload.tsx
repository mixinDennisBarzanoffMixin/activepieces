import {
  createSignal,
  createEffect,
  createContext,
  mergeProps,
  useContext,
  onCleanup,
  JSX,
  Show,
  splitProps,
} from 'solid-js';

import { cn } from '@/lib/utils';

type FileUploadContextValue = {
  isDragging: () => boolean;
  input: () => HTMLInputElement | undefined;
  multiple?: boolean;
  disabled?: boolean;
};

const FileUploadContext = createContext<FileUploadContextValue | null>(null);

export type FileUploadProps = {
  onFilesAdded: (files: File[]) => void;
  children: JSX.Element;
  multiple?: boolean;
  accept?: string;
  disabled?: boolean;
};

function FileUpload(_props: FileUploadProps) {
  const props = mergeProps({ multiple: true, disabled: false }, _props);
  let input: HTMLInputElement | undefined;
  const [isDragging, setIsDragging] = createSignal(false);
  let drag = 0;

  const handleFiles = (files: FileList) => {
    const added = Array.from(files);
    if (props.multiple) {
      props.onFilesAdded(added);
      return;
    }
    props.onFilesAdded(added.slice(0, 1));
  };

  createEffect(() => {
    const handleDrag = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragIn = (e: DragEvent) => {
      handleDrag(e);
      drag++;
      if (e.dataTransfer?.items.length) setIsDragging(true);
    };

    const handleDragOut = (e: DragEvent) => {
      handleDrag(e);
      drag--;
      if (drag === 0) setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
      handleDrag(e);
      setIsDragging(false);
      drag = 0;
      if (e.dataTransfer?.files.length) {
        handleFiles(e.dataTransfer.files);
      }
    };

    window.addEventListener('dragenter', handleDragIn);
    window.addEventListener('dragleave', handleDragOut);
    window.addEventListener('dragover', handleDrag);
    window.addEventListener('drop', handleDrop);

    onCleanup(() => {
      window.removeEventListener('dragenter', handleDragIn);
      window.removeEventListener('dragleave', handleDragOut);
      window.removeEventListener('dragover', handleDrag);
      window.removeEventListener('drop', handleDrop);
    });
  });

  const handleFileSelect = (e: Event & { currentTarget: HTMLInputElement }) => {
    if (e.currentTarget.files?.length) {
      handleFiles(e.currentTarget.files);
      e.currentTarget.value = '';
    }
  };

  return (
    <FileUploadContext.Provider
      value={{
        isDragging,
        input: () => input,
        get multiple() {
          return props.multiple;
        },
        get disabled() {
          return props.disabled;
        },
      }}
    >
      <input
        type="file"
        ref={(el) => {
          input = el;
        }}
        onInput={handleFileSelect}
        class="hidden"
        multiple={props.multiple}
        accept={props.accept}
        aria-hidden
        disabled={props.disabled}
      />
      {props.children}
    </FileUploadContext.Provider>
  );
}

export type FileUploadTriggerProps = {
  children?: JSX.Element;
  className?: string;
  asChild?: boolean;
} & Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'>;

function FileUploadTrigger(_props: FileUploadTriggerProps) {
  const merged = mergeProps({ asChild: false }, _props);
  const [local, props] = splitProps(merged, [
    'asChild',
    'className',
    'children',
  ]);
  const context = useContext(FileUploadContext);
  const handleClick = () => context?.input()?.click();

  return (
    <Show when={!local.asChild} fallback={local.children}>
      <button
        type="button"
        class={local.className}
        onClick={handleClick}
        {...props}
      >
        {local.children}
      </button>
    </Show>
  );
}

type FileUploadContentProps = {
  className?: string;
} & Omit<JSX.HTMLAttributes<HTMLDivElement>, 'className'>;

function FileUploadContent(_props: FileUploadContentProps) {
  const [local, props] = splitProps(_props, ['className']);
  const context = useContext(FileUploadContext);
  const [mounted, setMounted] = createSignal(false);

  createEffect(() => {
    setMounted(true);
    onCleanup(() => setMounted(false));
  });

  return (
    <Show when={context?.isDragging() && mounted() && !context.disabled}>
      <div
        class={cn(
          'bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm',
          'animate-in fade-in-0 slide-in-from-bottom-10 zoom-in-90 duration-150',
          local.className,
        )}
        {...props}
      />
    </Show>
  );
}

export { FileUpload, FileUploadTrigger, FileUploadContent };
