import QUnit from "qunit";

const { module, test } = QUnit;

import { render, screen } from "@testing-library/react";
import { Sparkline } from "./sparkline";

module("Component | Sparkline", () => {
  test("renders svg with title and path for data", (assert) => {
    const { container } = render(<Sparkline values={[1, 3, 2, 5]} />);
    const title = screen.getByTitle("Sparkline");
    assert.dom(title).exists();
    const svg = container.querySelector("svg");
    assert.ok(svg, "svg exists");
    assert.strictEqual(svg?.getAttribute("aria-hidden"), "true");
    const path = container.querySelector("path");
    assert.ok(path, "path exists");
    assert.ok(
      (path as SVGPathElement).getAttribute("d")?.length,
      "path d is non-empty"
    );
  });

  test("renders empty path when values are empty", (assert) => {
    const { container } = render(<Sparkline values={[]} />);
    const path = container.querySelector("path");
    assert.ok(path, "path exists");
    assert.strictEqual((path as SVGPathElement).getAttribute("d"), "");
  });

  test("respects width/height/stroke props", (assert) => {
    const { container } = render(
      <Sparkline height={50} stroke="#ff00aa" values={[0, 1]} width={200} />
    );
    const svg = container.querySelector("svg");
    const path = container.querySelector("path");
    assert.strictEqual(svg?.getAttribute("width"), "200");
    assert.strictEqual(svg?.getAttribute("height"), "50");
    assert.strictEqual(path?.getAttribute("stroke"), "#ff00aa");
  });
});
