/**
 * Dashboard de Administración - Versión Simplificada
 */
document.addEventListener('DOMContentLoaded', () => {
    // Objeto para centralizar todas las referencias al DOM
    const UI = {
        container: document.querySelector('.container'),
        loader: document.getElementById('loader'),
        // Login
        login: {
            overlay: document.getElementById('login-modal-overlay'),
            form: document.getElementById('login-form'),
            username: document.getElementById('username'),
            password: document.getElementById('password'),
            errorMessage: document.getElementById('login-error-message'),
        },
        // Filtros y Exportación
        filters: {
            form: document.getElementById('filter-form'),
            waiter: document.getElementById('waiter-filter'),
            startDate: document.getElementById('start-date-filter'),
            endDate: document.getElementById('end-date-filter'),
            resetBtn: document.getElementById('reset-filters-btn'),
            errorMessage: document.getElementById('filter-error-message'),
        },
        export: {
            btn: document.getElementById('export-csv-btn'),
            errorMessage: document.getElementById('export-error-message'),
        },
        // Datos y Tabla
        tableBody: document.getElementById('tips-tbody'),
        totalRecords: document.getElementById('total-records'),
        averageTip: document.getElementById('average-tip'),
        logoutBtn: document.getElementById('logout-btn'),
    };

    // Funciones de utilidad
    const utils = {
        toggle: (element, show) => element.classList.toggle('hidden', !show),
        showError: (element, message, duration = 4000) => {
            element.textContent = message;
            utils.toggle(element, true);
            setTimeout(() => utils.toggle(element, false), duration);
        },
        renderTable: (tips) => {
            const rowsHtml = tips.length > 0
                ? tips.map(tip => `
                    <tr>
                        <td>${tip.id}</td>
                        <td>${tip.table_number}</td>
                        <td>${tip.waiter_name}</td>
                        <td>${tip.tip_percentage}%</td>
                        <td>${new Date(tip.created_at).toLocaleString('es-MX')}</td>
                    </tr>`).join('')
                : '<tr><td colspan="5">No se encontraron registros.</td></tr>';
            UI.tableBody.innerHTML = rowsHtml;
        },
        renderTotals: (tips) => {
            const total = tips.length;
            UI.totalRecords.textContent = total;
            if (total > 0) {
                const totalTip = tips.reduce((sum, tip) => sum + tip.tip_percentage, 0);
                const average = (totalTip / total).toFixed(2);
                UI.averageTip.textContent = `${average}%`;
            } else {
                UI.averageTip.textContent = '0%';
            }
        },
        getFilters: () => ({
            waiterName: UI.filters.waiter.value.trim(),
            startDate: UI.filters.startDate.value,
            endDate: UI.filters.endDate.value,
        }),
    };

    // Lógica principal de la aplicación
    const app = {
        init() {
            this.addEventListeners();
            this.checkUserSession();
        },
        
        addEventListeners() {
            UI.login.form.addEventListener('submit', this.handleLogin);
            UI.logoutBtn.addEventListener('click', this.handleLogout);
            UI.filters.form.addEventListener('submit', this.handleFilter);
            UI.filters.resetBtn.addEventListener('click', this.handleResetFilters);
            UI.export.btn.addEventListener('click', this.handleExport);
        },
        
        async runAsync(task) {
            utils.toggle(UI.loader, true);
            try {
                await task();
            } catch (error) {
                console.error('Ocurrió un error:', error);
                // El manejo de errores específico se hará en cada handler
            } finally {
                utils.toggle(UI.loader, false);
            }
        },

        showDashboard(show) {
            utils.toggle(UI.login.overlay, !show);
            utils.toggle(UI.container, show);
        },
        
        async checkUserSession() {
            await this.runAsync(async () => {
                try {
                    const session = await apiClient.checkSession();
                    if (session.loggedIn) {
                        this.showDashboard(true);
                        await this.loadTips();
                    } else {
                        this.showDashboard(false);
                    }
                } catch {
                    this.showDashboard(false);
                }
            });
        },

        loadTips: async (filters = {}) => {
            await app.runAsync(async () => {
                try {
                    const tips = await apiClient.getTips(filters);
                    utils.renderTable(tips);
                    utils.renderTotals(tips);
                } catch (error) {
                    if (error.message.includes('401')) { // No autorizado
                        app.showDashboard(false);
                    } else {
                        utils.showError(UI.filters.errorMessage, 'Error al cargar los datos.');
                    }
                }
            });
        },

        handleLogin: async (e) => {
            e.preventDefault();
            utils.toggle(UI.login.errorMessage, false);
            await app.runAsync(async () => {
                try {
                    await apiClient.login(UI.login.username.value, UI.login.password.value);
                    app.showDashboard(true);
                    await app.loadTips();
                } catch (error) {
                    utils.showError(UI.login.errorMessage, error.message);
                }
            });
        },

        handleLogout: async () => {
            await app.runAsync(async () => {
                try {
                    await apiClient.logout();
                    app.showDashboard(false);
                } catch {
                    app.showDashboard(false);
                }
            });
        },
        
        handleFilter: (e) => {
            e.preventDefault();
            const filters = utils.getFilters();
            if (filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate)) {
                utils.showError(UI.filters.errorMessage, 'La fecha de inicio no puede ser posterior a la de fin.');
                return;
            }
            app.loadTips(filters);
        },

        handleResetFilters: () => {
            UI.filters.form.reset();
            utils.toggle(UI.filters.errorMessage, false);
            app.loadTips();
        },

        handleExport: async () => {
            await app.runAsync(async () => {
                try {
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
                } catch (error) {
                    utils.showError(UI.export.errorMessage, `Error al exportar: ${error.message}`);
                }
            });
        }
    };

    app.init();
});