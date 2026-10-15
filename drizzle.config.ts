import { defineConfig } from 'drizzle-kit';

// No `driver: 'expo'`: that mode emits a migrations.js importing .sql files, which needs an extra
// Babel plugin. `scripts/bundle-migrations.js` turns the SQL into a TypeScript module instead.
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './drizzle',
});
