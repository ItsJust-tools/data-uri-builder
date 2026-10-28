import toolConfig from './tool.config';

const DEFAULT_DEV_URL = 'http://localhost:3000';

export const templateMetadata = {
  htmlLang: 'en',
  locale: 'en_US',
  appName: toolConfig.name,
  shortName: toolConfig.name,
  appDescription: toolConfig.description,
  iconPath: '/icon.svg',
  /**
   * Maskable PWA icons. They are full-bleed PNGs built by
   * `scripts/generate-maskable-icons.mjs`, so Android launchers can crop them
   * to any shape without clipping the glyph.
   */
  maskableIcons: [
    { src: '/maskable-icon-192.png', sizes: '192x192' },
    { src: '/maskable-icon-512.png', sizes: '512x512' },
  ],
} as const;

export function getPublicSiteUrl(): string {
  return process.env.NEXT_PUBLIC_URL || DEFAULT_DEV_URL;
}
