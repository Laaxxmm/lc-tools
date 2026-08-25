// The tool registry. Static export forbids reading this directory at request time
// and the build has no bundler-independent fs step, so the list is explicit.
// Adding a tool = one import and one array entry.
//
// Array order is the editorial running order. lib/shell.ts groups it by exam
// family for the hub and keeps this order inside each group, so the most urgent
// tool in a family goes first here.

import type { ToolConfig } from '../lib/types.ts';
import examDates from './mba-exam-dates-2026.ts';
import eligibility from './mba-exam-eligibility-checker.ts';
import studyPlan from './cat-mat-study-plan-generator.ts';
import percentileTarget from './cat-percentile-target-calculator.ts';
import cgpa from './cgpa-percentage-converter.ts';
import costRoi from './mba-cost-and-roi-calculator.ts';

export const TOOLS: ToolConfig[] = [
  studyPlan,
  percentileTarget,
  examDates,
  eligibility,
  cgpa,
  costRoi,
];
