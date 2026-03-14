// 主题管理模块
export const themeManager = {
  getCurrentTheme() {
    return localStorage.getItem('theme') || 'light';
  },
  setTheme(theme) {
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
  },
  applyTheme(theme) {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.setAttribute('data-theme', 'dark');
    } else {
      html.removeAttribute('data-theme');
    }
  },
  toggleTheme() {
    const currentTheme = this.getCurrentTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
    return newTheme;
  },
  init() {
    const savedTheme = this.getCurrentTheme();
    this.applyTheme(savedTheme);
  },
  getThemeIcon(theme) {
    return theme === 'dark' ? '☀️' : '🌙';
  },
  getThemeName(theme) {
    return theme === 'dark' ? '浅色模式' : '暗黑模式';
  }
};


