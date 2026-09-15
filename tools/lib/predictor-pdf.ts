// Builds the downloadable PGCET college list.
//
// jsPDF is imported dynamically at click time, so the ~350KB library never touches
// page load -- only the people who actually want the file pay for it.
//
// The screen pages the list at 40 rows; this carries every match. That is the whole
// point of the trade: a scannable page, a complete document to take into option
// entry, where the full list is what you actually need in front of you.

import { CHANCE_LABEL, type Chance, type Prediction } from '../calc/pgcet-predictor.ts';

const FOREST: [number, number, number] = [14, 59, 46];
const AMBER: [number, number, number] = [232, 163, 61];
const INK: [number, number, number] = [26, 26, 26];
const MUTED: [number, number, number] = [74, 90, 82];
const LINE: [number, number, number] = [227, 221, 210];

const M = 14;           // page margin, mm
const W = 210;          // A4 width, mm
const BOTTOM = 272;     // start a new page past this

// Columns, left edge and width in mm. They sum to the usable 182mm.
const COL = {
  chance: { x: M, w: 20 },
  rank: { x: M + 20, w: 20 },
  college: { x: M + 40, w: 76 },
  programme: { x: M + 116, w: 42 },
  city: { x: M + 158, w: 24 },
};

export interface PdfMeta {
  rank: number;
  course: string;
  category: string;
  seat: string;
  city: string;
  year: string;
  round: string;
  counts: Record<Chance, number>;
}

export async function downloadPredictionPdf(
  results: Prediction[], meta: PdfMeta,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 0;
  let page = 0;

  const footer = () => {
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(
      `learncrew.org/tools  ·  KEA ${meta.year} ${meta.round} closing ranks. `
      + 'An estimate for shortlisting, not an allotment.',
      M, 287,
    );
    doc.text(String(page), W - M, 287, { align: 'right' });
  };

  const columnHeads = () => {
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text('CHANCE', COL.chance.x, y);
    doc.text('CLOSED AT', COL.rank.x, y);
    doc.text('COLLEGE', COL.college.x, y);
    doc.text('PROGRAMME', COL.programme.x, y);
    doc.text('CITY', COL.city.x, y);
    y += 2;
    doc.setDrawColor(...LINE);
    doc.line(M, y, W - M, y);
    y += 4;
  };

  const newPage = () => {
    footer();
    doc.addPage();
    page += 1;
    y = M + 4;
    columnHeads();
  };

  // Masthead
  page = 1;
  doc.setFillColor(...FOREST);
  doc.rect(0, 0, W, 32, 'F');
  doc.setFillColor(...AMBER);
  doc.rect(0, 32, W, 1.6, 'F');
  doc.setTextColor(250, 247, 242);
  doc.setFontSize(8.5);
  doc.text('LEARN CREW  ·  PGCET COLLEGE PREDICTOR', M, 13);
  doc.setFontSize(16);
  doc.text(`${meta.course} colleges for rank ${meta.rank.toLocaleString('en-IN')}`, M, 24);

  y = 44;
  doc.setTextColor(...INK);
  doc.setFontSize(9);
  doc.text(
    `${meta.category}  ·  ${meta.seat}  ·  ${meta.city || 'All cities'}`
    + `  ·  ${results.length} programme${results.length === 1 ? '' : 's'} in reach`,
    M, y,
  );
  y += 7;

  // Summary figures, same three bands as the page
  const figures: [string, string][] = [
    [String(meta.counts.safe), CHANCE_LABEL.safe],
    [String(meta.counts.moderate), CHANCE_LABEL.moderate],
    [String(meta.counts.reach), CHANCE_LABEL.reach],
  ];
  figures.forEach(([n, k], i) => {
    const x = M + i * 34;
    doc.setTextColor(...FOREST);
    doc.setFontSize(17);
    doc.text(n, x, y);
    doc.setTextColor(...MUTED);
    doc.setFontSize(8);
    doc.text(k, x + (n.length * 3.4) + 2, y);
  });
  y += 10;

  doc.setTextColor(...MUTED);
  doc.setFontSize(8);
  doc.text(
    'Ordered safest first, and inside each band the more selective programme leads. '
    + 'Order your options by what you want, not by what is likely.',
    M, y,
  );
  y += 7;
  columnHeads();

  results.forEach((r) => {
    const college = doc.splitTextToSize(r.collegeName, COL.college.w - 3) as string[];
    const programme = doc.splitTextToSize(r.programme, COL.programme.w - 3) as string[];
    const lines = Math.max(college.length, programme.length, 1);
    const height = lines * 3.6 + 3;
    if (y + height > BOTTOM) newPage();

    // A band you can spot from a scroll, same colour logic as the page.
    if (r.chance !== 'reach') {
      doc.setFillColor(...(r.chance === 'safe' ? FOREST : AMBER));
      doc.rect(M - 2, y - 3, 1, height - 1, 'F');
    }

    doc.setFontSize(7.5);
    doc.setTextColor(...(r.chance === 'safe' ? FOREST : r.chance === 'moderate' ? INK : MUTED));
    doc.text(CHANCE_LABEL[r.chance].toUpperCase(), COL.chance.x, y);

    doc.setTextColor(...INK);
    doc.setFontSize(8.5);
    doc.text(r.closingRank.toLocaleString('en-IN'), COL.rank.x, y);

    doc.setFontSize(8);
    doc.text(college, COL.college.x, y);

    doc.setTextColor(...MUTED);
    doc.text(programme, COL.programme.x, y);
    doc.text(r.city || '—', COL.city.x, y);

    y += height;
    doc.setDrawColor(...LINE);
    doc.line(M, y - 2.4, W - M, y - 2.4);
  });

  footer();
  const where = meta.city ? `-${meta.city.toLowerCase().replace(/\s+/g, '-')}` : '';
  doc.save(`learn-crew-pgcet-${meta.course.toLowerCase()}-rank-${meta.rank}${where}.pdf`);
}
