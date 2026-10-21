import { describe, expect, it } from 'vitest';
import manifestText from '../../public/manifest.webmanifest?raw';
import indexHtml from '../../index.html?raw';
import viteConfig from '../../vite.config';
import icon192 from '../../public/icons/icon-192.png?inline';
import icon512 from '../../public/icons/icon-512.png?inline';

interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

const manifest = JSON.parse(manifestText) as Record<string, unknown> & { icons: ManifestIcon[] };
const base = viteConfig.base ?? '/';

// Icon files keyed by their path inside public/
const iconFiles: Record<string, string> = {
  'icons/icon-192.png': icon192,
  'icons/icon-512.png': icon512,
};

function decodeDataUrl(dataUrl: string): Uint8Array {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function pngSize(bytes: Uint8Array): { width: number; height: number } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // IHDR data starts right after the 8-byte signature and the chunk length + type
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

describe('web app manifest', () => {
  it('describes a Hebrew RTL standalone app', () => {
    expect(manifest.name).toBe('סיימון');
    expect(manifest.short_name).toBe('סיימון');
    expect(manifest.lang).toBe('he');
    expect(manifest.dir).toBe('rtl');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#0B1020');
    expect(manifest.background_color).toBe('#0B1020');
  });

  it('keeps start_url, scope, id and icons under the deploy base path', () => {
    expect(base).toBe('/Simon/');
    expect(manifest.start_url).toBe(base);
    expect(manifest.scope).toBe(base);
    expect(manifest.id).toBe(base);
    for (const icon of manifest.icons) {
      expect(icon.src.startsWith(base)).toBe(true);
    }
  });

  it('declares 192x192 and 512x512 PNG icons', () => {
    const sizes = manifest.icons.filter((icon) => icon.type === 'image/png').map((icon) => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
  });

  it('points every icon at an existing PNG of the declared size', () => {
    for (const icon of manifest.icons) {
      const file = iconFiles[icon.src.slice(base.length)];
      expect(file, icon.src).toBeDefined();
      const bytes = decodeDataUrl(file);
      expect(Array.from(bytes.slice(0, 8))).toEqual(PNG_SIGNATURE);
      const { width, height } = pngSize(bytes);
      expect(`${width}x${height}`).toBe(icon.sizes);
    }
  });
});

describe('index.html', () => {
  it('links the manifest through the base path', () => {
    // Vite prefixes root-absolute public paths with the base (/Simon/) in both dev and build
    expect(indexHtml).toContain('<link rel="manifest" href="/manifest.webmanifest" />');
  });

  it('registers no service worker', () => {
    expect(indexHtml).not.toMatch(/serviceWorker/);
  });
});

describe('source files', () => {
  it('register no service worker', () => {
    const sources = import.meta.glob<string>(['../**/*.ts', '!../__tests__/**'], {
      query: '?raw',
      import: 'default',
      eager: true,
    });
    expect(Object.keys(sources).length).toBeGreaterThan(0);
    for (const [path, source] of Object.entries(sources)) {
      expect(source, path).not.toMatch(/serviceWorker/);
    }
  });
});
