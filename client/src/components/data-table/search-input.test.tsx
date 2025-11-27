import { fireEvent } from '@testing-library/react';
import { render } from '@tests/test-utils';
import QUnit from 'qunit';
import { SearchInput } from './search-input';

const { module, test } = QUnit;

module('Component | SearchInput', () => {
  test('renders input element', async (assert) => {
    const { findByPlaceholderText } = render(
      <SearchInput value="" onChange={() => {}} />
    );

    assert.dom(await findByPlaceholderText('Search...')).exists();
  });

  test('handles input change', async (assert) => {
    let val = '';
    const onChange = (v: string) => {
      val = v;
    };

    const { findByPlaceholderText } = render(
      <SearchInput value="" onChange={onChange} />
    );

    const input = await findByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'test' } });
    assert.equal(val, 'test');
  });

  test('renders column selector when searchableColumns provided', async (assert) => {
    const searchableColumns = [
      { label: 'Name', value: 'name' },
      { label: 'Email', value: 'email' },
    ];

    const { findByRole, findAllByRole } = render(
      <SearchInput
        value=""
        onChange={() => {}}
        searchableColumns={searchableColumns}
        selectedColumn="name"
        onColumnChange={() => {}}
      />
    );

    // Select is now a native select element
    assert.dom(await findByRole('combobox')).exists();
    const options = await findAllByRole('option');
    // 1 disabled default + 2 provided options. Hidden option might not be returned by default query.
    // So we check for the 2 visible options.
    assert.ok(options.length >= 2);
    assert.dom(options.find((o) => o.textContent === 'Name')).exists();
    assert.dom(options.find((o) => o.textContent === 'Email')).exists();
  });

  test('handles column change', async (assert) => {
    let col = '';
    const onColumnChange = (c: string) => {
      col = c;
    };

    const searchableColumns = [
      { label: 'Name', value: 'name' },
      { label: 'Email', value: 'email' },
    ];

    const { findByRole } = render(
      <SearchInput
        value=""
        onChange={() => {}}
        searchableColumns={searchableColumns}
        selectedColumn="name"
        onColumnChange={onColumnChange}
      />
    );

    const select = await findByRole('combobox');
    fireEvent.change(select, { target: { value: 'email' } });
    assert.equal(col, 'email');
  });
});

