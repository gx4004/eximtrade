const I18N = {
  currentLang: localStorage.getItem('lang') || 'pl',
  translations: {},

  async init() {
    await this.loadLang(this.currentLang);
    this.apply();
    this.updateSwitcher();
  },

  async loadLang(lang) {
    const base = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    const res = await fetch(base + 'lang/' + lang + '.json');
    this.translations = await res.json();
    this.currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
  },

  get(key) {
    return key.split('.').reduce((obj, k) => obj?.[k], this.translations) || key;
  },

  apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const val = this.get(el.getAttribute('data-i18n'));
      if (val !== el.getAttribute('data-i18n')) el.textContent = val;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const val = this.get(el.getAttribute('data-i18n-html'));
      if (val !== el.getAttribute('data-i18n-html')) el.innerHTML = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const val = this.get(el.getAttribute('data-i18n-placeholder'));
      if (val !== el.getAttribute('data-i18n-placeholder')) el.placeholder = val;
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const val = this.get(el.getAttribute('data-i18n-aria'));
      if (val !== el.getAttribute('data-i18n-aria')) el.setAttribute('aria-label', val);
    });
  },

  async switchTo(lang) {
    await this.loadLang(lang);
    this.apply();
    this.updateSwitcher();
  },

  updateSwitcher() {
    document.querySelectorAll('[data-lang-btn]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.langBtn === this.currentLang);
    });
  }
};

document.addEventListener('DOMContentLoaded', () => I18N.init());
