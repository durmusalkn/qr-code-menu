import { useCallback, useRef } from 'react';

import { saveMoment, updateMoment, type MomentFields } from './captureService';
import type { CaptureOrigin } from './origin';

/**
 * A moment that is created lazily, the first time there is something to keep (text or a
 * recording), and updated afterwards. Nothing is saved for an empty draft.
 */
export function useMomentDraft(origin: CaptureOrigin) {
  const momentId = useRef<string | null>(null);

  const ensureMoment = useCallback(
    (fields: MomentFields = {}): string => {
      if (!momentId.current) momentId.current = saveMoment(origin, fields).id;
      return momentId.current;
    },
    [origin],
  );

  const saveText = useCallback(
    (text: string, starred: boolean) => {
      const note = text.trim() || null;
      if (momentId.current) updateMoment(momentId.current, { note, starred });
      else if (note) ensureMoment({ note, starred });
    },
    [ensureMoment],
  );

  return { ensureMoment, saveText, hasMoment: () => momentId.current !== null };
}
