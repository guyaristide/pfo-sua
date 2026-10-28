// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { clearDraft, readDraft, writeDraft } from '../../src/services/storage/draft-store';

describe('draft-store', () => {
  it('écrit, relit et efface un brouillon', () => {
    expect(readDraft('x')).toBeUndefined();
    writeDraft('x', { step: 'check' });
    expect(readDraft<{ step: string }>('x')?.step).toBe('check');
    clearDraft('x');
    expect(readDraft('x')).toBeUndefined();
  });
});
