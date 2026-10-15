import { and, asc, eq, gt, gte, isNull, lt } from 'drizzle-orm';

import { defaultDeps, type RepositoryDeps } from '@/db/deps';
import { prompts, type Prompt, type PromptKind } from '@/db/schema';
import type { AppDatabase } from '@/db/types';

export interface PlannedPrompt {
  kind: PromptKind;
  scheduledFor: number;
}

export function createPromptsRepository(db: AppDatabase, deps: RepositoryDeps = defaultDeps) {
  return {
    addPlanned(planned: readonly PlannedPrompt[]): Prompt[] {
      if (planned.length === 0) return [];
      return db
        .insert(prompts)
        .values(
          planned.map((p) => ({ id: deps.newId(), kind: p.kind, scheduledFor: p.scheduledFor })),
        )
        .returning()
        .all();
    },

    getById(id: string): Prompt | undefined {
      return db.select().from(prompts).where(eq(prompts.id, id)).get();
    },

    /** Prompts with `from <= scheduled_for < to`, earliest first. */
    listBetween(from: number, to: number): Prompt[] {
      return db
        .select()
        .from(prompts)
        .where(and(gte(prompts.scheduledFor, from), lt(prompts.scheduledFor, to)))
        .orderBy(asc(prompts.scheduledFor))
        .all();
    },

    /** Not yet delivered prompts scheduled after `now`, earliest first. */
    listPending(now: number): Prompt[] {
      return db
        .select()
        .from(prompts)
        .where(and(gt(prompts.scheduledFor, now), isNull(prompts.deliveredAt)))
        .orderBy(asc(prompts.scheduledFor))
        .all();
    },

    /**
     * Removes pending prompts so the plan can be rebuilt. Returns them so the caller can cancel
     * their OS notifications.
     */
    removePending(now: number): Prompt[] {
      return db
        .delete(prompts)
        .where(and(gt(prompts.scheduledFor, now), isNull(prompts.deliveredAt)))
        .returning()
        .all();
    },

    setNotificationId(id: string, notificationId: string): void {
      db.update(prompts).set({ notificationId }).where(eq(prompts.id, id)).run();
    },

    markDelivered(id: string, at: number = deps.now()): void {
      db.update(prompts)
        .set({ deliveredAt: at })
        .where(and(eq(prompts.id, id), isNull(prompts.deliveredAt)))
        .run();
    },

    markResponded(id: string, momentId: string | null, at: number = deps.now()): void {
      db.update(prompts)
        .set({ respondedAt: at, responseMomentId: momentId })
        .where(eq(prompts.id, id))
        .run();
    },
  };
}

export type PromptsRepository = ReturnType<typeof createPromptsRepository>;
