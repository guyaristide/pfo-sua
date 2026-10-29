import { useState, type ReactNode } from 'react';
import { t } from '@/i18n/t';
import { Icon } from './Icon';
import { ActionMenu, type MenuAction } from './ActionMenu';

export interface Column<Row> {
  key: string;
  header: string;
  numeric?: boolean;
  render: (row: Row) => ReactNode;
  width?: string;
  /** Valeur de tri : la colonne devient triable au clic sur son en-tête (SLDS §4, aria-sort). */
  sortValue?: ((row: Row) => string | number | null) | undefined;
}

interface DataTableProps<Row> {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  footer?: ReactNode[] | undefined;
  caption: string;
  /** Menu d'actions de ligne (SLDS §7.7), rendu en dernière colonne, en portail. */
  rowActions?: ((row: Row) => MenuAction[]) | undefined;
  /** Ligne ouverte dans un panneau : fond léger et aria-selected. */
  selectedKey?: string | null | undefined;
  /** Ligne qui demande une attention (SLDS §4, ligne en évidence). */
  highlight?: ((row: Row) => boolean) | undefined;
  /** Sélection pour une action de masse : une case par ligne et « tout sélectionner ». */
  selection?: { selected: string[]; onChange: (keys: string[]) => void; isSelectable?: (row: Row) => boolean } | undefined;
}

type Sort = { key: string; direction: 'ascending' | 'descending' } | null;

/**
 * Tableau de données. Il ne porte aucune donnée en dur et ne calcule rien : un total vient de la page,
 * qui somme les lignes qu'il totalise (règle 4). Le tri, la sélection et le menu de ligne vivent ici,
 * jamais recopiés dans un écran (règle 3).
 */
export function DataTable<Row>({ columns, rows, rowKey, footer, caption, rowActions, selectedKey, highlight, selection }: DataTableProps<Row>) {
  const [sort, setSort] = useState<Sort>(null);
  const sortColumn = sort ? columns.find(col => col.key === sort.key) : undefined;
  const ordered =
    sortColumn?.sortValue && sort
      ? [...rows].sort((a, b) => {
          const va = sortColumn.sortValue!(a);
          const vb = sortColumn.sortValue!(b);
          const cmp = va === vb ? 0 : va === null ? 1 : vb === null ? -1 : typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), undefined, { numeric: true });
          return sort.direction === 'ascending' ? cmp : -cmp;
        })
      : rows;
  const toggleSort = (key: string) => setSort(current => (current?.key === key ? (current.direction === 'ascending' ? { key, direction: 'descending' } : null) : { key, direction: 'ascending' }));
  const selectable = selection ? ordered.filter(row => selection.isSelectable?.(row) ?? true) : [];
  const allSelected = selection !== undefined && selectable.length > 0 && selectable.every(row => selection.selected.includes(rowKey(row)));
  const toggle = (key: string, on: boolean) => selection?.onChange(on ? [...selection.selected, key] : selection.selected.filter(k => k !== key));
  const toggleAll = () => selection?.onChange(allSelected ? [] : selectable.map(rowKey));
  const extraBefore = selection ? 1 : 0;

  return (
    <div className="table-wrap">
      <table className="table">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            {selection ? (
              <th scope="col" className="table__select">
                <input type="checkbox" aria-label={t('list.selectAll')} checked={allSelected} onChange={toggleAll} disabled={selectable.length === 0} />
              </th>
            ) : null}
            {columns.map(col => (
              <th
                key={col.key}
                scope="col"
                className={col.numeric ? 'numeric' : undefined}
                style={col.width ? { width: col.width } : undefined}
                aria-sort={sort?.key === col.key ? sort.direction : col.sortValue ? 'none' : undefined}
              >
                {col.sortValue ? (
                  <button type="button" className="table__sort" onClick={() => toggleSort(col.key)}>
                    {col.header}
                    <Icon name={sort?.key === col.key && sort.direction === 'descending' ? 'chevron-down' : 'chevron-up'} size={12} className={sort?.key === col.key ? 'table__sort-icon table__sort-icon--active' : 'table__sort-icon'} />
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
            {rowActions ? (
              <th scope="col" className="table__menu">
                <span className="visually-hidden">{t('menu.rowActions')}</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {ordered.map(row => {
            const key = rowKey(row);
            const classes = [key === selectedKey ? 'table__row--selected' : '', highlight?.(row) ? 'table__row--highlight' : ''].filter(Boolean).join(' ');
            const canSelect = selection ? (selection.isSelectable?.(row) ?? true) : false;
            return (
              <tr key={key} className={classes || undefined} aria-selected={selectedKey !== undefined ? key === selectedKey : undefined}>
                {selection ? (
                  <td className="table__select">
                    <input type="checkbox" aria-label={t('list.selectRow')} checked={selection.selected.includes(key)} disabled={!canSelect} onChange={event => toggle(key, event.target.checked)} />
                  </td>
                ) : null}
                {columns.map(col => (
                  <td key={col.key} className={col.numeric ? 'numeric' : undefined}>
                    {col.render(row)}
                  </td>
                ))}
                {rowActions ? (
                  <td className="table__menu">
                    <ActionMenu label={t('menu.rowActions')} actions={rowActions(row)} />
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
        {footer ? (
          <tfoot>
            <tr>
              {extraBefore ? <td /> : null}
              {footer.map((cell, index) => (
                <td key={columns[index]?.key ?? index} className={columns[index]?.numeric ? 'numeric' : undefined}>
                  {cell}
                </td>
              ))}
              {rowActions ? <td /> : null}
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}
