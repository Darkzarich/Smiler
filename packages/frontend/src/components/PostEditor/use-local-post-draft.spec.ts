import { afterEach, describe, expect, it } from 'vitest';
import {
  clearLocalPostDraft,
  pickNewerDraft,
  readLocalPostDraft,
  writeLocalPostDraft,
} from './use-local-post-draft';
import type { LocalPostDraft } from './use-local-post-draft';
import { postTypes } from '@/api/posts';
import type { userTypes } from '@/api/users';

const USER_ID = 'user-1';
const STORAGE_KEY = `post-draft:${USER_ID}`;

function textSection(content: string): postTypes.PostTextSection {
  return {
    type: postTypes.POST_SECTION_TYPES.TEXT,
    hash: 'text-1',
    content,
  };
}

function localDraft(overrides: Partial<LocalPostDraft> = {}): LocalPostDraft {
  return {
    title: 'From this device',
    tags: ['local'],
    sections: [textSection('Written here')],
    updatedAt: Date.parse('2026-09-13T12:00:00.000Z'),
    ...overrides,
  };
}

function template(
  overrides: Partial<userTypes.GetUserTemplateResponse> = {},
): userTypes.GetUserTemplateResponse {
  return {
    title: 'From the account',
    tags: ['server'],
    sections: [textSection('Written elsewhere')],
    updatedAt: '2026-09-13T11:00:00.000Z',
    ...overrides,
  };
}

afterEach(() => {
  localStorage.clear();
});

describe('local post draft storage', () => {
  it('reads back what was written, under a key of the user it belongs to', () => {
    writeLocalPostDraft(USER_ID, {
      title: 'A title',
      tags: ['a tag'],
      sections: [textSection('Some content')],
    });

    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(readLocalPostDraft(USER_ID)).toMatchObject({
      title: 'A title',
      tags: ['a tag'],
      sections: [textSection('Some content')],
    });
    expect(readLocalPostDraft('another-user')).toBeNull();
  });

  it('stamps the draft as it is written', () => {
    const before = Date.now();

    writeLocalPostDraft(USER_ID, { title: '', tags: [], sections: [] });

    const stamp = readLocalPostDraft(USER_ID)!.updatedAt;

    expect(stamp).toBeGreaterThanOrEqual(before);
    expect(stamp).toBeLessThanOrEqual(Date.now());
  });

  it('answers nothing when there is no draft', () => {
    expect(readLocalPostDraft(USER_ID)).toBeNull();
  });

  it('drops a draft it cannot read instead of opening half of one', () => {
    localStorage.setItem(STORAGE_KEY, 'not json at all');

    expect(readLocalPostDraft(USER_ID)).toBeNull();

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ title: 'No stamp' }));

    expect(readLocalPostDraft(USER_ID)).toBeNull();
  });

  it('clears only the draft of the user it was asked about', () => {
    writeLocalPostDraft(USER_ID, { title: 'Mine', tags: [], sections: [] });
    writeLocalPostDraft('user-2', { title: 'Theirs', tags: [], sections: [] });

    clearLocalPostDraft(USER_ID);

    expect(readLocalPostDraft(USER_ID)).toBeNull();
    expect(readLocalPostDraft('user-2')).toMatchObject({ title: 'Theirs' });
  });
});

describe('pickNewerDraft', () => {
  it('takes the local draft when it was written after the template', () => {
    expect(pickNewerDraft(localDraft(), template())).toMatchObject({
      source: 'local',
      title: 'From this device',
      tags: ['local'],
    });
  });

  it('takes the template when it was saved after the local draft', () => {
    const picked = pickNewerDraft(
      localDraft(),
      template({ updatedAt: '2026-09-13T13:00:00.000Z' }),
    );

    expect(picked).toMatchObject({
      source: 'server',
      title: 'From the account',
      tags: ['server'],
    });
  });

  it('takes the template on a tie, so an untouched device holds nothing back', () => {
    const picked = pickNewerDraft(
      localDraft({ updatedAt: Date.parse('2026-09-13T11:00:00.000Z') }),
      template(),
    );

    expect(picked.source).toBe('server');
  });

  it('takes the template when this device holds no draft', () => {
    expect(pickNewerDraft(null, template()).source).toBe('server');
  });

  it('treats a template saved before stamping as older than any local draft', () => {
    const picked = pickNewerDraft(
      localDraft({ updatedAt: 1 }),
      template({ updatedAt: undefined }),
    );

    expect(picked.source).toBe('local');
  });

  it('takes an emptied local draft over the template it was emptied from', () => {
    const picked = pickNewerDraft(
      localDraft({ title: '', tags: [], sections: [] }),
      template(),
    );

    expect(picked).toMatchObject({
      source: 'local',
      title: '',
      tags: [],
      sections: [],
    });
  });
});
