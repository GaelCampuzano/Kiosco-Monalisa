/**
 * Gestor de traducciones y PUNTO DE ENTRADA de la aplicación
 */

const i18n = {
    translations: {},

    async loadLanguage(lang) {
        const response = await fetch(`/i18n/${lang}.json`);
        if (!response.ok) {
            throw new Error(`Error al cargar el archivo de idioma: ${lang}.json. Status: ${response.status}`);
        }
        this.translations = await response.json();
    },

    applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (this.translations[key]) {
                element.innerHTML = this.translations[key];
            }
        });
        document.documentElement.lang = this.currentLanguage;
    },

    t(key, replacements = {}) {
        let translation = this.translations[key] || key;
        for (const placeholder in replacements) {
            translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
        }
        return translation;
    },

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
    
    async changeLanguage(lang) {
        if (lang === this.currentLanguage) return;
        this.currentLanguage = lang;
        localStorage.setItem('language', lang);
        await this.loadLanguage(lang);
        this.applyTranslations();
        this.updateLangSelectorUI();
        
        // --- ESTA ES LA LÍNEA NUEVA Y CRUCIAL ---
        // Le decimos a la app que reconstruya el menú de meseros.
        app.loadWaiters();
    },

    updateLangSelectorUI() {
        document.querySelectorAll('.language-selector button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === this.currentLanguage);
        });
    }
};

// --- PUNTO DE ENTRADA PRINCIPAL (VERSIÓN A PRUEBA DE ERRORES) ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log("DOM Cargado. Inicializando i18n...");
        await i18n.init('es');
        
        console.log("i18n listo. Arrancando la aplicación...");
        app.init();

    } catch (error) {
        console.error("ERROR FATAL DURANTE LA INICIALIZACIÓN:", error);
    }
});