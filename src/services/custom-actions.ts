import * as vscode from 'vscode';

/**
 * A user-defined command that appears in the commit context menu
 * (`gitGraphPlus.customActions`). Run in the integrated terminal with the
 * repository as the working directory.
 */
export interface CustomAction {
  /** Menu label. */
  title: string;
  /** Shell command line. Placeholders below are substituted before running. */
  command: string;
  /** Ask for confirmation before running. */
  confirm?: boolean;
}

/** Values a custom action can reference, keyed by placeholder name. */
export interface CustomActionContext {
  COMMIT_HASH: string;
  SHORT_HASH: string;
  SUBJECT: string;
  AUTHOR: string;
  AUTHOR_EMAIL: string;
  DATE: string;
  BRANCH: string;
  REPO: string;
}

/**
 * Reads and validates `gitGraphPlus.customActions`. Entries missing a title or
 * a command are dropped rather than failing the whole list, so one bad entry
 * cannot hide the others.
 */
export function readCustomActions(): CustomAction[] {
  const raw = vscode.workspace.getConfiguration('gitGraphPlus').get<unknown>('customActions');
  if (!Array.isArray(raw)) return [];
  const actions: CustomAction[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const { title, command, confirm } = entry as Record<string, unknown>;
    if (typeof title !== 'string' || !title.trim()) continue;
    if (typeof command !== 'string' || !command.trim()) continue;
    actions.push({ title, command, confirm: confirm === true });
  }
  return actions;
}

/** Wraps a value in single quotes for POSIX shells, escaping embedded quotes. */
function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/**
 * Replaces `{PLACEHOLDER}` occurrences with shell-quoted values.
 *
 * Quoting matters: commit subjects routinely contain spaces, quotes and
 * parentheses, and an unquoted substitution would let them run as shell syntax.
 * The same values are also exported as `GGP_*` environment variables, so a
 * command that needs the raw text inside its own quoting can read those.
 */
export function substituteCustomAction(command: string, ctx: CustomActionContext): string {
  return command.replace(/\{([A-Z_]+)\}/g, (match, key: string) => {
    const value = (ctx as unknown as Record<string, string | undefined>)[key];
    return value === undefined ? match : shellQuote(value);
  });
}

/**
 * Builds the `export GGP_...` line sent before a custom action's command, so a
 * command can read the raw (unquoted) values inside its own quoting.
 *
 * This is sent per run rather than passed as the terminal's `env`, because a
 * reused terminal would otherwise keep the values of the commit it was first
 * created for.
 */
export function customActionExportLine(ctx: CustomActionContext): string {
  const assignments = Object.entries(ctx)
    .map(([key, value]) => `GGP_${key}=${shellQuote(value ?? '')}`)
    .join(' ');
  return `export ${assignments}`;
}
