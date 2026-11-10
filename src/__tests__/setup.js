import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

if (typeof HTMLMediaElement !== 'undefined') {
  HTMLMediaElement.prototype.pause = vi.fn();
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
}
