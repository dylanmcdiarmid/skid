import QUnit from "qunit";

const { module, test } = QUnit;

import userEvent from "@testing-library/user-event";
import { render } from "@tests/test-utils";
import { Select } from "./select";

module("Component | Select", () => {
  test("renders select with options", (assert) => {
    const { getByRole, getByText } = render(
      <Select>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
        <option value="option3">Option 3</option>
      </Select>
    );

    const select = getByRole("combobox");
    assert.dom(select).exists();
    assert.dom(getByText("Option 1")).exists();
    assert.dom(getByText("Option 2")).exists();
    assert.dom(getByText("Option 3")).exists();
  });

  test("handles user selection", async (assert) => {
    const user = userEvent.setup();
    let changed = false;

    const { getByRole } = render(
      <Select
        onChange={() => {
          changed = true;
        }}
      >
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </Select>
    );

    const select = getByRole("combobox");
    await user.selectOptions(select, "option2");
    assert.true(changed, "Change event should fire");
    assert.dom(select).hasValue("option2");
  });

  test("applies disabled state", (assert) => {
    const { getByRole } = render(
      <Select disabled>
        <option>Test</option>
      </Select>
    );

    const select = getByRole("combobox");
    assert.dom(select).isDisabled();
  });
});
