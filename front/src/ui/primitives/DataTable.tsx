import type { ReactNode } from 'react';

export interface Column<Row> {
  key: string;
  header: string;
  numeric?: boolean;
  render: (row: Row) => ReactNode;
  width?: string;
}

interface DataTableProps<Row> {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  footer?: ReactNode[];
  caption: string;
}

/**
 * Tableau de données. Il ne porte aucune donnée en dur et ne calcule rien : un total vient de la page,
 * qui somme les lignes qu'il totalise (règle 4).
 */
export function DataTable<Row>({ columns, rows, rowKey, footer, caption }: DataTableProps<Row>) {
  return (
    <div className="table-wrap">
      <table className="table">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} scope="col" className={col.numeric ? 'numeric' : undefined} style={col.width ? { width: col.width } : undefined}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={rowKey(row)}>
              {columns.map(col => (
                <td key={col.key} className={col.numeric ? 'numeric' : undefined}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer ? (
          <tfoot>
            <tr>
              {footer.map((cell, index) => (
                <td key={columns[index]?.key ?? index} className={columns[index]?.numeric ? 'numeric' : undefined}>
                  {cell}
                </td>
              ))}
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}
