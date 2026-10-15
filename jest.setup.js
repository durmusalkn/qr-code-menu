// Native modules are unavailable under Jest; give the ones pure code relies on a Node backing.
jest.mock('expo-crypto', () => ({
  randomUUID: () => require('node:crypto').randomUUID(),
}));

