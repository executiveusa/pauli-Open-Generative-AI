/**
 * Explicit state machine for MediaJob status transitions.
 * Disallows transitions from terminal states and invalid paths.
 */

const TRANSITIONS = {
  created:              ['queued', 'cancelled'],
  queued:               ['running', 'cancelled'],
  running:              ['waiting_for_provider', 'stitching', 'failed', 'cancelled'],
  waiting_for_provider: ['running', 'failed'],
  stitching:            ['succeeded', 'failed'],
  succeeded:            [],
  failed:               [],
  cancelled:            [],
};

export const TERMINAL_STATES = new Set(['succeeded', 'failed', 'cancelled']);

/** All valid status names */
export const ALL_STATUSES = Object.keys(TRANSITIONS);

/**
 * Returns true if the transition from → to is valid.
 * @param {string} from
 * @param {string} to
 * @returns {boolean}
 */
export function canTransition(from, to) {
  return (TRANSITIONS[from] ?? []).includes(to);
}

/**
 * Asserts transition is valid, throws if not.
 * @param {string} from
 * @param {string} to
 * @returns {void}
 */
export function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    throw new Error(
      `Invalid job state transition: ${from} → ${to}. ` +
      `Allowed from '${from}': [${(TRANSITIONS[from] ?? []).join(', ')}]`
    );
  }
}

/**
 * Returns all valid next states from a given status.
 * @param {string} status
 * @returns {string[]}
 */
export function nextStates(status) {
  return TRANSITIONS[status] ?? [];
}

/**
 * Returns true if this status is terminal (no further transitions possible).
 * @param {string} status
 * @returns {boolean}
 */
export function isTerminal(status) {
  return TERMINAL_STATES.has(status);
}

/**
 * Applies a transition to a job object, returning updated job.
 * Does not mutate the input; returns a new object.
 * @param {object} job - current MediaJob
 * @param {string} to - target status
 * @param {object} updates - optional additional field updates (stage, progress, message, error)
 * @returns {object} updated job
 */
export function applyTransition(job, to, updates = {}) {
  assertTransition(job.status, to);
  return {
    ...job,
    ...updates,
    status: to,
    updatedAt: new Date().toISOString(),
  };
}
