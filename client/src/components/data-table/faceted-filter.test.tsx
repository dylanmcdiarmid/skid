import userEvent from '@testing-library/user-event';
import { getPopperContentQueries, render } from '@tests/test-utils';
import QUnit from 'qunit';
import { FacetedFilter } from './faceted-filter';

const { module, test } = QUnit;

const options = [
  { label: 'Option 1', value: 'opt1' },
  { label: 'Option 2', value: 'opt2' },
  { label: 'Option 3', value: 'opt3' },
];

module('Component | FacetedFilter', (hooks) => {
  let user: ReturnType<typeof userEvent.setup>;

  hooks.beforeEach(() => {
    user = userEvent.setup();
  });

  test('renders with title', async (assert) => {
    const { findByText } = render(
      <FacetedFilter
        title="Test Filter"
        options={options}
        selectedValues={new Set()}
        onSelect={() => {}}
      />
    );

    assert.dom(await findByText('Test Filter')).exists();
  });

  test('opens dropdown and shows options', async (assert) => {
    const { findByRole } = render(
      <FacetedFilter
        title="Test Filter"
        options={options}
        selectedValues={new Set()}
        onSelect={() => {}}
      />
    );

    const trigger = await findByRole('button', { name: /Test Filter/ });
    await user.click(trigger);

    const contentQueries = getPopperContentQueries();
    assert.dom(await contentQueries.findByText('Option 1')).exists();
    assert.dom(await contentQueries.findByText('Option 2')).exists();
    assert.dom(await contentQueries.findByText('Option 3')).exists();
  });

  test('calls onSelect when option clicked', async (assert) => {
    let selectedValue = '';
    const onSelect = (val: string) => {
      selectedValue = val;
    };

    const { findByRole } = render(
      <FacetedFilter
        title="Test Filter"
        options={options}
        selectedValues={new Set()}
        onSelect={onSelect}
      />
    );

    const trigger = await findByRole('button', { name: /Test Filter/ });
    await user.click(trigger);

    const contentQueries = getPopperContentQueries();
    const option1 = await contentQueries.findByText('Option 1');
    await user.click(option1);

    assert.strictEqual(selectedValue, 'opt1');
  });

  test('shows badge count when items selected', async (assert) => {
    const selectedValues = new Set(['opt1', 'opt2']);

    const { findByText } = render(
      <FacetedFilter
        title="Test Filter"
        options={options}
        selectedValues={selectedValues}
        onSelect={() => {}}
      />
    );

    // The badges are inside the button, not in a portal, so standard findByText should work.
    assert.dom(await findByText('Option 1')).exists();
    assert.dom(await findByText('Option 2')).exists();
  });

  test('calls onClear when clear button clicked', async (assert) => {
    let cleared = false;
    const onClear = () => {
      cleared = true;
    };
    const selectedValues = new Set(['opt1']);

    const { findByRole } = render(
      <FacetedFilter
        title="Test Filter"
        options={options}
        selectedValues={selectedValues}
        onSelect={() => {}}
        onClear={onClear}
      />
    );

    const trigger = await findByRole('button', { name: /Test Filter/ });
    await user.click(trigger);

    const contentQueries = getPopperContentQueries();
    const clearButton = await contentQueries.findByText('Clear filters');
    await user.click(clearButton);

    assert.true(cleared);
  });
});
