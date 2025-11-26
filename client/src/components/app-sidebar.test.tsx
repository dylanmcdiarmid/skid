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

function renderWithRouterAndSidebar(
  ui: React.ReactElement,
  initialPath: string = "/"
) {
  const Root = () => <SidebarProvider defaultOpen>{ui}</SidebarProvider>;
  const root = createRootRoute({ component: Root });
  const index = createRoute({
    getParentRoute: () => root,
    path: "/",
    component: () => null,
  });
  const planning = createRoute({
    getParentRoute: () => root,
    path: "/planning",
    component: () => null,
  });
  const history = createRoute({
    getParentRoute: () => root,
    path: "/history",
    component: () => null,
  });
  const dayTemplates = createRoute({
    getParentRoute: () => root,
    path: "/templates/days",
    component: () => null,
  });
  const sessions = createRoute({
    getParentRoute: () => root,
    path: "/templates/sessions",
    component: () => null,
  });
  const generators = createRoute({
    getParentRoute: () => root,
    path: "/templates/generators",
    component: () => null,
  });
  const generatorHistory = createRoute({
    getParentRoute: () => root,
    path: "/insights/generator-history",
    component: () => null,
  });
  const settings = createRoute({
    getParentRoute: () => root,
    path: "/settings",
    component: () => null,
  });
  const memoryHistory = createMemoryHistory({ initialEntries: [initialPath] });
  const router = createRouter({
    routeTree: root.addChildren([
      index,
      planning,
      history,
      dayTemplates,
      sessions,
      generators,
      generatorHistory,
      settings,
    ]),
    history: memoryHistory,
  });
  return render(<RouterProvider router={router} />, {
    initialValues: [[currentUserIdAtom, "1"]],
  });
}

module("Component | AppSidebar", () => {
  test("renders header with app name", async (assert) => {
    const { findByText } = renderWithRouterAndSidebar(<AppSidebar />);
    assert.dom(await findByText("Skid")).exists();
    assert.dom(await findByText("Practice Scheduler")).exists();
  });

  test("renders daily action menu items", async (assert) => {
    const { findByRole } = renderWithRouterAndSidebar(<AppSidebar />);
    assert.dom(await findByRole("link", { name: "Today" })).exists();
    assert.dom(await findByRole("link", { name: "Planning" })).exists();
    assert.dom(await findByRole("link", { name: "History" })).exists();
  });

  test("renders template menu items", async (assert) => {
    const { findByRole } = renderWithRouterAndSidebar(<AppSidebar />);
    assert.dom(await findByRole("link", { name: "Day Templates" })).exists();
    assert
      .dom(await findByRole("link", { name: "Practice Sessions" }))
      .exists();
    assert.dom(await findByRole("link", { name: "Generators" })).exists();
  });

  test("renders insights menu items", async (assert) => {
    const { findByRole } = renderWithRouterAndSidebar(<AppSidebar />);
    assert
      .dom(await findByRole("link", { name: "Generator History" }))
      .exists();
  });

  test("renders settings link in footer", async (assert) => {
    const { findByRole } = renderWithRouterAndSidebar(<AppSidebar />);
    assert.dom(await findByRole("link", { name: "Settings" })).exists();
  });

  test("marks Today as active on root path", async (assert) => {
    const { findByRole } = renderWithRouterAndSidebar(<AppSidebar />, "/");
    const today = await findByRole("link", { name: "Today" });
    assert.ok(
      today.className.includes("!bg-bg-surface") ||
        today.className.includes("!font-bold")
    );
  });

  test("marks Planning as active on /planning path", async (assert) => {
    const { findByRole } = renderWithRouterAndSidebar(
      <AppSidebar />,
      "/planning"
    );
    const planning = await findByRole("link", { name: "Planning" });
    assert.ok(
      planning.className.includes("!bg-bg-surface") ||
        planning.className.includes("!font-bold")
    );
  });
});
