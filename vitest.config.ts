// vitest.config.ts — tests unitarios (no pisan los E2E de Playwright)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/__tests__/*.spec.ts'],
    environment: 'node',
  },
});