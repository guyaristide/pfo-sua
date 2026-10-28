/**
 * La marque SUA : neuf carrés, deux accentués (écran de connexion d'Elodie). Couleurs par classes, pour
 * s'afficher sur fond sombre comme sur fond clair.
 */
export function BrandMark({ size = 200 }: { size?: number }) {
  const cells = [0, 1, 2].flatMap(row => [0, 1, 2].map(col => ({ row, col })));
  return (
    <svg className="brand-mark" viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false">
      {cells.map(({ row, col }) => {
        const accent = row === 1 && col === 1 ? 'brand-mark__cell--strong' : row === 2 && col === 2 ? 'brand-mark__cell--light' : '';
        return <rect key={`${row}-${col}`} className={`brand-mark__cell ${accent}`} x={4 + col * 32} y={4 + row * 32} width={28} height={28} />;
      })}
    </svg>
  );
}
