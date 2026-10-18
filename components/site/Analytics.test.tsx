import { render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { Analytics } from './Analytics';

const scripts = () => document.head.querySelectorAll('script[src="/_vercel/insights/script.js"]');

describe('Analytics', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    document.head.innerHTML = '';
  });

  test('counts nothing in development, on a preview or on a laptop: no script without the production flag', () => {
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS', '');
    render(<Analytics />);
    expect(scripts()).toHaveLength(0);
  });

  test('on the production deploy it loads Vercel’s own script from this site’s own address, deferred, and takes it away again on unmount', () => {
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS', '1');
    const { unmount } = render(<Analytics />);
    expect(scripts()).toHaveLength(1);
    expect(scripts()[0]).toHaveAttribute('defer');
    unmount();
    expect(scripts()).toHaveLength(0);
  });
});
