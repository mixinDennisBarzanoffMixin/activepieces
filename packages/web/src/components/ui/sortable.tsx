import {
  createContext,
  createMemo,
  createSignal,
  splitProps,
  useContext,
  type Accessor,
  type ComponentProps,
  type JSX,
  Show,
} from 'solid-js';

import { Button, type ButtonProps } from '@/components/ui/button';
import { composeRefs } from '@/lib/compose-refs';
import {
  closestCenter,
  defaultDropAnimationSideEffects,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useSortable,
  type DndContextProps,
  type DraggableSyntheticListeners,
  type DropAnimation,
  type UniqueIdentifier,
} from '@/lib/solid-dnd-kit';
import { cn } from '@/lib/utils';

const orientationConfig = {
  vertical: {
    modifiers: [],
    strategy: undefined,
  },
  horizontal: {
    modifiers: [],
    strategy: undefined,
  },
  mixed: {
    modifiers: [],
    strategy: undefined,
  },
};

interface SortableProps<TData extends { id: UniqueIdentifier }>
  extends DndContextProps {
  /**
   * An array of data items that the sortable component will render.
   * @example
   * value={[
   *   { id: 1, name: 'Item 1' },
   *   { id: 2, name: 'Item 2' },
   * ]}
   */
  value: TData[];

  /**
   * An optional callback function that is called when the order of the data items changes.
   * It receives the new array of items as its argument.
   * @example
   * onValueChange={(items) => console.log(items)}
   */
  onValueChange?: (items: TData[]) => void;

  /**
   * An optional callback function that is called when an item is moved.
   * It receives an event object with `activeIndex` and `overIndex` properties, representing the original and new positions of the moved item.
   * This will override the default behavior of updating the order of the data items.
   * @type (event: { activeIndex: number; overIndex: number }) => void
   * @example
   * onMove={(event) => console.log(`Item moved from index ${event.activeIndex} to index ${event.overIndex}`)}
   */
  onMove?: (event: { activeIndex: number; overIndex: number }) => void;

  /**
   * A collision detection strategy that will be used to determine the closest sortable item.
   * @default closestCenter
   * @type DndContextProps["collisionDetection"]
   */
  collisionDetection?: DndContextProps['collisionDetection'];

  /**
   * An array of modifiers that will be used to modify the behavior of the sortable component.
   * @default
   * [restrictToVerticalAxis, restrictToParentElement]
   * @type Modifier[]
   */
  modifiers?: DndContextProps['modifiers'];

  /**
   * A sorting strategy that will be used to determine the new order of the data items.
   * @default verticalListSortingStrategy
   * @type SortableContextProps["strategy"]
   */
  strategy?: unknown;

  /**
   * Specifies the axis for the drag-and-drop operation. It can be "vertical", "horizontal", or "both".
   * @default "vertical"
   * @type "vertical" | "horizontal" | "mixed"
   */
  orientation?: 'vertical' | 'horizontal' | 'mixed';

  /**
   * An optional React node that is rendered on top of the sortable component.
   * It can be used to display additional information or controls.
   * @default null
   * @type JSX.Element | null
   * @example
   * overlay={<Skeleton className="w-full h-8" />}
   */
  overlay?: JSX.Element | null;
}

function Sortable<TData extends { id: UniqueIdentifier }>(
  props: SortableProps<TData>,
) {
  const [local, rest] = splitProps(props, [
    'value',
    'onValueChange',
    'collisionDetection',
    'modifiers',
    'strategy',
    'onMove',
    'orientation',
    'overlay',
    'children',
  ]);
  const [activeId, setActiveId] = createSignal<UniqueIdentifier | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor),
  );

  const orientation = () => local.orientation ?? 'vertical';
  const config = () => orientationConfig[orientation()];

  return (
    <DndContext
      modifiers={local.modifiers ?? config().modifiers}
      sensors={sensors}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over.id) {
          const activeIndex = local.value.findIndex(
            (item) => item.id === active.id,
          );
          const overIndex = local.value.findIndex(
            (item) => item.id === over.id,
          );

          if (local.onMove) {
            local.onMove({ activeIndex, overIndex });
          } else {
            local.onValueChange?.(move(local.value, activeIndex, overIndex));
          }
        }
        setActiveId(null);
      }}
      onDragCancel={() => setActiveId(null)}
      collisionDetection={local.collisionDetection ?? closestCenter}
      {...rest}
    >
      {local.children}
      <Show when={local.overlay} fallback={null}>
        <SortableOverlay activeId={activeId()}>{local.overlay}</SortableOverlay>
      </Show>
    </DndContext>
  );
}

