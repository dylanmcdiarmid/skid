import QUnit from "qunit";

const { module, test } = QUnit;

import { render } from "@tests/test-utils";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TopBar } from "./top-bar";

module("Component | TopBar", () => {
  test("renders without title and shows sidebar trigger", (assert) => {
    const { getByRole, queryByText } = render(
      <SidebarProvider>
        <TopBar />
      </SidebarProvider>
    );
    const trigger = getByRole("button", { name: "Toggle Sidebar" });
    assert.dom(trigger).exists();
    assert.strictEqual(queryByText("Dashboard"), null, "no default title");
  });

  test("renders with title", (assert) => {
    const { getByText, getByRole } = render(
      <SidebarProvider>
        <TopBar title="Dashboard" />
      </SidebarProvider>
    );
    assert.dom(getByText("Dashboard")).exists();
    const trigger = getByRole("button", { name: "Toggle Sidebar" });
    assert.dom(trigger).exists();
  });
});
