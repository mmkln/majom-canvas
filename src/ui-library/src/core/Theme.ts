// src/core/Theme.ts
interface Theme {
  button: {
    primary: string;
    secondary: string;
    danger: string;
  };
  input: string;
  checkbox: string;
}

const defaultTheme: Theme = {
  button: {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-500 text-white hover:bg-gray-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  },
  input: 'border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500',
  checkbox: 'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded',
};

export class ThemeManager {
  private static theme: Theme = defaultTheme;

  public static setTheme(customTheme: Partial<Theme>): void {
    this.theme = { ...defaultTheme, ...customTheme };
  }

  public static getTheme(): Theme {
    return this.theme;
  }
}
