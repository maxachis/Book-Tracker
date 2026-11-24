import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, waitFor } from "@testing-library/svelte";
import type { UserSettings } from "../src/lib/types";

const backend = vi.hoisted(() => ({
  settings: {} as UserSettings,
  updateSettings: vi.fn(),
}));

vi.mock("../wailsjs/go/main/App", () => {
  const ok = <T>(v: T) => Promise.resolve(v);
  return {
    GetSettings: () => ok(backend.settings),
    UpdateSettings: (req: Partial<UserSettings>) => {
      backend.updateSettings(req);
      backend.settings = { ...backend.settings, ...req };
      return ok(backend.settings);
    },
  };
});

import Settings from "../src/views/Settings.svelte";
import { appState } from "../src/lib/stores/state.svelte";

beforeEach(() => {
  backend.settings = {
    id: 1,
    reading_start_hour: 8,
    reading_end_hour: 22,
    stats_start_date: null,
    location_step: 250,
  };
  backend.updateSettings.mockClear();
  appState.settings = { ...backend.settings };
});

const stepBox = (getByLabelText: (t: RegExp) => HTMLElement) =>
  getByLabelText(/locations per step/i) as HTMLInputElement;

// Location books are counted down in steps of this many locations; the reader
// picks the size app-wide (100 by default) to suit how long their books run.
describe("Settings: location step", () => {
  it("shows the saved location step", () => {
    const { getByLabelText } = render(Settings);
    expect(stepBox(getByLabelText).value).toBe("250");
  });

  it("saves a new location step and applies it app-wide", async () => {
    const { getByLabelText, getByRole } = render(Settings);
    await fireEvent.input(stepBox(getByLabelText), { target: { value: "50" } });
    await fireEvent.click(getByRole("button", { name: /save settings/i }));
    await waitFor(() => expect(backend.updateSettings).toHaveBeenCalled());
    expect(backend.updateSettings.mock.calls[0][0]).toMatchObject({ location_step: 50 });
    await waitFor(() => expect(appState.settings.location_step).toBe(50));
  });

  // A step must be a whole number of locations, at least 1.
  it.each(["0", "12.5", ""])("refuses to save a step of %o", async (typed) => {
    const { getByLabelText, getByRole, findByText } = render(Settings);
    await fireEvent.input(stepBox(getByLabelText), { target: { value: typed } });
    await fireEvent.click(getByRole("button", { name: /save settings/i }));
    expect(await findByText(/whole number/i)).toBeTruthy();
    expect(backend.updateSettings).not.toHaveBeenCalled();
  });

  it("ignores the decimal-point, comma and exponent keys", async () => {
    const { getByLabelText } = render(Settings);
    for (const key of [".", ",", "e", "E"]) {
      const event = new KeyboardEvent("keydown", { key, cancelable: true, bubbles: true });
      stepBox(getByLabelText).dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    }
  });
});
