import QUnit from "qunit";

const { module, test } = QUnit;

import { createMemoryHistory } from "@tanstack/history";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render } from "@tests/test-utils";
import { SidebarProvider } from "@/components/ui/sidebar";
import { currentUserIdAtom } from "@/state/users";
import { AppSidebar } from "./app-sidebar";

function renderWithRouterAndSidebar(ui: React.ReactElement) {
  // Ensure text labels are visible (not icon-only)
  const Root = () => <SidebarProvider defaultOpen>{ui}</SidebarProvider>;
  const root = createRootRoute({ component: Root });
  const index = createRoute({
    getParentRoute: () => root,
    path: "/",
    component: () => null,
  });
  const upload = createRoute({
    getParentRoute: () => root,
    path: "/upload",
    component: () => null,
  });
  const streaming = createRoute({
    getParentRoute: () => root,
    path: "/streaming",
    component: () => null,
  });
  const history = createMemoryHistory({ initialEntries: ["/"] });
  const router = createRouter({
    routeTree: root.addChildren([index, upload, streaming]),
    history,
  });
  return render(<RouterProvider router={router} />, {
    initialValues: [[currentUserIdAtom, "1"]],
  });
}

module("Component | AppSidebar", () => {
  test("renders menu items and actions", async (assert) => {
    const { findByRole, findByText } = renderWithRouterAndSidebar(
      <AppSidebar />
    );
    assert.dom(await findByRole("link", { name: "Dashboard" })).exists();
    assert.dom(await findByRole("link", { name: "Upload" })).exists();
    assert.dom(await findByRole("link", { name: "Live Streaming" })).exists();

    assert.dom(await findByText("John Doe")).exists();

    assert.dom(await findByRole("button", { name: "Notifications" })).exists();
    assert.dom(await findByRole("button", { name: "Settings" })).exists();
  });

  test("marks Dashboard as active on root path", async (assert) => {
    const { findByRole } = renderWithRouterAndSidebar(<AppSidebar />);
    const dashboard = await findByRole("link", { name: "Dashboard" });
    assert.ok(
      dashboard.className.includes("!bg-bg-surface") ||
        dashboard.className.includes("!font-bold")
    );
  });
});
