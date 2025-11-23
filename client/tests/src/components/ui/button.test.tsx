import QUnit from "qunit";

const { module, test } = QUnit;

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

module("Component | Button", () => {
  test("renders with default role and text", (assert) => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole("button", { name: "Click me" });
    assert.dom(btn).exists();
  });

  test("fires onClick when clicked", async (assert) => {
    assert.expect(2);
    const user = userEvent.setup();
    let clicked = 0;
    render(
      <Button
        onClick={() => {
          clicked += 1;
        }}
      >
        Tap
      </Button>
    );
    const btn = screen.getByRole("button", { name: "Tap" });
    assert.dom(btn).exists();
    await user.click(btn);
    assert.strictEqual(clicked, 1, "onClick fired once");
  });
});
