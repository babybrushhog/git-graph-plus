/**
 * Widths of the two draggable columns in the details panel.
 *
 * They live outside the component because `CommitDetails` is destroyed whenever
 * the selection is cleared (or switched to compare mode); component state would
 * send both columns back to their defaults every time.
 */
class PanelWidthsStore {
  /** Left column with the commit metadata and message. */
  commitInfo = $state(320);
  /** File list between the commit info and the diff. */
  files = $state(240);

  set(panel: 'commitInfo' | 'files', width: number) {
    this[panel] = width;
  }
}

export const panelWidthsStore = new PanelWidthsStore();
