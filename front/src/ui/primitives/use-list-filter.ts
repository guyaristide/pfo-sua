import { useState } from 'react';

const BATCH = 20;

/**
 * Recherche dans la liste et lots de 20 (SLDS §4). La recherche remet le lot au début ; le composant
 * garde la liste filtrée pour totaliser exactement ce qu'il affiche (règle 10).
 */
export function useListFilter<Row>(rows: Row[], haystack: (row: Row) => (string | null)[], batch = BATCH) {
  const [search, setSearchValue] = useState('');
  const [limit, setLimit] = useState(batch);

  const needle = search.trim().toLocaleLowerCase();
  const filtered = needle ? rows.filter(row => haystack(row).some(v => v !== null && v.toLocaleLowerCase().includes(needle))) : rows;
  const visible = filtered.slice(0, limit);

  return {
    search,
    setSearch: (value: string) => {
      setSearchValue(value);
      setLimit(batch);
    },
    filtered,
    visible,
    hidden: filtered.length - visible.length,
    showMore: () => setLimit(current => current + batch),
  };
}
