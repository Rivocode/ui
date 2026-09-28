export const LOADING_ANNOUNCEMENT = "Carregando…";

export const LOADED_ANNOUNCEMENT = "Conteúdo carregado";

export type LoadingAnnouncementLabels = {
  loading: string;
  loaded: string;
};

export function LoadingAnnouncement({
  loading,
  labels,
}: {
  loading: boolean;
  labels?: Partial<LoadingAnnouncementLabels>;
}) {
  return (
    <div role="status" aria-live="polite" data-rc-status="" className="sr-only">
      {loading
        ? (labels?.loading ?? LOADING_ANNOUNCEMENT)
        : (labels?.loaded ?? LOADED_ANNOUNCEMENT)}
    </div>
  );
}
