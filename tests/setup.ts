import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@/config/i18n';

afterEach(() => {
  cleanup();
});
