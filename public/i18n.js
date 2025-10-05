// Este objeto se encarga de las traducciones.
const i18n = {
    translations: {},

    // Cargamos el archivo de idioma.
    async loadLanguage(lang) {
        const response = await fetch(`/i18n/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Error al cargar el archivo de idioma: ${lang}.json. Status: ${response.status}`);
        }
        this.translations = await response.json();
    },

    // Aplicamos las traducciones a los elementos del HTML.
    applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (this.translations[key]) {
                element.innerHTML = this.translations[key];
            }
        });
        document.documentElement.lang = this.currentLanguage;
    },

    // Obtenemos una traducción específica.
    t(key, replacements = {}) {
        let translation = this.translations[key] || key;
        for (const placeholder in replacements) {
            translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
        }
        return translation;
    },

    // Inicializamos el sistema de traducciones.
    async init(defaultLang = 'es') {
        let lang = localStorage.getItem('language') || navigator.language.split('-')[0];
        if (!['es', 'en'].includes(lang)) {
            lang = defaultLang;
        }
        this.currentLanguage = lang;
        await this.loadLanguage(lang);
        this.applyTranslations();
        this.updateLangSelectorUI();
    },
    
    // Cambiamos de idioma.
    async changeLanguage(lang) {
        if (lang === this.currentLanguage) return;
        this.currentLanguage = lang;
        localStorage.setItem('language', lang);
        await this.loadLanguage(lang);
        this.applyTranslations();
        this.updateLangSelectorUI();
        app.loadWaiters();
        // Limpiamos los errores para que no se queden en el idioma anterior.
        if (typeof app.clearValidationErrors === 'function') {
            app.clearValidationErrors();
        }
    },

    // Actualizamos la interfaz de los botones de idioma.
    updateLangSelectorUI() {
        document.querySelectorAll('.language-selector button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === this.currentLanguage);
        });
    }
};

// Punto de entrada de la aplicación.
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await i18n.init('es');
        app.init();
    } catch (error) {
        console.error("ERROR FATAL DURANTE LA INICIALIZACIÓN:", error);
    }
});