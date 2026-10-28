import type { ReactNode } from 'react';

export interface TabDefinition<Key extends string> {
  key: Key;
  label: string;
  count?: number | undefined;
}

interface TabsProps<Key extends string> {
  tabs: TabDefinition<Key>[];
  current: Key;
  onChange: (key: Key) => void;
  label: string;
  children: ReactNode;
}

/** Onglets d'une page d'enregistrement (SLDS §5) : une liste `tablist`, un panneau. */
export function Tabs<Key extends string>({ tabs, current, onChange, label, children }: TabsProps<Key>) {
  return (
    <div className="tabs">
      <div className="tabs__list" role="tablist" aria-label={label}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`tab-${tab.key}`}
            aria-selected={tab.key === current}
            aria-controls={`panel-${tab.key}`}
            className="tabs__tab"
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
            {tab.count !== undefined ? <span className="tabs__count">{tab.count}</span> : null}
          </button>
        ))}
      </div>
      <div className="tabs__panel" role="tabpanel" id={`panel-${current}`} aria-labelledby={`tab-${current}`}>
        {children}
      </div>
    </div>
  );
}
