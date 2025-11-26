import QUnit from "qunit";

const { module, test } = QUnit;

import { render } from "@tests/test-utils";
import { Label } from "./label";

module("Component | Label", () => {
  test("renders label with text", (assert) => {
    const { getByText } = render(<Label>Test Label</Label>);
    const label = getByText("Test Label");
    assert.dom(label).exists();
  });

  test("works with input element via htmlFor", (assert) => {
    const { getByText, getByRole } = render(
      <div>
        <Label htmlFor="test-input">Test Label</Label>
        <input id="test-input" type="text" />
      </div>
    );

    const label = getByText("Test Label");
    const input = getByRole("textbox");

    assert.dom(label).exists();
    assert.dom(input).exists();
    assert.dom(label).hasAttribute("for", "test-input");
    assert.dom(input).hasAttribute("id", "test-input");
  });
});
