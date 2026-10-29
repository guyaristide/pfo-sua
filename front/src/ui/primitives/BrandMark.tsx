/**
 * La marque SUA telle qu'Elodie la dessine sur l'écran de connexion : grille de neuf carrés de 92 sur 334,
 * trait de 14, écart de 20 ; le centre en blanc plein, le dernier en bleu clair, les autres en transparence.
 * Les couleurs viennent du contexte (`currentColor`) et du thème, pour un fond sombre comme clair.
 */
const STEP = 112;
const OFFSET = 7;
const SIZE = 92;

export function BrandMark({ size = 334 }: { size?: number }) {
  const cells = [0, 1, 2].flatMap(row => [0, 1, 2].map(col => ({ row, col })));
  return (
    <svg className="brand-mark" viewBox="0 0 334 334" width={size} height={size} aria-hidden="true" focusable="false">
      {cells.map(({ row, col }) => {
        const accent = row === 1 && col === 1 ? 'brand-mark__cell--strong' : row === 2 && col === 2 ? 'brand-mark__cell--light' : '';
        return <rect key={`${row}-${col}`} className={`brand-mark__cell ${accent}`} x={OFFSET + col * STEP} y={OFFSET + row * STEP} width={SIZE} height={SIZE} />;
      })}
    </svg>
  );
}
