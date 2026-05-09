export type WallpaperBrightness = 'light' | 'dark';
export type WorkspaceWallpaperHeaderTone = 'on-light' | 'on-dark';

export type WorkspaceWallpaperHeaderTheme = {
  tone: WorkspaceWallpaperHeaderTone;
  textColor: string;
  iconColor: string;
  headerBackground: string;
  buttonBackground: string;
  buttonHoverBackground: string;
  buttonActiveBackground: string;
};

type RgbColor = {
  red: number;
  green: number;
  blue: number;
};

const BRIGHTNESS_THRESHOLD = 150;
const IMAGE_SAMPLE_SIZE = 24;
const IMAGE_ANALYSIS_TIMEOUT_MS = 5000;

const ON_DARK_WALLPAPER_HEADER_THEME: WorkspaceWallpaperHeaderTheme = {
  tone: 'on-dark',
  textColor: '#ffffff',
  iconColor: '#ffffff',
  headerBackground: 'rgba(0, 0, 0, 0.18)',
  buttonBackground: 'rgba(255, 255, 255, 0.18)',
  buttonHoverBackground: 'rgba(255, 255, 255, 0.28)',
  buttonActiveBackground: 'rgba(255, 255, 255, 0.35)',
};

const ON_LIGHT_WALLPAPER_HEADER_THEME: WorkspaceWallpaperHeaderTheme = {
  tone: 'on-light',
  textColor: '#172b4d',
  iconColor: '#172b4d',
  headerBackground: 'rgba(255, 255, 255, 0.22)',
  buttonBackground: 'rgba(9, 30, 66, 0.1)',
  buttonHoverBackground: 'rgba(9, 30, 66, 0.16)',
  buttonActiveBackground: 'rgba(9, 30, 66, 0.22)',
};

function getRgbBrightness(color: RgbColor): number {
  return 0.299 * color.red + 0.587 * color.green + 0.114 * color.blue;
}

function resolveBrightnessFromRgb(color: RgbColor): WallpaperBrightness {
  return getRgbBrightness(color) > BRIGHTNESS_THRESHOLD ? 'light' : 'dark';
}

export function resolveBrightnessFromHex(
  hex: string
): WallpaperBrightness | null {
  const normalized = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
  return resolveBrightnessFromRgb({
    red: parseInt(normalized.slice(0, 2), 16),
    green: parseInt(normalized.slice(2, 4), 16),
    blue: parseInt(normalized.slice(4, 6), 16),
  });
}

export function resolveWorkspaceWallpaperHeaderTheme(options: {
  hasImage: boolean;
  brightness: WallpaperBrightness | null;
}): WorkspaceWallpaperHeaderTheme {
  if (options.brightness === 'light') {
    return ON_LIGHT_WALLPAPER_HEADER_THEME;
  }
  if (options.brightness === 'dark') {
    return ON_DARK_WALLPAPER_HEADER_THEME;
  }

  return options.hasImage
    ? ON_DARK_WALLPAPER_HEADER_THEME
    : ON_LIGHT_WALLPAPER_HEADER_THEME;
}

export async function analyzeWorkspaceWallpaperImageBrightness(
  imageUrl: string
): Promise<WallpaperBrightness | null> {
  const url = imageUrl.trim();
  if (!url || typeof document === 'undefined') return null;

  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const settle = (brightness: WallpaperBrightness | null): void => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      resolve(brightness);
    };

    const timeoutId = window.setTimeout(
      () => settle(null),
      IMAGE_ANALYSIS_TIMEOUT_MS
    );

    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = IMAGE_SAMPLE_SIZE;
        canvas.height = IMAGE_SAMPLE_SIZE;
        const context = canvas.getContext('2d', {
          willReadFrequently: true,
        });
        if (!context) {
          settle(null);
          return;
        }
        context.drawImage(image, 0, 0, IMAGE_SAMPLE_SIZE, IMAGE_SAMPLE_SIZE);
        const data = context.getImageData(
          0,
          0,
          IMAGE_SAMPLE_SIZE,
          IMAGE_SAMPLE_SIZE
        ).data;
        let red = 0;
        let green = 0;
        let blue = 0;
        let weight = 0;
        for (let index = 0; index < data.length; index += 4) {
          const alpha = data[index + 3] / 255;
          if (alpha <= 0) continue;
          red += data[index] * alpha;
          green += data[index + 1] * alpha;
          blue += data[index + 2] * alpha;
          weight += alpha;
        }
        if (weight <= 0) {
          settle(null);
          return;
        }
        settle(
          resolveBrightnessFromRgb({
            red: red / weight,
            green: green / weight,
            blue: blue / weight,
          })
        );
      } catch {
        settle(null);
      }
    };
    image.onerror = () => settle(null);
    image.src = url;
  });
}
