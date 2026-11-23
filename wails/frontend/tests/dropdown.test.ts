import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/svelte";
import Dropdown from "../src/lib/components/Dropdown.svelte";

const options = [
  { value: "custom", label: "Custom" },
  { value: "title", label: "Title" },
  { value: "progress", label: "Progress" },
];

function renderDropdown(value = "title") {
  const onChange = vi.fn();
  const result = render(Dropdown, { props: { options, value, onChange, label: "Sort by" } });
  return { ...result, onChange, trigger: result.getByRole("combobox", { name: "Sort by" }) };
}

describe("Dropdown", () => {
  it("shows the selected option's label and starts closed", () => {
    const { trigger, queryByRole } = renderDropdown();
    expect(trigger.querySelector(".trigger-label")?.textContent).toBe("Title");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(queryByRole("listbox")).toBeNull();
  });

  // The button is as wide as its longest option whatever is selected, so
  // changing the choice never shifts the controls around it. Every label is
  // laid out invisibly underneath the visible one to reserve that width.
  it("reserves room for its longest option regardless of the selection", () => {
    const { trigger } = renderDropdown("title");
    const sizers = [...trigger.querySelectorAll<HTMLElement>(".trigger-sizer")];
    expect(sizers.map((el) => el.textContent)).toEqual(["Custom", "Title", "Progress"]);
    for (const el of sizers) expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  it("opens a list of every option on click, marking the current one", async () => {
    const { trigger, getByRole, getAllByRole } = renderDropdown();
    await fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(getByRole("listbox")).toBeTruthy();
    expect(getAllByRole("option").map((o) => o.textContent?.trim())).toEqual(["Custom", "Title", "Progress"]);
    expect(getByRole("option", { name: "Title" }).getAttribute("aria-selected")).toBe("true");
  });

  // The current option is marked by its styling, not a checkmark, so the menu
  // doesn't reserve extra width for an icon.
  it("marks the current option without a checkmark icon", async () => {
    const { trigger, getByRole, getAllByRole } = renderDropdown();
    await fireEvent.click(trigger);
    expect(getByRole("option", { name: "Title" }).classList.contains("selected")).toBe(true);
    for (const option of getAllByRole("option")) {
      expect(option.querySelector("svg")).toBeNull();
    }
  });

  it("reports the chosen option and closes", async () => {
    const { trigger, getByRole, queryByRole, onChange } = renderDropdown();
    await fireEvent.click(trigger);
    await fireEvent.click(getByRole("option", { name: "Progress" }));
    expect(onChange).toHaveBeenCalledWith("progress");
    expect(queryByRole("listbox")).toBeNull();
  });

  it("does not report choosing the option that is already selected", async () => {
    const { trigger, getByRole, onChange } = renderDropdown();
    await fireEvent.click(trigger);
    await fireEvent.click(getByRole("option", { name: "Title" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("can be driven from the keyboard: arrows to open and move, Enter to choose", async () => {
    const { trigger, getByRole, onChange } = renderDropdown();
    await fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(getByRole("listbox")).toBeTruthy();
    // Opens on the current option (Title); one more ArrowDown reaches Progress.
    await fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(trigger.getAttribute("aria-activedescendant")).toBe(getByRole("option", { name: "Progress" }).id);
    await fireEvent.keyDown(trigger, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("progress");
  });

  it("ArrowUp moves toward the top and stops there", async () => {
    const { trigger, onChange } = renderDropdown();
    await fireEvent.keyDown(trigger, { key: "ArrowDown" });
    await fireEvent.keyDown(trigger, { key: "ArrowUp" });
    await fireEvent.keyDown(trigger, { key: "ArrowUp" });
    await fireEvent.keyDown(trigger, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("custom");
  });

  it("closes on Escape without changing anything", async () => {
    const { trigger, queryByRole, onChange } = renderDropdown();
    await fireEvent.click(trigger);
    await fireEvent.keyDown(trigger, { key: "ArrowDown" });
    await fireEvent.keyDown(trigger, { key: "Escape" });
    expect(queryByRole("listbox")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("closes when clicking elsewhere on the page", async () => {
    const { trigger, queryByRole } = renderDropdown();
    await fireEvent.click(trigger);
    await fireEvent.pointerDown(document.body);
    expect(queryByRole("listbox")).toBeNull();
  });
});
