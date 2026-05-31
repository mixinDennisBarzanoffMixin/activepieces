import {
  createSignal,
  createEffect,
  createContext,
  useContext,
  onCleanup,
  JSX,
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

function FileUpload({
  onFilesAdded,
  children,
  multiple = true,
  accept,
  disabled = false,
}: FileUploadProps) {
  let input: HTMLInputElement | undefined;
  const [isDragging, setIsDragging] = createSignal(false);
  let drag = 0;

  const handleFiles = (files: FileList) => {
    const added = Array.from(files);
    if (multiple) {
      onFilesAdded(added);
      return;
    }
    onFilesAdded(added.slice(0, 1));
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
      value={{ isDragging, input: () => input, multiple, disabled }}
    >
      <input
        type="file"
        ref={input}
        onChange={handleFileSelect}
        className="hidden"
        multiple={multiple}
        accept={accept}
        aria-hidden
        disabled={disabled}
      />
      {children}
    </FileUploadContext.Provider>
  );
}

export type FileUploadTriggerProps = ComponentPropsWithoutRef<'button'> & {
  asChild?: boolean;
};

function FileUploadTrigger({
  asChild = false,
  className,
  children,
  ...props
}: FileUploadTriggerProps) {
  const context = useContext(FileUploadContext);
  const handleClick = () => context?.input()?.click();

  if (asChild) {
    const child = Children.only(children) as JSX.Element<
      JSX.HTMLAttributes<HTMLElement>
    >;
    return cloneElement(child, {
      ...props,
      role: 'button',
      className: cn(className, child.props.className),
      onClick: (e: MouseEvent) => {
        e.stopPropagation();
        handleClick();
        child.props.onClick?.(e as MouseEvent<HTMLElement>);
      },
    });
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

type FileUploadContentProps = JSX.HTMLAttributes<HTMLDivElement>;

function FileUploadContent({ className, ...props }: FileUploadContentProps) {
  const context = useContext(FileUploadContext);
  const [mounted, setMounted] = createSignal(false);

  createEffect(() => {
    setMounted(true);
    onCleanup(() => setMounted(false));
  });

  if (!context?.isDragging() || !mounted() || context?.disabled) {
    return null;
  }

  const content = (
    <div
      className={cn(
        'bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm',
        'animate-in fade-in-0 slide-in-from-bottom-10 zoom-in-90 duration-150',
        className,
      )}
      {...props}
    />
  );

  return content;
}

export { FileUpload, FileUploadTrigger, FileUploadContent };
