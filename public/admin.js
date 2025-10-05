document.addEventListener('DOMContentLoaded', () => {
    // Aquí guardamos las referencias a los elementos del HTML.
    const UI = {
        container: document.querySelector('.container'),
        loader: document.getElementById('loader'),
        adminOfflineIndicator: document.getElementById('admin-offline-indicator'),
        login: {
            overlay: document.getElementById('login-modal-overlay'),
            form: document.getElementById('login-form'),
            username: document.getElementById('username'),
            password: document.getElementById('password'),
            errorMessage: document.getElementById('login-error-message'),
            submitBtn: document.querySelector('#login-form button'),
            offlineWarning: document.getElementById('login-offline-warning')
        },
        filters: {
            form: document.getElementById('filter-form'),
            waiter: document.getElementById('waiter-filter'),
            startDate: document.getElementById('start-date-filter'),
            endDate: document.getElementById('end-date-filter'),
            applyBtn: document.querySelector('#filter-form button[type="submit"]'),
            resetBtn: document.getElementById('reset-filters-btn'),
            errorMessage: document.getElementById('filter-error-message'),
        },
        export: {
            btn: document.getElementById('export-csv-btn'),
            errorMessage: document.getElementById('export-error-message'),
        },
        tableBody: document.getElementById('tips-tbody'),
        totalRecords: document.getElementById('total-records'),
        averageTip: document.getElementById('average-tip'),
        logoutBtn: document.getElementById('logout-btn'),
    };

    // Funciones que nos ayudan a no repetir código.
    const utils = {
        toggle: (element, show) => element.classList.toggle('hidden', !show),
        showError: (element, message, duration = 4000) => {
            element.textContent = message;
            utils.toggle(element, true);
            setTimeout(() => utils.toggle(element, false), duration);
        },
        renderTable(tips) {
            UI.tableBody.innerHTML = tips.length > 0
                ? tips.map(tip => `
                    <tr>
                        <td>${tip.id}</td>
                        <td>${tip.table_number}</td>
                        <td>${tip.waiter_name}</td>
                        <td>${tip.tip_percentage}%</td>
                        <td>${new Date(tip.created_at).toLocaleString('es-MX')}</td>
                    </tr>`).join('')
                : '<tr><td colspan="5">No se encontraron registros.</td></tr>';
        },
        renderTotals(tips) {
            const total = tips.length;
            UI.totalRecords.textContent = total;
            UI.averageTip.textContent = total > 0
                ? `${(tips.reduce((sum, tip) => sum + tip.tip_percentage, 0) / total).toFixed(2)}%`
                : '0%';
        },
        getFilters: () => ({
            waiterName: UI.filters.waiter.value.trim(),
            startDate: UI.filters.startDate.value,
            endDate: UI.filters.endDate.value,
        }),
    };

    // Objeto principal de la aplicación.
    const app = {
        isOnline: true,

        init() {
            this.addEventListeners();
            this.handleNetworkChange();
            this.checkUserSession();
        },
        
        addEventListeners() {
            window.addEventListener('online', this.handleNetworkChange.bind(this));
            window.addEventListener('offline', this.handleNetworkChange.bind(this));
            UI.login.form.addEventListener('submit', this.handleLogin.bind(this));
            UI.logoutBtn.addEventListener('click', this.handleLogout.bind(this));
            UI.filters.form.addEventListener('submit', this.handleFilter.bind(this));
            UI.filters.resetBtn.addEventListener('click', this.handleResetFilters.bind(this));
            UI.export.btn.addEventListener('click', this.handleExport.bind(this));
        },

        // Revisamos si tenemos conexión a internet.
        async handleNetworkChange() {
            try {
                await fetch('/api/session', { method: 'HEAD', cache: 'no-store' });
                this.isOnline = true;
            } catch {
                this.isOnline = false;
            }
            this.updateUIForNetworkStatus();
        },

        // Actualizamos la interfaz dependiendo de si hay o no internet.
        updateUIForNetworkStatus() {
            utils.toggle(UI.login.offlineWarning, !this.isOnline);
            UI.login.submitBtn.disabled = !this.isOnline;
            
            utils.toggle(UI.adminOfflineIndicator, !this.isOnline);
            UI.filters.applyBtn.disabled = !this.isOnline;
            UI.export.btn.disabled = !this.isOnline;
        },
        
        // Función para ejecutar tareas asíncronas y mostrar un loader.
        async runAsync(task, showErrorElement = null) {
            utils.toggle(UI.loader, true);
            try {
                await task();
            } catch (error) {
                console.error('Ocurrió un error:', error);
                const errorMessage = error.message.includes('Failed to fetch') 
                    ? 'Error de conexión. Por favor, revisa tu internet.'
                    : error.message;
                if (showErrorElement) {
                    utils.showError(showErrorElement, errorMessage);
                }
                if (errorMessage.includes('Error de conexión')) {
                    this.handleNetworkChange();
                }
            } finally {
                utils.toggle(UI.loader, false);
            }
        },

        showDashboard(show) {
            utils.toggle(UI.login.overlay, !show);
            utils.toggle(UI.container, show);
        },
        
        // Verificamos si el usuario ya ha iniciado sesión.
        async checkUserSession() {
            if (!this.isOnline) {
                this.showDashboard(false);
                return;
            }
            await this.runAsync(async () => {
                const session = await apiClient.checkSession();
                if (session.loggedIn) {
                    this.showDashboard(true);
                    await this.loadTips();
                } else {
                    this.showDashboard(false);
                }
            }, UI.login.errorMessage);
        },

        // Cargamos las propinas desde la API.
        async loadTips(filters = {}) {
            await this.runAsync(async () => {
                const tips = await apiClient.getTips(filters);
                utils.renderTable(tips);
                utils.renderTotals(tips);
            }, UI.filters.errorMessage);
        },

        // Manejamos el inicio de sesión.
        async handleLogin(e) {
            e.preventDefault();
            if (!this.isOnline) return;

            utils.toggle(UI.login.errorMessage, false);
            await this.runAsync(async () => {
                await apiClient.login(UI.login.username.value, UI.login.password.value);
                this.showDashboard(true);
                await this.loadTips();
            }, UI.login.errorMessage);
        },

        // Manejamos el cierre de sesión.
        async handleLogout() {
            await this.runAsync(async () => {
                await apiClient.logout();
                this.showDashboard(false);
                UI.filters.form.reset();
                utils.renderTable([]);
                utils.renderTotals([]);
            }, UI.login.errorMessage);
        },
        
        // Aplicamos los filtros de búsqueda.
        handleFilter(e) {
            e.preventDefault();
            if (!this.isOnline) {
                utils.showError(UI.filters.errorMessage, 'Necesitas conexión para filtrar los datos.');
                return;
            }
            const filters = utils.getFilters();
            if (filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate)) {
                utils.showError(UI.filters.errorMessage, 'La fecha de inicio no puede ser posterior a la de fin.');
                return;
            }
            this.loadTips(filters);
        },

        // Limpiamos los filtros de búsqueda.
        handleResetFilters() {
            UI.filters.form.reset();
            if (this.isOnline) {
                this.loadTips();
            }
        },

        // Exportamos los datos a un archivo CSV.
        async handleExport() {
            if (!this.isOnline) {
                utils.showError(UI.export.errorMessage, 'Necesitas conexión para exportar los datos.');
                return;
            }
            await this.runAsync(async () => {
                const response = await apiClient.downloadTipsCsv(utils.getFilters());
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `reporte_propinas_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            }, UI.export.errorMessage);
        }
    };

    app.init();
});