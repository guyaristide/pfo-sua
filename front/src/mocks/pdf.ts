/**
 * Un PDF d'une page, texte seul, pour les téléchargements simulés : le fichier s'ouvre dans n'importe quel
 * lecteur. Le vrai document viendra du serveur.
 */
export function simplePdf(lines: { text: string; size?: number }[]): Blob {
  const clean = (text: string) =>
    text
      .replace(/[\u2019\u2018]/g, "'")
      .replace(/[\u2013\u2014\u2212]/g, '-')
      .replace(/[\u202f\u00a0]/g, ' ')
      .replace(/[^\x20-\xff]/g, '')
      .replace(/([()\\])/g, '\\$1');
  let y = 790;
  const body = lines
    .map(line => {
      const size = line.size ?? 11;
      const out = `BT /F1 ${size} Tf 56 ${y} Td (${clean(line.text)}) Tj ET`;
      y -= size + 9;
      return out;
    })
    .join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${body.length} >>\nstream\n${body}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map(o => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i += 1) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return new Blob([bytes], { type: 'application/pdf' });
}
