import { fireEvent } from '@testing-library/react';
import { render } from '@tests/test-utils';
import QUnit from 'qunit';
import { DataTable } from './data-table';
import type { ColumnDef } from './types';

const { module, test } = QUnit;

interface TestData {
  id: string;
  name: string;
  age: number;
}

const columns: ColumnDef<TestData>[] = [
  { header: 'Name', accessorKey: 'name', enableSorting: true },
  { header: 'Age', accessorKey: 'age' },
];

const data: TestData[] = [
  { id: '1', name: 'Alice', age: 30 },
  { id: '2', name: 'Bob', age: 25 },
  { id: '3', name: 'Charlie', age: 35 },
];

module('Component | DataTable', () => {
  test('renders data correctly', async (assert) => {
    const { findByText } = render(<DataTable columns={columns} data={data} />);

    assert.dom(await findByText('Alice')).exists();
    assert.dom(await findByText('Bob')).exists();
    assert.dom(await findByText('Charlie')).exists();
  });

  test('renders headers', async (assert) => {
    const { findByText } = render(<DataTable columns={columns} data={data} />);

    assert.dom(await findByText('Name')).exists();
    assert.dom(await findByText('Age')).exists();
  });

  test('handles sorting', async (assert) => {
    let sortState: any = { columnId: 'name', direction: 'asc' };
    const onSortChange = (state: any) => {
      sortState = state;
    };

    const { findByText, rerender } = render(
      <DataTable
        columns={columns}
        data={data}
        onSortChange={onSortChange}
        sortState={sortState}
      />
    );

    const header = await findByText('Name');
    
    // Asc -> Desc
    fireEvent.click(header.closest('th')!);
    assert.deepEqual(sortState, { columnId: 'name', direction: 'desc' });

    // Desc -> Asc
    rerender(
      <DataTable
        columns={columns}
        data={data}
        onSortChange={onSortChange}
        sortState={sortState}
      />
    );
    fireEvent.click(header.closest('th')!);
    assert.deepEqual(sortState, { columnId: 'name', direction: 'asc' });
  });

  test('renders empty state', async (assert) => {
    const { findByText } = render(<DataTable columns={columns} data={[]} />);

    assert.dom(await findByText('No results.')).exists();
  });

  test('handles row selection', async (assert) => {
    let selectedIds: string[] = [];
    const onSelectionChange = (ids: string[]) => {
      selectedIds = ids;
    };

    const { container } = render(
      <DataTable
        columns={columns}
        data={data}
        onSelectionChange={onSelectionChange}
        selectedIds={selectedIds}
      />
    );

    const checkboxes = container.querySelectorAll('[role="checkbox"]');
    // First is select all, others are rows
    fireEvent.click(checkboxes[1]);

    assert.deepEqual(selectedIds, ['1']);
  });

  test('handles select all', async (assert) => {
    let selectedIds: string[] = [];
    const onSelectionChange = (ids: string[]) => {
      selectedIds = ids;
    };

    const { container } = render(
      <DataTable
        columns={columns}
        data={data}
        onSelectionChange={onSelectionChange}
        selectedIds={selectedIds}
      />
    );

    const selectAll = container.querySelector('thead [role="checkbox"]');
    fireEvent.click(selectAll!);

    assert.deepEqual(selectedIds, ['1', '2', '3']);
  });

  test('handles expand row', async (assert) => {
    const expandedRowRender = (item: TestData) => <div>Extra: {item.name}</div>;

    const { findByText, findAllByRole } = render(
      <DataTable
        columns={columns}
        data={data}
        expandedRowRender={expandedRowRender}
      />
    );

    // Find expand buttons (chevron)
    // We need to target the specific button. Since we don't have testIds, we can look for rows and then the button.
    // Or just rely on the fact that they are buttons in the first cell (after checkbox if present, but no checkbox here)
    // Let's assume expandOnClick=false default, so buttons are present.

    const buttons = await findAllByRole('button');
    // Assuming first button is for first row
    fireEvent.click(buttons[0]);

    assert.dom(await findByText('Extra: Alice')).exists();
  });
});
