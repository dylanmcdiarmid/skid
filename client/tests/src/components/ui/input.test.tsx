import QUnit from "qunit";

const { module, test } = QUnit;

import userEvent from "@testing-library/user-event";
import { render } from "@tests/test-utils";
import { Input } from "./input";

module("Component | Input", () => {
  test("renders input with default props", (assert) => {
    const { getByRole } = render(<Input />);
    const input = getByRole("textbox");
    assert.dom(input).exists();
  });

  test("handles change events", async (assert) => {
    const user = userEvent.setup();
    let changed = false;

    const { getByRole } = render(
      <Input
        onChange={() => {
          changed = true;
        }}
      />
    );
    const input = getByRole("textbox");

    await user.type(input, "a");
    assert.true(changed, "Change event should fire");
  });

  test("applies disabled state", (assert) => {
    const { getByRole } = render(<Input disabled />);
    const input = getByRole("textbox");
    assert.dom(input).isDisabled();
  });
});
