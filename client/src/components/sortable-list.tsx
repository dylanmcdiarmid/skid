import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { atom, useAtom } from 'jotai';
import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';

export interface SortOrderItem {
  id: string;
  sortOrder: number;
}

// Atom to store the current state of the sortable list
export const sortableListDataAtom = atom<SortOrderItem[]>([]);

export interface ItemControlProps {
  attributes: any;
  listeners: any;
  ref: (element: HTMLElement | null) => void;
  onDelete?: () => void;
  isHovered?: boolean;
}

// Backwards compatibility alias
export type DragHandleProps = ItemControlProps;

interface SortableListProps<T extends { id: string }> {
  items: T[];
  renderItem: (item: T, controlProps: ItemControlProps) => ReactNode;
  onReorder?: (items: T[]) => void;
  WrapperComponent?: ComponentType<{
    'data-item-id': string;
    children: ReactNode;
    ref?: any;
    style?: React.CSSProperties;
    className?: string;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
  }>;
  className?: string;
  deleteMode?: 'key' | 'button' | false;
  keyboardShortcutsDisabled?: boolean;
  onRemove?: (id: string) => void;
  showAddButton?: boolean;
  addButtonLabel?: string;
  addButtonVariant?: 'default' | 'hover-bottom';
  onAdd?: () => void;
}

interface SortableItemProps<T> {
  item: T;
  renderItem: (item: T, controlProps: ItemControlProps) => ReactNode;
  WrapperComponent: ComponentType<{
    'data-item-id': string;
    children: ReactNode;
    ref?: any;
    style?: React.CSSProperties;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
  }>;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onDelete?: () => void;
}

function SortableItemWithHover<T extends { id: string }>({
  item,
  renderItem,
  WrapperComponent,
  onDelete,
}: SortableItemProps<T>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const [isHovered, setIsHovered] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : undefined,
    position: 'relative' as const,
  };

  return (
    <WrapperComponent
      data-item-id={item.id}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      ref={setNodeRef}
      style={style}
    >
      {renderItem(item, {
        attributes,
        listeners,
        ref: setActivatorNodeRef,
        onDelete,
        isHovered: isHovered || isDragging,
      })}
    </WrapperComponent>
  );
}

export function generateNewItemId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `new:${crypto.randomUUID()}`;
  }
  // Fallback for environments without crypto.randomUUID (though modern browsers have it)
  return `new:${Math.random().toString(36).substring(2, 15)}`;
}

type KeyboardAction = 'delete' | 'moveUp' | 'moveDown';

const keyActionMap: Record<string, KeyboardAction> = {
  Delete: 'delete',
  Backspace: 'delete',
  ArrowUp: 'moveUp',
  ArrowDown: 'moveDown',
};

function isInputActive() {
  const activeTag = document.activeElement?.tagName.toLowerCase();
  return activeTag === 'input' || activeTag === 'textarea';
}

export function SortableList<T extends { id: string }>({
  items,
  renderItem,
  onReorder,
  WrapperComponent = 'div' as unknown as ComponentType<{
    'data-item-id': string;
    children: ReactNode;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
  }>,
  className,
  deleteMode = false,
  keyboardShortcutsDisabled = false,
  onRemove,
  showAddButton = false,
  addButtonLabel = 'Add Item',
  addButtonVariant,
  onAdd,
}: SortableListProps<T>) {
  const [, setSortableItems] = useAtom(sortableListDataAtom);
  const [hoveredItemId, _setHoveredItemId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sync props items to atom state
  useEffect(() => {
    const newItems = items.map((item, index) => ({
      id: item.id,
      sortOrder: index,
    }));

    setSortableItems(newItems);
  }, [items, setSortableItems]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);

      setSortableItems(
        newItems.map((item, index) => ({
          id: item.id,
          sortOrder: index,
        }))
      );

      if (onReorder) {
        onReorder(newItems);
      }
    }
  };

  const performReorder = useCallback(
    (currentIndex: number, newIndex: number) => {
      const newItems = arrayMove(items, currentIndex, newIndex);

      setSortableItems(
        newItems.map((item, index) => ({
          id: item.id,
          sortOrder: index,
        }))
      );

      if (onReorder) {
        onReorder(newItems);
      }
    },
    [items, onReorder, setSortableItems]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (keyboardShortcutsDisabled || !hoveredItemId) {
        return;
      }

      if (isInputActive()) {
        return;
      }

      const action = keyActionMap[event.key];
      if (!action) {
        return;
      }

      if (action === 'delete') {
        if (deleteMode === 'key') {
          onRemove?.(hoveredItemId);
        }
        return;
      }

      const currentIndex = items.findIndex((item) => item.id === hoveredItemId);
      if (currentIndex === -1) {
        return;
      }

      let newIndex = currentIndex;
      if (action === 'moveUp' && currentIndex > 0) {
        newIndex = currentIndex - 1;
      } else if (action === 'moveDown' && currentIndex < items.length - 1) {
        newIndex = currentIndex + 1;
      }

      if (newIndex !== currentIndex) {
        event.preventDefault();
        performReorder(currentIndex, newIndex);
      }
    },
    [
      keyboardShortcutsDisabled,
      hoveredItemId,
      items,
      deleteMode,
      performReorder,
      onRemove,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div className={className}>
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        sensors={sensors}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div>
            {items.map((item) => (
              <SortableItemWithHover
                item={item}
                key={item.id}
                onDelete={
                  deleteMode === 'button' &&
                  !keyboardShortcutsDisabled &&
                  onRemove
                    ? () => onRemove(item.id)
                    : undefined
                }
                renderItem={renderItem}
                WrapperComponent={WrapperComponent}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {showAddButton &&
        (!addButtonVariant || addButtonVariant === 'default') && (
          <div className="mt-2">
            <button
              className="flex w-full items-center justify-center rounded-md border-2 border-border border-dashed py-3 font-medium text-muted-foreground text-sm transition-colors hover:border-brand-accent hover:text-brand-accent"
              onClick={onAdd}
              type="button"
            >
              <span className="mr-2">+</span>
              {addButtonLabel}
            </button>
          </div>
        )}

      {showAddButton && addButtonVariant === 'hover-bottom' && (
        // This wrapper is needed to only trigger hover state when actually hovering the button area
        // The previous implementation triggered when hovering the parent container because of how group/group-hover works
        // We use group/add to scope the hover effect specifically to this container
        <div className="group/add relative mt-1">
          <button
            aria-label={addButtonLabel}
            className="relative flex w-full cursor-pointer items-center justify-center py-1 outline-none"
            onClick={onAdd}
            type="button"
          >
            <div className="absolute right-0 left-0 h-px bg-border/50 opacity-0 transition-opacity group-hover/add:opacity-100" />
            <div className="z-10 flex h-5 w-5 items-center justify-center rounded-full border bg-background opacity-0 shadow-sm transition-opacity group-hover/add:opacity-100">
              <span className="text-[10px] text-muted-foreground">+</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export const useSortableListData = () => {
  // Export a hook to access the atom value
  return useAtom(sortableListDataAtom);
};