const dropAnimationOpts: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.4',
      },
    },
  }),
};

interface SortableOverlayProps extends ComponentProps<typeof DragOverlay> {
  activeId?: UniqueIdentifier | null;
}

function SortableOverlay(props: SortableOverlayProps) {
  const [local, rest] = splitProps(props, [
    'activeId',
    'dropAnimation',
    'children',
  ]);
  const dropAnimation = () => local.dropAnimation ?? dropAnimationOpts;

  return (
    <DragOverlay dropAnimation={dropAnimation()} {...rest}>
      <Show when={local.activeId} fallback={null}>
        <SortableItem value={local.activeId} class="cursor-grabbing">
          {local.children}
        </SortableItem>
      </Show>
    </DragOverlay>
  );
}

interface SortableItemContextProps {
  attributes: JSX.HTMLAttributes<HTMLElement>;
  listeners: DraggableSyntheticListeners | undefined;
  isDragging?: boolean;
}

const SortableItemContext = createContext<Accessor<SortableItemContextProps>>();

function useSortableItem() {
  const context = useContext(SortableItemContext);

  if (!context) {
    throw new Error('useSortableItem must be used within a SortableItem');
  }

  return context();
}

/** Child must be a div */
function SortableItem(props: SortableItemProps) {
  const [local, rest] = splitProps(props, [
    'value',
    'asTrigger',
    'class',
    'className',
    'ref',
    'children',
  ]);
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: () => local.value,
  });

  const context = createMemo<SortableItemContextProps>(() => ({
    attributes,
    listeners,
    isDragging,
  }));
  const style: JSX.CSSProperties = {
    opacity: isDragging ? 0.5 : 1,
    transform: undefined,
    transition: undefined,
  };

  return (
    <SortableItemContext.Provider value={context}>
      <div
        data-state={isDragging ? 'dragging' : undefined}
        class={cn(
          'data-[state=dragging]:cursor-grabbing',
          { 'cursor-grab': !isDragging && local.asTrigger },
          local.class,
          local.className,
        )}
        ref={composeRefs(local.ref, setNodeRef)}
        style={style}
        {...(local.asTrigger ? attributes : {})}
        {...(local.asTrigger ? listeners : {})}
        {...rest}
      >
        {local.children}
      </div>
    </SortableItemContext.Provider>
  );
}

function SortableDragHandle(props: SortableDragHandleProps) {
  const [local, rest] = splitProps(props, ['class', 'className', 'ref']);
  const { attributes, listeners, isDragging } = useSortableItem();

  return (
    <Button
      ref={composeRefs(local.ref)}
      data-state={isDragging ? 'dragging' : undefined}
      class={cn(
        'cursor-grab data-[state=dragging]:cursor-grabbing',
        local.class,
        local.className,
      )}
      type="button"
      {...attributes}
      {...listeners}
      {...rest}
    />
  );
}

export { Sortable, SortableDragHandle, SortableItem, SortableOverlay };

function move<T>(items: T[], from: number, to: number) {
  const item = items[from];
  if (item === undefined) {
    return items;
  }
  return items.filter((_, index) => index !== from).toSpliced(to, 0, item);
}

type SortableItemProps = JSX.IntrinsicElements['div'] & {
  className?: string;
  value: UniqueIdentifier;
  asTrigger?: boolean;
};

type SortableDragHandleProps = ButtonProps & {
  withHandle?: boolean;
};
