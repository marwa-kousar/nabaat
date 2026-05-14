/**
 * Fixed lesson-flow copy (not driven by units JSON).
 * Home resume CTA and lesson intro primary button share the same labels.
 */
export const LESSON_FLOW_CTA_BISMILLAH = 'Bismillah →';
export const LESSON_FLOW_CTA_RESUME = 'Resume →';

export function lessonFlowCtaLabel(isNewUser: boolean): string {
  return isNewUser ? LESSON_FLOW_CTA_BISMILLAH : LESSON_FLOW_CTA_RESUME;
}

export function lessonFlowCtaA11yLabel(isNewUser: boolean): string {
  return isNewUser ? 'Begin lesson — Bismillah' : 'Resume lesson';
}

/**
 * Heading for the lesson session start screen (player / lesson shell).
 * Wire this when that screen exists; exported here as the single source of truth.
 */
export const LESSON_START_BISMILLAH_HEADER = 'Bismillah';
