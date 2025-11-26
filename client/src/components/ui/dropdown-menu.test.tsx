import QUnit from "qunit";

const { module, test } = QUnit;

import userEvent from "@testing-library/user-event";
import { getPopperContentQueries, render } from "@tests/test-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

module("Component | DropdownMenu", (hooks) => {
  let user: ReturnType<typeof userEvent.setup>;

  hooks.beforeEach(() => {
    user = userEvent.setup();
  });

  test("renders dropdown menu with trigger and content", (assert) => {
    const { getByText } = render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button">Open Menu</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    assert.dom(getByText("Open Menu")).exists();
  });

  test("renders dropdown menu items", async (assert) => {
    const { getByText } = render(
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const trigger = getByText("Open Menu");
    await user.click(trigger);

    const contentQueries = getPopperContentQueries();
    assert.dom(await contentQueries.findByText("Item 1")).exists();
    assert.dom(contentQueries.getByText("Item 2")).exists();
  });

  test("calls onSelect when item is selected", async (assert) => {
    let called = false;
    const { getByText } = render(
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              called = true;
            }}
          >
            Select Me
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    const trigger = getByText("Open Menu");
    await user.click(trigger);

    const contentQueries = getPopperContentQueries();
    const item = await contentQueries.findByText("Select Me");
    await user.click(item);
    assert.true(called, "onSelect was called");
  });
});
