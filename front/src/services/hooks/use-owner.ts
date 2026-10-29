import { useMutation, useQuery } from '@tanstack/react-query';
import { useServices } from '../service-context';
import { queryKeys } from '../query-keys';

export function useGetOwnerHome() {
  const { owner } = useServices();
  return useQuery({ queryKey: queryKeys.ownerHome, queryFn: () => owner.getHome() });
}

export function useListOwnerReports() {
  const { owner } = useServices();
  return useQuery({ queryKey: queryKeys.ownerReports, queryFn: () => owner.listReports() });
}

export function useGetOwnerReport(reportId: string) {
  const { owner } = useServices();
  return useQuery({ queryKey: queryKeys.ownerReport(reportId), queryFn: () => owner.getReport(reportId) });
}

export function useListOwnerLots() {
  const { owner } = useServices();
  return useQuery({ queryKey: queryKeys.ownerLots, queryFn: () => owner.listLots() });
}

export function useListOwnerDocuments() {
  const { owner } = useServices();
  return useQuery({ queryKey: queryKeys.ownerDocuments, queryFn: () => owner.listDocuments() });
}

/** Le PDF d'un compte-rendu ou d'un document : la page le fait enregistrer au navigateur. */
export function useDownloadOwnerFile() {
  const { owner } = useServices();
  return useMutation({ mutationFn: (documentId: string) => owner.download(documentId) });
}
