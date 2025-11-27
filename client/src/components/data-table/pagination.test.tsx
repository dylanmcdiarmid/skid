import { fireEvent } from '@testing-library/react';
import { render } from '@tests/test-utils';
import QUnit from 'qunit';
import { Pagination } from './pagination';

const { module, test } = QUnit;

module('Component | Pagination', () => {
  test('renders correct page info', async (assert) => {
    const { findByText } = render(
      <Pagination
        currentPage={2}
        onPageChange={() => {
          // do nothing
        }}
        pageSize={20}
        totalItems={195}
        totalPages={10}
      />
    );

    assert.dom(await findByText('Page 2 of 10 (195 items)')).exists();
  });

  test('renders page buttons', async (assert) => {
    const { findByText } = render(
      <Pagination
        currentPage={1}
        onPageChange={() => {
          // do nothing
        }}
        pageSize={10}
        totalItems={50}
        totalPages={5}
      />
    );

    assert.dom(await findByText('1')).exists();
    assert.dom(await findByText('5')).exists();
  });

  test('handles page change', async (assert) => {
    let clickedPage = 0;
    const onPageChange = (page: number) => {
      clickedPage = page;
    };

    const { findByText } = render(
      <Pagination
        currentPage={1}
        onPageChange={onPageChange}
        pageSize={10}
        totalItems={50}
        totalPages={5}
      />
    );

    fireEvent.click(await findByText('2'));
    assert.equal(clickedPage, 2);
  });

  test('next button works', async (assert) => {
    let clickedPage = 0;
    const onPageChange = (page: number) => {
      clickedPage = page;
    };

    const { findByLabelText } = render(
      <Pagination
        currentPage={1}
        onPageChange={onPageChange}
        pageSize={10}
        totalItems={50}
        totalPages={5}
      />
    );

    fireEvent.click(await findByLabelText('Next page'));
    assert.equal(clickedPage, 2);
  });

  test('prev button works', async (assert) => {
    let clickedPage = 0;
    const onPageChange = (page: number) => {
      clickedPage = page;
    };

    const { findByLabelText } = render(
      <Pagination
        currentPage={2}
        onPageChange={onPageChange}
        pageSize={10}
        totalItems={50}
        totalPages={5}
      />
    );

    fireEvent.click(await findByLabelText('Previous page'));
    assert.equal(clickedPage, 1);
  });

  test('disableMode loading prevents clicks', async (assert) => {
    let clickedPage = 0;
    const onPageChange = (page: number) => {
      clickedPage = page;
    };

    const { findByLabelText } = render(
      <Pagination
        currentPage={1}
        disableMode="loading"
        isLoading={true}
        onPageChange={onPageChange}
        pageSize={10}
        totalItems={50}
        totalPages={5}
      />
    );

    const nextButton = await findByLabelText('Next page');
    fireEvent.click(nextButton);
    assert.equal(clickedPage, 0);
    assert.dom(nextButton).hasAttribute('disabled');
  });

  test('disableMode static allows clicks while loading', async (assert) => {
    let clickedPage = 0;
    const onPageChange = (page: number) => {
      clickedPage = page;
    };

    const { findByLabelText } = render(
      <Pagination
        currentPage={1}
        disableMode="static"
        isLoading={true}
        onPageChange={onPageChange}
        pageSize={10}
        totalItems={50}
        totalPages={5}
      />
    );

    const nextButton = await findByLabelText('Next page');
    fireEvent.click(nextButton);
    assert.equal(clickedPage, 2);
    assert.dom(nextButton).doesNotHaveAttribute('disabled');
  });
});
