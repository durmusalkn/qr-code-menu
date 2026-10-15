/**
 * Pure permission model shared by onboarding and the permission status screen. The native calls
 * live in `permissionService.ts`.
 */

export const PERMISSION_KEYS = [
  'notifications',
  'location',
  'backgroundLocation',
  'camera',
  'microphone',
  'batteryOptimization',
  'backupFolder',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

/**
 * - `granted`: nothing to do.
 * - `undetermined`: never asked; the system dialog can be shown.
 * - `denied`: refused, but the system dialog can be shown again.
 * - `blocked`: only the system settings screen can change it.
 * - `unknown`: the state could not be read.
 */
export type PermissionState = 'granted' | 'undetermined' | 'denied' | 'blocked' | 'unknown';

export type PermissionStatuses = Record<PermissionKey, PermissionState>;

/** What tapping a permission does. */
export type PermissionAction = 'request' | 'openSettings' | 'pickFolder';

/** Shape shared by expo permission responses. */
export interface PermissionResponseLike {
  granted: boolean;
  status: string;
  canAskAgain: boolean;
}

export function fromPermissionResponse(response: PermissionResponseLike): PermissionState {
  if (response.granted) return 'granted';
  if (response.status === 'undetermined') return 'undetermined';
  return response.canAskAgain ? 'denied' : 'blocked';
}

/**
 * Approximate location (~2 km) is not enough for place names or visit detection, so it counts as
 * not granted. Requesting again lets Android offer the upgrade to precise.
 */
export function fromLocationResponse(
  response: PermissionResponseLike & { android?: { accuracy?: string } },
): PermissionState {
  const state = fromPermissionResponse(response);
  if (state === 'granted' && response.android?.accuracy === 'coarse') {
    return response.canAskAgain ? 'denied' : 'blocked';
  }
  return state;
}

export function isGranted(state: PermissionState): boolean {
  return state === 'granted';
}

export function permissionAction(key: PermissionKey, state: PermissionState): PermissionAction {
  if (key === 'backupFolder') return 'pickFolder';
  // There is no permission dialog for battery optimisation without a restricted permission.
  if (key === 'batteryOptimization') return 'openSettings';
  return state === 'undetermined' || state === 'denied' ? 'request' : 'openSettings';
}

export interface OnboardingStep {
  id: 'notifications' | 'location' | 'backgroundLocation' | 'media' | 'battery' | 'backupFolder';
  permissions: readonly PermissionKey[];
  /** Permissions that must be granted before this step makes sense. */
  requires?: readonly PermissionKey[];
}

/**
 * Exact alarms (`SCHEDULE_EXACT_ALARM`) are deliberately not a step: expo-notifications falls back
 * to inexact alarms, which is fine for prompts at random times, and the permission is restricted
 * on stores.
 */
export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  { id: 'notifications', permissions: ['notifications'] },
  { id: 'location', permissions: ['location'] },
  { id: 'backgroundLocation', permissions: ['backgroundLocation'], requires: ['location'] },
  { id: 'media', permissions: ['camera', 'microphone'] },
  { id: 'battery', permissions: ['batteryOptimization'] },
  { id: 'backupFolder', permissions: ['backupFolder'] },
];

export function isStepDone(step: OnboardingStep, statuses: PermissionStatuses): boolean {
  return step.permissions.every((key) => isGranted(statuses[key]));
}

export function isStepAvailable(step: OnboardingStep, statuses: PermissionStatuses): boolean {
  return (step.requires ?? []).every((key) => isGranted(statuses[key]));
}

/**
 * Index of the first step after `afterIndex` that still needs attention, or -1 when onboarding is
 * finished. Steps that are already done (e.g. after a reinstall) or not yet possible are skipped.
 */
export function nextStepIndex(
  steps: readonly OnboardingStep[],
  statuses: PermissionStatuses,
  afterIndex: number,
): number {
  for (let i = afterIndex + 1; i < steps.length; i++) {
    const step = steps[i]!;
    if (isStepAvailable(step, statuses) && !isStepDone(step, statuses)) return i;
  }
  return -1;
}

export function missingPermissions(statuses: PermissionStatuses): PermissionKey[] {
  return PERMISSION_KEYS.filter((key) => !isGranted(statuses[key]));
}
