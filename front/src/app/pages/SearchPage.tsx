import { useNavigate, useSearchParams } from 'react-router';
import type { SearchScope } from '@/services/contracts';
import { useSearch } from '@/services/hooks/use-search';
import { t } from '@/i18n/t';
import { SearchScreen } from '@/ui/screens/SearchScreen';
import { EmptyState } from '@/ui/primitives';
import { QueryState } from '../query-state';
import { searchResultPath } from '../targets';

export function SearchPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const text = params.get('q') ?? '';
  const scope = (params.get('scope') ?? 'all') as SearchScope;
  const query = useSearch(text, scope);
  if (text.trim().length < 2) {
    return (
      <div className="card">
        <EmptyState icon="search" title={t('search.tooShort')} />
      </div>
    );
  }
  return <QueryState query={query}>{results => <SearchScreen query={text} results={results} onOpen={(kind, id) => void navigate(searchResultPath(kind, id))} />}</QueryState>;
}
