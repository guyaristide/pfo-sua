import type { ReactNode } from 'react';
import { DataTable, type Column } from './DataTable';
import type { MenuAction } from './ActionMenu';
import { FilterPills, ListStatus, ShowMore } from './ListStatus';
import { useListFilter } from './use-list-filter';

interface ListFilters<Key extends string> {
  options: { key: Key; label: string; count?: number | undefined }[];
  value: Key;
  onChange: (key: Key) => void;
  label: string;
}

interface ListBodyProps<Row, Key extends string> {
  /** Les lignes déjà restreintes par le filtre de statut ; la recherche et les lots de 20 se font ici. */
  rows: Row[];
  haystack: (row: Row) => (string | null)[];
  columns: Column<Row>[];
  rowKey: (row: Row) => string;
  caption: string;
  filters?: ListFilters<Key> | undefined;
  /** Complément de la ligne d'état, calculé sur les lignes filtrées (règle 10 : un effectif à côté d'une somme). */
  extra?: ((filtered: Row[]) => ReactNode) | undefined;
  /** Pied du tableau, calculé sur les lignes filtrées. */
  footer?: ((filtered: Row[]) => ReactNode[]) | undefined;
  empty: ReactNode;
  /** Second groupe de filtres (bâtiment, rubrique…), sous la ligne d'état. */
  toolbar?: ReactNode | undefined;
  rowActions?: ((row: Row) => MenuAction[]) | undefined;
  selectedKey?: string | null | undefined;
  highlight?: ((row: Row) => boolean) | undefined;
  selection?: { selected: string[]; onChange: (keys: string[]) => void; isSelectable?: (row: Row) => boolean } | undefined;
}

/**
 * Le corps d'une vue de liste SLDS §4 à placer dans une carte : ligne d'état (effectif, filtres, recherche),
 * tableau ou état vide, « Afficher plus » par lots de 20.
 */
export function ListBody<Row, Key extends string>({ rows, haystack, columns, rowKey, caption, filters, extra, footer, empty, toolbar, rowActions, selectedKey, highlight, selection }: ListBodyProps<Row, Key>) {
  const list = useListFilter(rows, haystack);
  return (
    <>
      <ListStatus
        count={list.filtered.length}
        extra={extra ? extra(list.filtered) : undefined}
        search={list.search}
        onSearch={list.setSearch}
        filters={filters ? <FilterPills options={filters.options} value={filters.value} onChange={filters.onChange} label={filters.label} /> : undefined}
      />
      {toolbar ? <div className="list-status list-status--toolbar">{toolbar}</div> : null}
      {list.filtered.length === 0 ? (
        empty
      ) : (
        <DataTable caption={caption} columns={columns} rows={list.visible} rowKey={rowKey} footer={footer ? footer(list.filtered) : undefined} rowActions={rowActions} selectedKey={selectedKey} highlight={highlight} selection={selection} />
      )}
      <ShowMore hidden={list.hidden} onClick={list.showMore} />
    </>
  );
}
