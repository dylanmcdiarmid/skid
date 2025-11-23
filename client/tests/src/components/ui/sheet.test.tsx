import QUnit from "qunit";

const { module, test } = QUnit;

import userEvent from "@testing-library/user-event";
import { getSheetContentQueries, render } from "@tests/test-utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

module("Component | Sheet", (hooks) => {
  let user: ReturnType<typeof userEvent.setup>;

  hooks.beforeEach(() => {
    user = userEvent.setup();
  });

  test("renders sheet with trigger and content", async (assert) => {
    const { getByText } = render(
      <Sheet>
        <SheetTrigger asChild>
          <button type="button">Open Sheet</button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>Sheet description</SheetDescription>
          </SheetHeader>
          <div>Sheet content</div>
        </SheetContent>
      </Sheet>
    );

    assert.dom(getByText("Open Sheet")).exists();

    const trigger = getByText("Open Sheet");
    await user.click(trigger);

    const contentQueries = getSheetContentQueries();
    assert.dom(await contentQueries.findByText("Sheet Title")).exists();
    assert.dom(contentQueries.getByText("Sheet description")).exists();
    assert.dom(contentQueries.getByText("Sheet content")).exists();
  });
});
