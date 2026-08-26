/** Filas de carga: ocupan el mismo sitio que el contenido real, sin saltos. */
export function SkeletonList({ rows = 4, thumb = true }: { rows?: number; thumb?: boolean }) {
  return (
    <div className="skeleton-list" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div className="skeleton-row" key={i}>
          {thumb ? <div className="skeleton thumb" /> : null}
          <div className="skeleton line grow" style={{ maxWidth: `${70 - i * 7}%` }} />
          <div className="skeleton line" style={{ width: 44 }} />
        </div>
      ))}
    </div>
  );
}
