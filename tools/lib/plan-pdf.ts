// Builds the downloadable study plan PDF.
//
// jsPDF is imported dynamically at click time, so the ~350KB library never touches
// page load — only the people who actually want the file pay for it.
//
// The screen shows the summary; this carries the full week-by-week detail, which is
// the whole point of the trade: a scannable page, a complete document.

import type { StudyPlan } from '../calc/study-plan';
import { formatDay } from '../calc/study-plan';

const FOREST: [number, number, number] = [14, 59, 46];
const AMBER: [number, number, number] = [232, 163, 61];
const INK: [number, number, number] = [26, 26, 26];
const MUTED: [number, number, number] = [74, 90, 82];

const M = 16;               // page margin, mm
const W = 210;              // A4 width, mm
const BOTTOM = 272;         // start a new page past this

export async function downloadPlanPdf(plan: StudyPlan): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 0;

  const footer = () => {
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text('learncrew.org/tools  ·  Plans your time. It cannot predict your score.', M, 287);
  };

  const newPage = () => { footer(); doc.addPage(); y = M; };
  const room = (need: number) => { if (y + need > BOTTOM) newPage(); };

  // Masthead
  doc.setFillColor(...FOREST);
  doc.rect(0, 0, W, 34, 'F');
  doc.setFillColor(...AMBER);
  doc.rect(0, 34, W, 1.6, 'F');
  doc.setTextColor(250, 247, 242);
  doc.setFontSize(9);
  doc.text('LEARN CREW  ·  STUDY PLAN', M, 14);
  doc.setFontSize(17);
  doc.text(`${plan.examName} — ${plan.weeks.length} week${plan.weeks.length === 1 ? '' : 's'}`, M, 25);
  y = 48;

  // Summary figures
  const figures: [string, string][] = [
    [String(plan.daysLeft), 'days left'],
    [String(plan.weeks.length), plan.weeks.length === 1 ? 'week' : 'weeks'],
    [`${plan.totalHours}h`, 'study hours'],
    [String(plan.totalMocks), 'full mocks'],
  ];
  figures.forEach(([n, k], i) => {
    const x = M + i * 45;
    doc.setTextColor(...FOREST);
    doc.setFontSize(19);
    doc.text(n, x, y);
    doc.setTextColor(...MUTED);
    doc.setFontSize(8.5);
    doc.text(k, x, y + 5);
  });
  y += 16;

  doc.setTextColor(...MUTED);
  doc.setFontSize(9);
  doc.text(`Exam ${formatDay(plan.examDate, true)}${plan.dateConfirmed ? '' : ' (expected)'}  ·  Plan starts ${formatDay(plan.start, true)}`, M, y);
  y += 10;

  // Where the time goes
  doc.setTextColor(...INK);
  doc.setFontSize(12);
  doc.text('Where the time goes', M, y);
  y += 6;
  doc.setFontSize(9.5);
  plan.split.forEach((s) => {
    doc.setTextColor(...MUTED);
    doc.text(`${s.label} — ${Math.round(s.share * 100)}%, about ${s.hours}h`, M, y);
    y += 5;
  });
  y += 6;

  // Week by week — the detail the screen deliberately omits
  doc.setTextColor(...INK);
  doc.setFontSize(12);
  doc.text('Week by week', M, y);
  y += 7;

  plan.weeks.forEach((w) => {
    room(30);
    doc.setDrawColor(227, 221, 210);
    doc.line(M, y - 3, W - M, y - 3);

    doc.setTextColor(...FOREST);
    doc.setFontSize(11);
    doc.text(`Week ${w.week}`, M, y + 2);

    doc.setTextColor(...MUTED);
    doc.setFontSize(8.5);
    doc.text(`${formatDay(w.from)} to ${formatDay(w.to)}`, M + 22, y + 2);
    doc.setTextColor(...AMBER);
    doc.text(w.phaseLabel.toUpperCase(), W - M, y + 2, { align: 'right' });

    doc.setTextColor(...INK);
    doc.setFontSize(9);
    doc.text(
      `${w.hours}h available · ${w.mocks} full mock${w.mocks === 1 ? '' : 's'} (${w.mockHours}h) · ${w.drillHours}h drilling`,
      M, y + 8,
    );

    doc.setTextColor(...MUTED);
    doc.setFontSize(8.5);
    const focus = doc.splitTextToSize(w.focus, W - M * 2);
    doc.text(focus, M, y + 13);
    y += 13 + focus.length * 4;

    doc.setTextColor(...FOREST);
    doc.text(w.split.map((s) => `${s.short} ${s.hours}h`).join('   ·   '), M, y);
    y += 5;

    if (w.milestone) {
      const ms = doc.splitTextToSize(w.milestone, W - M * 2 - 4);
      room(ms.length * 4 + 6);
      doc.setFillColor(...AMBER);
      doc.rect(M, y - 3, 1, ms.length * 4 + 2, 'F');
      doc.setTextColor(...INK);
      doc.text(ms, M + 4, y);
      y += ms.length * 4 + 3;
    }
    y += 5;
  });

  footer();
  doc.save(`learn-crew-${plan.exam}-study-plan.pdf`);
}
