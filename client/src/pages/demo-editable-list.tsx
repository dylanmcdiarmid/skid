import { useState } from 'react';
import { ClickableSeamlessEditor } from '@/components/clickable-seamless-editor';
import {
  generateNewItemId,
  type ItemControlProps,
  SortableList,
  useSortableListData,
} from '@/components/sortable-list';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface EditableItemData {
  id: string;
  text: string;
}

const initialItems: EditableItemData[] = [
  { id: '1', text: 'Buy groceries' },
  { id: '2', text: 'Walk the dog' },
  { id: '3', text: 'Read a book' },
];

const EditableListItem = ({
  item,
  controlProps,
  onTextChange,
  onEditStart,
  onEditEnd,
}: {
  item: EditableItemData;
  controlProps: ItemControlProps;
  onTextChange: (text: string) => void;
  onEditStart: () => void;
  onEditEnd: () => void;
}) => {
  return (
    <div className="mb-2 flex items-center gap-3 rounded-md border bg-white p-2 shadow-sm transition-all hover:border-brand-accent/50 dark:bg-neutral-900">
      <button
        {...controlProps.attributes}
        {...controlProps.listeners}
        className="cursor-grab rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 active:cursor-grabbing dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
        ref={controlProps.ref}
        type="button"
      >
        <svg
          fill="none"
          height="16"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Drag handle</title>
          <circle cx="9" cy="12" r="1" />
          <circle cx="9" cy="5" r="1" />
          <circle cx="9" cy="19" r="1" />
          <circle cx="15" cy="12" r="1" />
          <circle cx="15" cy="5" r="1" />
          <circle cx="15" cy="19" r="1" />
        </svg>
      </button>

      <div className="flex-1">
        <ClickableSeamlessEditor
          className="hover:bg-neutral-100 dark:hover:bg-neutral-800"
          onEditCancel={onEditEnd}
          onEditComplete={(text) => {
            onTextChange(text);
            onEditEnd();
          }}
          onEditStart={onEditStart}
          sourceText={item.text}
        />
      </div>

      {controlProps.onDelete && (
        <button
          className="rounded p-1 text-neutral-400 opacity-0 transition-opacity hover:bg-red-100 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-900/30 dark:hover:text-red-400"
          onClick={controlProps.onDelete}
          title="Delete item"
          type="button"
        >
          <svg
            fill="none"
            height="16"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Delete</title>
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      )}
    </div>
  );
};

const ItemWrapper = ({ children, ...props }: any) => (
  <div {...props} className="group">
    {children}
  </div>
);

export default function DemoEditableList() {
  const [items, setItems] = useState<EditableItemData[]>(initialItems);
  const [sortableState] = useSortableListData();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'key' | 'button'>('button');

  const handleAddItem = () => {
    const newItem: EditableItemData = {
      id: generateNewItemId(),
      text: '',
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id: string, text: string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, text } : item)));
  };

  // Merge logic for display
  const mergedData = sortableState.map((sortItem) => {
    const itemData = items.find((i) => i.id === sortItem.id);
    return {
      ...sortItem,
      ...itemData,
      isNew: sortItem.id.startsWith('new:'),
    };
  });

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-2xl tracking-tight">
          Editable List Demo
        </h1>
        <p className="text-muted-foreground">
          Combine SortableList with EditableText to create a fully functional
          list editor.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <div className="space-y-0.5">
          <h3 className="font-medium text-base">Delete Mode</h3>
          <p className="text-muted-foreground text-sm">
            {deleteMode === 'button'
              ? 'Click the trash icon to delete'
              : 'Hover and press Delete/Backspace'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`text-sm ${deleteMode === 'key' ? 'font-medium' : 'text-muted-foreground'}`}
          >
            Key
          </span>
          <Switch
            checked={deleteMode === 'button'}
            onCheckedChange={(checked: boolean) =>
              setDeleteMode(checked ? 'button' : 'key')
            }
          />
          <span
            className={`text-sm ${deleteMode === 'button' ? 'font-medium' : 'text-muted-foreground'}`}
          >
            Button
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Shopping List</CardTitle>
          <CardDescription>
            {isEditing
              ? 'Editing in progress - deletion disabled'
              : 'Drag to reorder, click text to edit'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SortableList
            addButtonLabel="Add Item"
            deleteMode={deleteMode}
            items={items}
            keyboardShortcutsDisabled={isEditing}
            onAdd={handleAddItem}
            onRemove={handleRemoveItem}
            onReorder={setItems}
            renderItem={(item, props) => (
              <EditableListItem
                controlProps={props}
                item={item}
                onEditEnd={() => setIsEditing(false)}
                onEditStart={() => setIsEditing(true)}
                onTextChange={(text) => handleUpdateItem(item.id, text)}
              />
            )}
            showAddButton
            WrapperComponent={ItemWrapper}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Merged Data Structure</CardTitle>
          <CardDescription>
            Combining sort order from atom + content from state
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md bg-neutral-950 p-4">
            <pre className="overflow-auto font-mono text-green-400 text-xs">
              {JSON.stringify(mergedData, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
