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
    primary:
      'inline-flex items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors duration-150 ease-out hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-1',
    secondary:
      'inline-flex items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors duration-150 ease-out hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-1',
    danger:
      'inline-flex items-center justify-center rounded-lg bg-rose-600 text-white transition-colors duration-150 ease-out hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:ring-offset-1',
  },
  input:
    'h-11 rounded-lg border border-slate-200 bg-white px-3 text-[16px] text-slate-900 placeholder:text-slate-400 transition-[background-color,border-color,color,box-shadow] duration-150 ease-out hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 md:text-sm',
  checkbox:
    'h-5 w-5 rounded-md border border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-300 focus:ring-offset-1',
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
