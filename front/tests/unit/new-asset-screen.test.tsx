// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NewAssetScreen, emptyNewAssetDraft } from '../../src/ui/screens/NewAssetScreen';
import { fr } from '../../src/i18n/fr';

afterEach(cleanup);

describe('NewAssetScreen', () => {
  it("ne montre les erreurs qu'après une tentative de continuer, puis les affiche sans avancer", () => {
    const onDraftChange = vi.fn();
    render(
      <NewAssetScreen
        draft={emptyNewAssetDraft}
        billingItems={[]}
        onDraftChange={onDraftChange}
        onUseSample={() => {}}
        onSubmit={() => {}}
        submitting={false}
        submitError={undefined}
        onKeepDraft={() => {}}
        onDiscardDraft={() => {}}
        onBack={() => {}}
      />,
    );
    expect(screen.queryByText(fr['form.required'])).toBeNull();
    expect(screen.getByText(fr['draft.saved'])).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: fr['newAsset.action.next'] }));
    const next = onDraftChange.mock.calls[0]![0] as typeof emptyNewAssetDraft;
    expect(next.step).toBe('owner');
    expect(next.attempted).toEqual(['owner']);
    cleanup();
    render(
      <NewAssetScreen
        draft={next}
        billingItems={[]}
        onDraftChange={onDraftChange}
        onUseSample={() => {}}
        onSubmit={() => {}}
        submitting={false}
        submitError={undefined}
        onKeepDraft={() => {}}
        onDiscardDraft={() => {}}
        onBack={() => {}}
      />,
    );
    expect(screen.getAllByText(fr['form.required']).length).toBeGreaterThan(0);
  });
});
