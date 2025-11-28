import { fireEvent } from '@testing-library/react';
import { render } from '@tests/test-utils';
import QUnit from 'qunit';
import { ActiveFiltersList, type ActiveFilter } from './active-filters-list';

const { module, test } = QUnit;

module('Component | ActiveFiltersList', () => {
  test('renders nothing when filters is empty', async (assert) => {
    const { container } = render(<ActiveFiltersList filters={[]} />);
    assert.dom(container).hasText('');
  });

  test('renders filters', async (assert) => {
    const filters: ActiveFilter[] = [
      { id: '1', label: 'Role', value: 'Admin', onRemove: () => {} },
      { id: '2', label: 'Search', value: 'test', onRemove: () => {} },
    ];

    const { findByText } = render(<ActiveFiltersList filters={filters} />);

    assert.dom(await findByText('Role')).exists();
    assert.dom(await findByText('Admin')).exists();
    assert.dom(await findByText('Search')).exists();
    assert.dom(await findByText('test')).exists();
  });

  test('calls onRemove when clicked', async (assert) => {
    let removedId = '';
    const filters: ActiveFilter[] = [
      {
        id: '1',
        label: 'Role',
        value: 'Admin',
        onRemove: () => {
          removedId = '1';
        },
      },
    ];

    const { findByText } = render(<ActiveFiltersList filters={filters} />);

    const filterBadge = await findByText('Role');
    // The badge itself has the onClick handler
    fireEvent.click(filterBadge.closest('.inline-flex')!);

    assert.strictEqual(removedId, '1');
  });
});

