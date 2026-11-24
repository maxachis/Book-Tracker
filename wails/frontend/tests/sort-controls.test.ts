import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import SortControls from "../src/lib/components/SortControls.svelte";
import type { ReadingSortField, SortConfig } from "../src/lib/types";
import { FINISHED_SORT_OPTIONS, READING_SORT_OPTIONS } from "../src/lib/services/sorting";

function renderControls(sortConfig: SortConfig) {
  const onSort = vi.fn();
  return { ...render(SortControls, { props: { sortConfig, options: FINISHED_SORT_OPTIONS, onSort } }), onSort };
}

// Shared by the Finished and Reading tabs; each passes its own sort choices.
describe("SortControls", () => {
  it('labels the control simply "Sort"', () => {
    const { container } = renderControls({ field: "title", direction: "asc" });
    expect(container.querySelector(".label-text")?.textContent).toBe("Sort");
  });

  // Hand-arranged order belongs to the Reading tab only.
  it("offers no Custom order on the Finished tab", async () => {
    const { getByRole, queryByRole } = renderControls({ field: "title", direction: "asc" });
    await fireEvent.click(getByRole("combobox", { name: "Sort" }));
    expect(queryByRole("option", { name: "Custom" })).toBeNull();
  });

  it("reports a newly chosen field, keeping the direction", async () => {
    const { getByRole, onSort } = renderControls({ field: "title", direction: "desc" });
    await fireEvent.click(getByRole("combobox", { name: "Sort" }));
    await fireEvent.click(getByRole("option", { name: "Progress" }));
    expect(onSort).toHaveBeenCalledWith({ field: "progress", direction: "desc" });
  });

  // The button shows only an arrow; its name still says the direction for
  // screen readers and the hover tooltip.
  it("shows the direction as a bare arrow", () => {
    const asc = renderControls({ field: "title", direction: "asc" });
    const up = asc.getByRole("button", { name: "Ascending" });
    expect(up.textContent?.trim()).toBe("↑");
    expect(up.getAttribute("title")).toBe("Ascending");
    asc.unmount();

    const desc = renderControls({ field: "title", direction: "desc" });
    expect(desc.getByRole("button", { name: "Descending" }).textContent?.trim()).toBe("↓");
  });

  it("flips the direction when the arrow is clicked", async () => {
    const { getByRole, onSort } = renderControls({ field: "title", direction: "asc" });
    await fireEvent.click(getByRole("button", { name: "Ascending" }));
    expect(onSort).toHaveBeenCalledWith({ field: "title", direction: "desc" });
  });

  // Custom order is arranged by hand, so there is nothing to flip.
  it("hides the direction arrow in Custom order", () => {
    const config: SortConfig<ReadingSortField> = { field: "custom", direction: "asc" };
    const { queryByRole } = render(SortControls<ReadingSortField>, {
      props: { sortConfig: config, options: READING_SORT_OPTIONS, onSort: vi.fn() },
    });
    expect(queryByRole("button", { name: /Ascending|Descending/ })).toBeNull();
  });
});
