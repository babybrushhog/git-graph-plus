/** One user-defined commit action, as validated and pushed by the extension. */
export interface CustomAction {
  title: string;
  confirm?: boolean;
}

/**
 * Holds the custom commit actions pushed from the extension
 * (`gitGraphPlus.customActions`). The extension keeps the command lines to
 * itself — the webview only needs the labels and the index to run.
 */
class CustomActionsStore {
  actions = $state<CustomAction[]>([]);

  set(actions: CustomAction[]) {
    this.actions = actions;
  }
}

export const customActionsStore = new CustomActionsStore();
