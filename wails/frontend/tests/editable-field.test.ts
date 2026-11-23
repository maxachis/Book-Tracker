import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/svelte";
import EditableField from "../src/lib/components/EditableField.svelte";

function renderField(props: Record<string, unknown> = {}) {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const result = render(EditableField, {
    props: { value: "Dune", label: "Title", onSave, ...props },
  });
  return { ...result, onSave };
}

describe("EditableField", () => {
  it("shows the value as text until clicked", () => {
    const { getByRole, queryByRole } = renderField();
    expect(getByRole("button", { name: "Edit Title" }).textContent).toContain("Dune");
    expect(queryByRole("textbox")).toBeNull();
  });

  it("turns into an input pre-filled with the value when clicked", async () => {
    const { getByRole } = renderField();
    await fireEvent.click(getByRole("button", { name: "Edit Title" }));
    const input = getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("Dune");
  });

  it("saves the new value on Enter", async () => {
    const { getByRole, onSave } = renderField();
    await fireEvent.click(getByRole("button", { name: "Edit Title" }));
    const input = getByRole("textbox") as HTMLInputElement;
    await fireEvent.input(input, { target: { value: "Dune Messiah" } });
    await fireEvent.keyDown(input, { key: "Enter" });
    expect(onSave).toHaveBeenCalledWith("Dune Messiah");
  });

  it("saves when focus leaves the input", async () => {
    const { getByRole, onSave } = renderField();
    await fireEvent.click(getByRole("button", { name: "Edit Title" }));
    const input = getByRole("textbox") as HTMLInputElement;
    await fireEvent.input(input, { target: { value: "Children of Dune" } });
    await fireEvent.blur(input);
    expect(onSave).toHaveBeenCalledWith("Children of Dune");
  });

  it("discards the edit on Escape", async () => {
    const { getByRole, onSave } = renderField();
    await fireEvent.click(getByRole("button", { name: "Edit Title" }));
    const input = getByRole("textbox") as HTMLInputElement;
    await fireEvent.input(input, { target: { value: "Something else" } });
    await fireEvent.keyDown(input, { key: "Escape" });
    expect(onSave).not.toHaveBeenCalled();
    expect(getByRole("button", { name: "Edit Title" }).textContent).toContain("Dune");
  });

  it("does not save an unchanged value", async () => {
    const { getByRole, onSave } = renderField();
    await fireEvent.click(getByRole("button", { name: "Edit Title" }));
    await fireEvent.keyDown(getByRole("textbox"), { key: "Enter" });
    expect(onSave).not.toHaveBeenCalled();
  });

  // Title and total are required; an accidental clear shouldn't wipe them.
  it("does not save an empty value when the field is required", async () => {
    const { getByRole, onSave } = renderField({ required: true });
    await fireEvent.click(getByRole("button", { name: "Edit Title" }));
    const input = getByRole("textbox") as HTMLInputElement;
    await fireEvent.input(input, { target: { value: "  " } });
    await fireEvent.keyDown(input, { key: "Enter" });
    expect(onSave).not.toHaveBeenCalled();
  });

  // A freshly created book opens with its title already being edited.
  it("can start out in edit mode with the input focused", async () => {
    const { getByRole } = renderField({ startEditing: true });
    await Promise.resolve();
    const input = getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("Dune");
    expect(document.activeElement).toBe(input);
    // Selected, so typing replaces a placeholder like "Untitled Book" rather than appending.
    await waitFor(() => {
      expect(input.selectionStart).toBe(0);
      expect(input.selectionEnd).toBe("Dune".length);
    });
  });

  it("shows placeholder text when there is no value yet", () => {
    const { getByRole } = renderField({ value: "", placeholder: "Add author", label: "Author" });
    expect(getByRole("button", { name: "Edit Author" }).textContent).toContain("Add author");
  });

  it("shows formatted display text while keeping the raw value for editing", async () => {
    const { getByRole } = renderField({
      value: "2026-12-01",
      label: "Target date",
      inputType: "date",
      format: (v: string) => `Target: ${v}`,
    });
    const button = getByRole("button", { name: "Edit Target date" });
    expect(button.textContent).toContain("Target: 2026-12-01");
    await fireEvent.click(button);
    const input = document.querySelector("input[type=date]") as HTMLInputElement;
    expect(input.value).toBe("2026-12-01");
  });
});
