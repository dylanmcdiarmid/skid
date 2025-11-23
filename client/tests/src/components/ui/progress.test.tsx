import QUnit from "qunit";

const { module, test } = QUnit;

import { render } from "@tests/test-utils";
import { Progress } from "./progress";

module("Component | Progress", () => {
  test("renders progress with specific value", (assert) => {
    const { getByRole } = render(<Progress value={50} />);
    const progress = getByRole("progressbar");
    assert.dom(progress).exists();

    const progressBar = progress.children[0];
    assert.dom(progressBar).exists();
    assert.dom(progressBar).hasAttribute("style", "width: 50%;");
  });

  test("sets aria attributes correctly", (assert) => {
    const { getByRole } = render(<Progress value={50} />);
    const progress = getByRole("progressbar");
    assert.dom(progress).hasAttribute("aria-valuemin", "0");
    assert.dom(progress).hasAttribute("aria-valuemax", "100");
    assert.dom(progress).hasAttribute("aria-valuenow", "50");
  });
});
