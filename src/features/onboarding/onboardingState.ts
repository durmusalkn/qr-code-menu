import { db } from '@/db/client';
import { createSettingsRepository } from '@/features/settings/repository';

const settings = createSettingsRepository(db);

export function isOnboardingCompleted(): boolean {
  return settings.get('onboardingCompleted');
}

export function completeOnboarding(): void {
  settings.set('onboardingCompleted', true);
}
