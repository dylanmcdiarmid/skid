import { useState } from 'react';
import {
  type DragHandleProps,
  SortableList,
  useSortableListData,
} from '@/components/sortable-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const initialItems = [
  { id: '1', title: 'Research Competitors', status: 'Pending' },
  { id: '2', title: 'Draft Proposal', status: 'In Progress' },
  { id: '3', title: 'Review with Team', status: 'Blocked' },
  { id: '4', title: 'Final Polish', status: 'Pending' },
];

const DemoItem = ({
  item,
  dragHandleProps,
}: {
  item: (typeof initialItems)[0];
  dragHandleProps: DragHandleProps;
}) => {
  return (
    <div className="mb-2 flex items-center gap-4 rounded-md border bg-white p-3 shadow-sm transition-colors hover:border-brand-accent/50 dark:bg-neutral-900">
      <button
        {...dragHandleProps.attributes}
        {...dragHandleProps.listeners}
        className="cursor-grab rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 active:cursor-grabbing dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
        ref={dragHandleProps.ref}
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
          <title>Drag Handle</title>
          <circle cx="9" cy="12" r="1" />
          <circle cx="9" cy="5" r="1" />
          <circle cx="9" cy="19" r="1" />
          <circle cx="15" cy="12" r="1" />
          <circle cx="15" cy="5" r="1" />
          <circle cx="15" cy="19" r="1" />
        </svg>
      </button>
      <div className="flex-1">
        <h4 className="font-medium text-sm">{item.title}</h4>
        <p className="text-muted-foreground text-xs">{item.status}</p>
      </div>
      <div className="rounded bg-neutral-100 px-2 py-1 font-mono text-muted-foreground text-xs dark:bg-neutral-800">
        ID: {item.id}
      </div>
    </div>
  );
};

export default function DemoSortableList() {
  const [items, setItems] = useState(initialItems);
  const [listData] = useSortableListData();

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-2xl tracking-tight">
          Sortable List Demo
        </h1>
        <p className="text-muted-foreground">
          Drag items by the handle on the left to reorder them. The state is
          synchronized with a Jotai atom.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task List Example</CardTitle>
        </CardHeader>
        <CardContent>
          <SortableList
            items={items}
            onReorder={setItems}
            renderItem={(item, props) => (
              <DemoItem dragHandleProps={props} item={item} />
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atom State Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md bg-neutral-950 p-4">
            <pre className="overflow-auto font-mono text-green-400 text-xs">
              {JSON.stringify(listData, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
