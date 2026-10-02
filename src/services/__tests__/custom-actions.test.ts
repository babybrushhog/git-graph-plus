import { describe, it, expect, beforeEach, vi } from 'vitest';

// `readCustomActions` reads `gitGraphPlus.customActions` through the VS Code
// config API. The mock lets each test decide what the setting holds, including
// the malformed shapes a hand-edited settings.json can produce.
const h = vi.hoisted(() => ({ value: undefined as unknown }));

vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: () => ({
      get: () => h.value,
    }),
  },
}));

import {
  readCustomActions,
  substituteCustomAction,
  customActionEnv,
  type CustomActionContext,
} from '../custom-actions';

const ctx: CustomActionContext = {
  COMMIT_HASH: 'a1b2c3d4e5f6',
  SHORT_HASH: 'a1b2c3d',
  SUBJECT: "fix: don't crash",
  AUTHOR: 'Daisuke Nakayama',
  AUTHOR_EMAIL: 'dev@example.com',
  DATE: '2026-10-03T02:00:00+09:00',
  BRANCH: 'main',
  REPO: '/home/dev/repo with space',
};

describe('readCustomActions', () => {
  beforeEach(() => {
    h.value = undefined;
  });

  it('returns an empty list when the setting is unset or not an array', () => {
    expect(readCustomActions()).toEqual([]);
    h.value = { title: 'x', command: 'y' };
    expect(readCustomActions()).toEqual([]);
  });

  it('keeps well-formed entries and normalizes confirm to a boolean', () => {
    h.value = [
      { title: 'Export', command: 'git export-diff {COMMIT_HASH}' },
      { title: 'Deploy', command: 'deploy.sh', confirm: true },
    ];
    expect(readCustomActions()).toEqual([
      { title: 'Export', command: 'git export-diff {COMMIT_HASH}', confirm: false },
      { title: 'Deploy', command: 'deploy.sh', confirm: true },
    ]);
  });

  it('drops malformed entries without losing the valid ones', () => {
    h.value = [
      null,
      'not an object',
      { title: '   ', command: 'echo blank title' },
      { title: 'No command' },
      { title: 'Good', command: 'echo ok' },
    ];
    expect(readCustomActions()).toEqual([{ title: 'Good', command: 'echo ok', confirm: false }]);
  });
});

describe('substituteCustomAction', () => {
  it('substitutes placeholders shell-quoted', () => {
    expect(substituteCustomAction('git export-diff {COMMIT_HASH}', ctx))
      .toBe("git export-diff 'a1b2c3d4e5f6'");
    expect(substituteCustomAction('cd {REPO}', ctx)).toBe("cd '/home/dev/repo with space'");
  });

  it("escapes single quotes so a subject cannot end the quoting", () => {
    // Without escaping, `don't` would close the quote and run `t crash` as shell.
    const out = substituteCustomAction('echo {SUBJECT}', ctx);
    expect(out).toBe(`echo 'fix: don'\\''t crash'`);
  });

  it('leaves unknown placeholders untouched', () => {
    expect(substituteCustomAction('echo {NOT_A_PLACEHOLDER}', ctx)).toBe('echo {NOT_A_PLACEHOLDER}');
  });

  it('substitutes every occurrence', () => {
    expect(substituteCustomAction('{SHORT_HASH} {SHORT_HASH}', ctx)).toBe("'a1b2c3d' 'a1b2c3d'");
  });
});

describe('customActionEnv', () => {
  it('exports each value under a GGP_ prefix for commands that need raw text', () => {
    const env = customActionEnv(ctx);
    expect(env.GGP_COMMIT_HASH).toBe('a1b2c3d4e5f6');
    expect(env.GGP_SUBJECT).toBe("fix: don't crash");
    expect(env.GGP_BRANCH).toBe('main');
  });
});
