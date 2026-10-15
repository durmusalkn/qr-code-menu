import { MOMENT_SOURCES, type MomentSource } from '@/db/schema';

/** Where a capture came from: the app itself, a prompt notification or the quick-capture bar. */
export interface CaptureOrigin {
  source: MomentSource;
  promptId: string | null;
}

export const IN_APP: CaptureOrigin = { source: 'in_app', promptId: null };

type RouteParam = string | string[] | undefined;

function single(value: RouteParam): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Reads `source` / `promptId` route params, falling back to an in-app capture. */
export function parseCaptureOrigin(params: {
  source?: RouteParam;
  promptId?: RouteParam;
}): CaptureOrigin {
  const source = single(params.source);
  const promptId = single(params.promptId) || null;
  const valid = MOMENT_SOURCES.find((s) => s === source);
  return { source: valid ?? 'in_app', promptId: valid === 'prompt' ? promptId : null };
}
