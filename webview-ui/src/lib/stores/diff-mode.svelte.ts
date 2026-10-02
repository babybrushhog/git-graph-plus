export type DiffMode = 'inline' | 'side-by-side';

/**
 * The inline / side-by-side choice for the diff panel.
 *
 * It lives outside the component because `FileDiffView` is re-created whenever
 * another file is selected: component state would snap back to the default on
 * every click. The initial value comes from `gitGraphPlus.defaults.diffMode`,
 * and the toggle updates it for the rest of the session.
 */
class DiffModeStore {
  mode = $state<DiffMode>('side-by-side');

  set(mode: DiffMode) {
    this.mode = mode;
  }
}

export const diffModeStore = new DiffModeStore();
