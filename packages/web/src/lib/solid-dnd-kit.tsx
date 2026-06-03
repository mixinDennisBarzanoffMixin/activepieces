import {
  DragDropProvider,
  DragOverlay,
  useDragDropMonitor,
  useDraggable as useSolidDraggable,
  useDroppable as useSolidDroppable,
} from '@dnd-kit/solid';
import { useSortable as useSolidSortable } from '@dnd-kit/solid/sortable';
import { JSX, type Accessor } from 'solid-js';

type Id = string | number;

type Data = { current?: Record<string, unknown> };

type Item = { id: Id; data: Data };

type Drop = Item;

type DragEvent = {
  active: Item;
  over?: Drop | null;
  collisions?: { id: Id }[];
};

type DndMonitor = {
  onDragMove?: (event: DragMoveEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
};

function DndContext(props: DndContextProps) {
  return (
    <DragDropProvider
      onDragStart={(event) => props.onDragStart?.(eventOf(event))}
      onDragEnd={(event) => props.onDragEnd?.(eventOf(event))}
      onDragMove={() => {}}
    >
      {props.children}
    </DragDropProvider>
  );
}

function useDraggable(opts: {
  id: Id;
  disabled?: boolean;
  data?: Record<string, unknown>;
}) {
  const dnd = useSolidDraggable({
    id: opts.id,
    disabled: opts.disabled,
    data: opts.data,
  });

  return {
    attributes: { role: 'button' },
    listeners: {},
    setNodeRef: dnd.ref,
  };
}

function useDroppable(opts: { id: Id; data?: Record<string, unknown> }) {
  const dnd = useSolidDroppable({ id: opts.id, data: opts.data });
  return { setNodeRef: dnd.ref };
}

function useDndMonitor(monitor: DndMonitor) {
  useDragDropMonitor({
    onDragMove: (event) => monitor.onDragMove?.(eventOf(event)),
    onDragEnd: (event) => monitor.onDragEnd?.(eventOf(event)),
  });
}

function rectIntersection(args: { droppableContainers?: Drop[] }) {
  return args.droppableContainers ?? [];
}

class PointerSensor {}
class TouchSensor {}
class MouseSensor {}
class KeyboardSensor {}

function useSensor<T>(sensor: T, _opts?: unknown) {
  return sensor;
}

function useSensors(...sensors: unknown[]) {
  return sensors;
}

function closestCenter() {
  return [];
}

function defaultDropAnimationSideEffects() {
  return undefined;
}

function useSortable(opts: { id: Accessor<Id> }) {
  const sortable = useSolidSortable({ id: opts.id, index: 0 });
  return {
    attributes: { role: 'button' },
    listeners: {},
    setNodeRef: sortable.ref,
    transform: undefined,
    transition: undefined,
    isDragging: sortable.isDragging(),
  };
}

function eventOf(event: unknown): DragEndEvent {
  const operation = (
    event as { operation?: { source?: Source; target?: Source } }
  ).operation;
  const active = sourceOf(operation?.source);
  const over = operation?.target ? sourceOf(operation.target) : null;
  return { active, over, collisions: over ? [{ id: over.id }] : [] };
}

function sourceOf(source: Source | undefined): Item {
  return {
    id: source?.id ?? '',
    data: { current: source?.data },
  };
}

export {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  MouseSensor,
  KeyboardSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  rectIntersection,
  useDndMonitor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  useSortable,
};

export type DragEndEvent = DragEvent;
export type DragMoveEvent = DragEvent;
export type DragStartEvent = { active: Item };
export type DndContextProps = {
  children?: JSX.Element;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragCancel?: () => void;
  [key: string]: unknown;
};
export type DraggableSyntheticListeners = Record<string, unknown>;
export type DropAnimation = unknown;
export type PointerSensorOptions = {
  onActivation?: (event: { event: PointerEvent }) => void;
};
export type UniqueIdentifier = Id;

type Source = {
  id: Id;
  data?: Record<string, unknown>;
};
