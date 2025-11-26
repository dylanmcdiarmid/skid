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
import { type ComponentType, type ReactNode, useEffect } from 'react';

export interface SortOrderItem {
  id: string;
  sortOrder: number;
}

// Atom to store the current state of the sortable list
export const sortableListDataAtom = atom<SortOrderItem[]>([]);

export interface DragHandleProps {
  attributes: any;
  listeners: any;
  ref: (element: HTMLElement | null) => void;
}

interface SortableListProps<T extends { id: string }> {
  items: T[];
  renderItem: (item: T, dragHandleProps: DragHandleProps) => ReactNode;
  onReorder?: (items: T[]) => void;
  WrapperComponent?: ComponentType<{
    'data-item-id': string;
    children: ReactNode;
    ref?: any;
    style?: React.CSSProperties;
    className?: string;
  }>;
  className?: string;
}

interface SortableItemProps<T> {
  item: T;
  renderItem: (item: T, dragHandleProps: DragHandleProps) => ReactNode;
  WrapperComponent: ComponentType<{
    'data-item-id': string;
    children: ReactNode;
    ref?: any;
    style?: React.CSSProperties;
  }>;
}

function SortableItem<T extends { id: string }>({
  item,
  renderItem,
  WrapperComponent,
}: SortableItemProps<T>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <WrapperComponent data-item-id={item.id} ref={setNodeRef} style={style}>
      {renderItem(item, {
        attributes,
        listeners,
        ref: setActivatorNodeRef,
      })}
    </WrapperComponent>
  );
}

export function SortableList<T extends { id: string }>({
  items,
  renderItem,
  onReorder,
  WrapperComponent = 'div' as unknown as ComponentType<{
    'data-item-id': string;
    children: ReactNode;
  }>,
  className,
}: SortableListProps<T>) {
  const [, setSortableItems] = useAtom(sortableListDataAtom);

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

    // Only update if different to avoid loops/unnecessary renders
    // Simple length check and id check
    // This might need to be more robust but works for simple cases
    setSortableItems(newItems);
  }, [items, setSortableItems]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);

      // Update atom
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

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={className}>
          {items.map((item) => (
            <SortableItem
              item={item}
              key={item.id}
              renderItem={renderItem}
              WrapperComponent={WrapperComponent}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export const useSortableListData = () => {
  // Export a hook to access the atom value
  // Note: This accesses the GLOBAL atom.
  // If multiple SortableLists exist, they will share this state.
  // Given the requirements, we assume one active list or this is intended.
  // If we needed scoped state, we'd need to pass the atom or use a provider.
  return useAtom(sortableListDataAtom);
};
