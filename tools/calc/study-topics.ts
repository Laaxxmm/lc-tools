// What to study, section by section, in the order the plan hands it out.
//
// Order is priority: foundations a later topic leans on come first, then what the
// papers ask most. When the hours run out, the topics at the END are the ones the
// plan drops, so the tail of each list is deliberately the least-asked material.
//
// Hours are first-pass estimates: the concept plus a first set of questions, for a
// student who met the topic at school. They are judgement, not measurement.
// PGCET lists follow KEA's published syllabus and the 2026 papers; CAT and MAT have
// no official syllabus, so those lists follow what recent papers have asked.

import type { Exam, SectionId } from './study-plan.ts';

export interface Topic { name: string; hours: number; }

export const TOPICS: Record<Exam, Partial<Record<SectionId, readonly Topic[]>>> = {
  cat: {
    varc: [
      { name: 'Reading comprehension: method and pacing', hours: 6 },
      { name: 'Para summary', hours: 3 },
      { name: 'Para jumbles', hours: 4 },
      { name: 'Odd sentence out', hours: 3 },
      { name: 'RC: economics and business passages', hours: 3 },
      { name: 'RC: science and technology passages', hours: 3 },
      { name: 'RC: philosophy and humanities passages', hours: 3 },
    ],
    dilr: [
      { name: 'Tables and charts', hours: 4 },
      { name: 'Caselets with calculations', hours: 3 },
      { name: 'Linear and circular arrangements', hours: 4 },
      { name: 'Distributions and matching grids', hours: 4 },
      { name: 'Games and tournaments', hours: 4 },
      { name: 'Venn diagrams and set puzzles', hours: 3 },
      { name: 'Routes, networks and scheduling', hours: 4 },
      { name: 'Maxima-minima and quant-based puzzles', hours: 4 },
    ],
    quant: [
      { name: 'Percentages, profit and loss', hours: 4 },
      { name: 'Ratio, proportion, mixtures and averages', hours: 5 },
      { name: 'Simple and compound interest', hours: 2 },
      { name: 'Time, speed and distance', hours: 4 },
      { name: 'Time and work', hours: 3 },
      { name: 'Linear and quadratic equations, inequalities', hours: 5 },
      { name: 'Geometry: triangles, circles and polygons', hours: 6 },
      { name: 'Functions, logarithms and progressions', hours: 5 },
      { name: 'Mensuration and coordinate geometry', hours: 3 },
      { name: 'Number system', hours: 5 },
      { name: 'Permutations, combinations and probability', hours: 4 },
    ],
  },
  mat: {
    lc: [
      { name: 'Reading comprehension', hours: 4 },
      { name: 'Vocabulary: synonyms, antonyms and usage', hours: 3 },
      { name: 'Grammar and sentence correction', hours: 3 },
      { name: 'Fill in the blanks', hours: 2 },
      { name: 'Para jumbles', hours: 2 },
      { name: 'Idioms and phrases', hours: 1 },
    ],
    ms: [
      { name: 'Percentages, profit and loss, interest', hours: 4 },
      { name: 'Ratio, averages and mixtures', hours: 3 },
      { name: 'Time, speed, distance and work', hours: 4 },
      { name: 'Number system', hours: 3 },
      { name: 'Algebra and equations', hours: 3 },
      { name: 'Geometry and mensuration', hours: 4 },
      { name: 'Permutations, combinations and probability', hours: 3 },
    ],
    da: [
      { name: 'Calculation speed: approximation and fractions', hours: 3 },
      { name: 'Tables', hours: 2 },
      { name: 'Bar, line and pie charts', hours: 3 },
      { name: 'Caselets', hours: 2 },
      { name: 'Data sufficiency', hours: 3 },
    ],
    icr: [
      { name: 'Series and analogies', hours: 2 },
      { name: 'Coding-decoding', hours: 1 },
      { name: 'Blood relations and directions', hours: 2 },
      { name: 'Syllogisms', hours: 2 },
      { name: 'Seating and arrangement puzzles', hours: 3 },
      { name: 'Critical reasoning: assumptions and arguments', hours: 3 },
    ],
    ige: [
      { name: 'Current affairs: the last six months', hours: 2 },
      { name: 'Business and economy', hours: 2 },
      { name: 'Static GK', hours: 2 },
    ],
  },
  'pgcet-mba': {
    comp: [
      { name: 'Computer basics: CPU, memory, input and output devices', hours: 3 },
      { name: 'Number systems: binary, octal, hexadecimal, ASCII', hours: 3 },
      { name: "Binary arithmetic and two's complement", hours: 3 },
      { name: 'Operating systems: types and functions', hours: 3 },
      { name: 'Memory hierarchy and storage', hours: 2 },
      { name: 'Programming languages and software types', hours: 2 },
      { name: 'Internet, networks and web applications', hours: 2 },
      { name: 'Databases and information systems', hours: 2 },
    ],
    reason: [
      { name: 'Number and letter series, analogies', hours: 2 },
      { name: 'Coding-decoding', hours: 1 },
      { name: 'Directions and blood relations', hours: 2 },
      { name: 'Syllogisms and statement-conclusion', hours: 2 },
      { name: 'Venn diagrams', hours: 1 },
      { name: 'Seating and arrangement puzzles', hours: 3 },
      { name: 'Statement-argument and cause-effect', hours: 2 },
      { name: 'Dice, figures and visual reasoning', hours: 2 },
    ],
    quant: [
      { name: 'Percentages, ratio and averages', hours: 3 },
      { name: 'Ages, trains, time and work', hours: 3 },
      { name: 'Equations and number properties', hours: 2 },
      { name: 'Mean, median, mode and dispersion', hours: 3 },
      { name: 'Probability', hours: 3 },
      { name: 'Correlation, regression and distributions', hours: 3 },
      { name: 'Sampling and types of data', hours: 2 },
      { name: 'Data interpretation: tables and charts', hours: 3 },
      { name: 'Area and perimeter', hours: 1 },
    ],
    english: [
      { name: 'Grammar: tenses, voice and question tags', hours: 3 },
      { name: 'Sentence correction', hours: 2 },
      { name: 'Synonyms and antonyms', hours: 2 },
      { name: 'Idioms and phrases', hours: 1 },
      { name: 'One-word substitution', hours: 1 },
      { name: 'Word pairs and analogies', hours: 1 },
      { name: 'Famous books and their authors', hours: 1 },
    ],
    gk: [
      { name: 'Current affairs: the last twelve months', hours: 4 },
      { name: 'Indian economy and business environment', hours: 3 },
      { name: 'Management and entrepreneurship basics', hours: 2 },
      { name: 'Business communication', hours: 1 },
      { name: 'Awards, sports and personalities', hours: 2 },
      { name: 'Science and technology', hours: 2 },
      { name: 'History, polity and culture', hours: 3 },
    ],
  },
  'pgcet-mca': {
    maths: [
      { name: 'Indices, logarithms and equations', hours: 3 },
      { name: 'Progressions: AP, GP and HP', hours: 2 },
      { name: 'Sets, matrices and determinants', hours: 4 },
      { name: 'Permutations, combinations and binomial theorem', hours: 4 },
      { name: 'Coordinate geometry: lines and circles', hours: 4 },
      { name: 'Conics: parabola, ellipse and hyperbola', hours: 3 },
      { name: 'Boolean algebra', hours: 2 },
      { name: 'Trigonometry: identities, equations and triangles', hours: 4 },
      { name: 'Probability', hours: 3 },
      { name: 'Statistics: dispersion, correlation and regression', hours: 3 },
      { name: 'Translation, rotation and scaling', hours: 1 },
    ],
    comp: [
      { name: 'Number systems and data representation', hours: 3 },
      { name: "Binary arithmetic and two's complement", hours: 3 },
      { name: 'CPU, registers and the instruction cycle', hours: 3 },
      { name: 'Memory hierarchy and organisation', hours: 2 },
      { name: 'Operating systems: process states and scheduling', hours: 4 },
      { name: 'Programming basics: languages and operator precedence', hours: 2 },
      { name: 'Databases: data models, DDL and DML', hours: 2 },
      { name: 'Internet and web applications', hours: 1 },
    ],
    reason: [
      { name: 'Number and letter series', hours: 1 },
      { name: 'Coding-decoding', hours: 1 },
      { name: 'Syllogisms', hours: 1 },
      { name: 'Arithmetic reasoning: ages, averages, divisibility', hours: 2 },
      { name: 'Sets and Venn diagrams', hours: 1 },
      { name: 'Arrangements and puzzles', hours: 2 },
      { name: 'Visual and spatial reasoning', hours: 2 },
      { name: 'Data interpretation', hours: 2 },
    ],
    ga: [
      { name: 'Current affairs: the last twelve months', hours: 3 },
      { name: 'Business, finance and the economy', hours: 2 },
      { name: 'Science, health and inventions', hours: 2 },
      { name: 'Governance and e-governance', hours: 1 },
      { name: 'Entrepreneurship and business communication', hours: 1 },
      { name: 'Geography and culture', hours: 2 },
    ],
    english: [
      { name: 'Grammar: verb forms, clauses and tenses', hours: 3 },
      { name: 'Synonyms and antonyms', hours: 2 },
      { name: 'Sentence correction and completion', hours: 2 },
      { name: 'Idioms and phrases', hours: 1 },
      { name: 'Jumbled paragraphs', hours: 1 },
      { name: 'Reading comprehension', hours: 2 },
    ],
  },
};
