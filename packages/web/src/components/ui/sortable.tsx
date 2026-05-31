import type {
  DndContextProps,
  DraggableSyntheticListeners,
  DropAnimation,
  UniqueIdentifier,
} from '@/lib/solid-dnd-kit';
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
} from '@/lib/solid-dnd-kit';
import { createContext, createMemo, createSignal, useContext } from 'solid-js';

import { Button, type ButtonProps } from '@/components/ui/button';
import { Slot } from '@/components/ui/slot';
import { composeRefs } from '@/lib/compose-refs';
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
   * overlay={<Skeleton class="w-full h-8" />}
   */
  overlay?: JSX.Element | null;
}

function Sortable<TData extends { id: UniqueIdentifier }>({
  value,
  onValueChange,
  collisionDetection = closestCenter,
  modifiers,
  strategy,
  onMove,
  orientation = 'vertical',
  overlay,
  children,
  ...props
}: SortableProps<TData>) {
  const [activeId, setActiveId] = createSignal<UniqueIdentifier | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor),
  );

  const config = orientationConfig[orientation];

  return (
    <DndContext
      modifiers={modifiers ?? config.modifiers}
      sensors={sensors}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over?.id) {
          const activeIndex = value.findIndex((item) => item.id === active.id);
          const overIndex = value.findIndex((item) => item.id === over.id);

          if (onMove) {
            onMove({ activeIndex, overIndex });
          } else {
            onValueChange?.(move(value, activeIndex, overIndex));
          }
        }
        setActiveId(null);
      }}
      onDragCancel={() => setActiveId(null)}
      collisionDetection={collisionDetection}
      {...props}
    >
      {children}
      {overlay ? (
        <SortableOverlay activeId={activeId}>{overlay}</SortableOverlay>
      ) : null}
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

function SortableOverlay({
  activeId,
  dropAnimation = dropAnimationOpts,
  children,
  ...props
}: SortableOverlayProps) {
  let ref: HTMLDivElement | undefined;
  return (
    <DragOverlay dropAnimation={dropAnimation} {...props}>
      {activeId ? (
        <SortableItem
          ref={(el) => {
            ref = el;
          }}
          value={activeId}
          class="cursor-grabbing"
          asChild
        >
          {children}
        </SortableItem>
      ) : null}
    </DragOverlay>
  );
}

interface SortableItemContextProps {
  attributes: JSX.HTMLAttributes<HTMLElement>;
  listeners: DraggableSyntheticListeners | undefined;
  isDragging?: boolean;
}

const SortableItemContext = createContext<SortableItemContextProps>({
  attributes: {},
  listeners: undefined,
  isDragging: false,
});

function useSortableItem() {
  const context = useContext(SortableItemContext);

  if (!context) {
    throw new Error('useSortableItem must be used within a SortableItem');
  }

  return context;
}

/** Child must be a div */
function SortableItem({
  value,
  asTrigger,
  asChild,
  className,
  ref,
  ...props
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id: value });

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

  const Comp = asChild ? Slot.Root : 'div';

  return (
    <SortableItemContext.Provider value={context}>
      <Comp
        data-state={isDragging ? 'dragging' : undefined}
        class={cn(
          'data-[state=dragging]:cursor-grabbing',
          { 'cursor-grab': !isDragging && asTrigger },
          className,
        )}
        ref={composeRefs(ref, setNodeRef as HTMLDivElement | undefined)}
        style={style}
        {...(asTrigger ? attributes : {})}
        {...(asTrigger ? listeners : {})}
        {...props}
      />
    </SortableItemContext.Provider>
  );
}

function SortableDragHandle({
  className,
  ref,
  ...props
}: SortableDragHandleProps) {
  const { attributes, listeners, isDragging } = useSortableItem();

  return (
    <Button
      ref={composeRefs(ref)}
      data-state={isDragging ? 'dragging' : undefined}
      class={cn('cursor-grab data-[state=dragging]:cursor-grabbing', className)}
      type="button"
      {...attributes}
      {...listeners}
      {...props}
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
  value: UniqueIdentifier;
  asTrigger?: boolean;
  asChild?: boolean;
};

type SortableDragHandleProps = ButtonProps & {
  withHandle?: boolean;
};
