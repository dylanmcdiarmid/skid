import QUnit from "qunit";

const { module, test } = QUnit;

import userEvent from "@testing-library/user-event";
import { getPopperContentQueries, render } from "@tests/test-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

module("Component | Tooltip", (hooks) => {
  let user: ReturnType<typeof userEvent.setup>;

  hooks.beforeEach(() => {
    user = userEvent.setup();
  });

  test("renders tooltip with trigger and content", async (assert) => {
    const { getByText } = render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>
            <p>Tooltip content</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    assert.dom(getByText("Hover me")).exists();

    const trigger = getByText("Hover me");
    await user.hover(trigger);

    const contentQueries = getPopperContentQueries();
    // Use getAllByText since tooltip might render multiple elements
    const tooltips = await contentQueries.findAllByText("Tooltip content");
    assert.ok(tooltips.length > 0, "Tooltip content should exist");
  });
});
