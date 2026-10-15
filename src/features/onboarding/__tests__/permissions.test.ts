import {
  ONBOARDING_STEPS,
  PERMISSION_KEYS,
  fromLocationResponse,
  fromPermissionResponse,
  missingPermissions,
  nextStepIndex,
  permissionAction,
  type PermissionStatuses,
} from '@/features/onboarding/permissions';

function statuses(overrides: Partial<PermissionStatuses> = {}): PermissionStatuses {
  const all = Object.fromEntries(
    PERMISSION_KEYS.map((k) => [k, 'undetermined']),
  ) as PermissionStatuses;
  return { ...all, ...overrides };
}

const allGranted = statuses(
  Object.fromEntries(PERMISSION_KEYS.map((k) => [k, 'granted'])) as PermissionStatuses,
);

describe('fromPermissionResponse', () => {
  it.each([
    [{ granted: true, status: 'granted', canAskAgain: true }, 'granted'],
    [{ granted: false, status: 'undetermined', canAskAgain: true }, 'undetermined'],
    [{ granted: false, status: 'denied', canAskAgain: true }, 'denied'],
    [{ granted: false, status: 'denied', canAskAgain: false }, 'blocked'],
  ] as const)('%j → %s', (response, expected) => {
    expect(fromPermissionResponse(response)).toBe(expected);
  });
});

describe('fromLocationResponse', () => {
  const granted = { granted: true, status: 'granted', canAskAgain: true };

  it('accepts precise location', () => {
    expect(fromLocationResponse({ ...granted, android: { accuracy: 'fine' } })).toBe('granted');
  });

  it('treats approximate location as not granted', () => {
    expect(fromLocationResponse({ ...granted, android: { accuracy: 'coarse' } })).toBe('denied');
    expect(
      fromLocationResponse({ ...granted, canAskAgain: false, android: { accuracy: 'coarse' } }),
    ).toBe('blocked');
  });

  it('works without Android details (iOS)', () => {
    expect(fromLocationResponse(granted)).toBe('granted');
  });
});

describe('permissionAction', () => {
  it('shows the system dialog while it still can', () => {
    expect(permissionAction('camera', 'undetermined')).toBe('request');
    expect(permissionAction('notifications', 'denied')).toBe('request');
  });

  it('sends the user to settings otherwise', () => {
    expect(permissionAction('camera', 'blocked')).toBe('openSettings');
    expect(permissionAction('location', 'granted')).toBe('openSettings');
    expect(permissionAction('batteryOptimization', 'undetermined')).toBe('openSettings');
  });

  it('always opens the folder picker for the backup folder', () => {
    expect(permissionAction('backupFolder', 'granted')).toBe('pickFolder');
    expect(permissionAction('backupFolder', 'undetermined')).toBe('pickFolder');
  });
});

describe('nextStepIndex', () => {
  const ids = (index: number) => (index === -1 ? 'done' : ONBOARDING_STEPS[index]!.id);

  it('starts with notifications on a fresh install', () => {
    expect(ids(nextStepIndex(ONBOARDING_STEPS, statuses(), -1))).toBe('notifications');
  });

  it('asks for background location only after foreground location', () => {
    const s = statuses({ notifications: 'granted', location: 'denied' });
    // Location step itself still pending.
    expect(ids(nextStepIndex(ONBOARDING_STEPS, s, 0))).toBe('location');
    // User skipped location: background location makes no sense, go on to media.
    expect(ids(nextStepIndex(ONBOARDING_STEPS, s, 1))).toBe('media');

    const withLocation = statuses({ notifications: 'granted', location: 'granted' });
    expect(ids(nextStepIndex(ONBOARDING_STEPS, withLocation, 1))).toBe('backgroundLocation');
  });

  it('needs both camera and microphone to finish the media step', () => {
    const s = statuses({ camera: 'granted', microphone: 'denied' });
    expect(ids(nextStepIndex(ONBOARDING_STEPS, s, 2))).toBe('media');
  });

  it('skips steps that are already done', () => {
    const s = { ...allGranted, backupFolder: 'undetermined' as const };
    expect(ids(nextStepIndex(ONBOARDING_STEPS, s, -1))).toBe('backupFolder');
  });

  it('finishes when nothing is left', () => {
    expect(nextStepIndex(ONBOARDING_STEPS, allGranted, -1)).toBe(-1);
    expect(nextStepIndex(ONBOARDING_STEPS, statuses(), ONBOARDING_STEPS.length - 1)).toBe(-1);
  });
});

describe('missingPermissions', () => {
  it('lists everything that is not granted, in display order', () => {
    expect(
      missingPermissions({ ...allGranted, camera: 'blocked', backupFolder: 'unknown' }),
    ).toEqual(['camera', 'backupFolder']);
    expect(missingPermissions(allGranted)).toEqual([]);
  });
});
