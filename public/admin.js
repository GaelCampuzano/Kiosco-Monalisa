/**
 * Dashboard de Administración
 */
document.addEventListener('DOMContentLoaded', () => {
    // Funciones de Ayuda
    const toggleElement = (element, show) => element.classList.toggle('hidden', !show);
    const showTemporaryError = (element, message, duration = 5000) => {
        element.textContent = message;
        toggleElement(element, true);
        setTimeout(() => toggleElement(element, false), duration);
    };

    // Referencias a elementos del DOM
    const DOMElements = {
        loginModalOverlay: document.getElementById('login-modal-overlay'),
        loginForm: document.getElementById('login-form'),
        usernameInput: document.getElementById('username'),
        passwordInput: document.getElementById('password'),
        loginErrorMessage: document.getElementById('login-error-message'),
        tipsTbody: document.getElementById('tips-tbody'),
        filterForm: document.getElementById('filter-form'),
        filterErrorMessage: document.getElementById('filter-error-message'),
        startDateInput: document.getElementById('start-date-filter'),
        endDateInput: document.getElementById('end-date-filter'),
        loader: document.getElementById('loader'),
        totalRecordsSpan: document.getElementById('total-records'),
        averageTipSpan: document.getElementById('average-tip'),
        exportCsvBtn: document.getElementById('export-csv-btn'),
        exportErrorMessage: document.getElementById('export-error-message'),
        logoutBtn: document.getElementById('logout-btn'),
        dashboardContainer: document.querySelector('.container'),
        resetFiltersBtn: document.getElementById('reset-filters-btn'),
        waiterFilterInput: document.getElementById('waiter-filter'),
    };

    // Objeto principal de la aplicación
    const app = {
        init: async () => {
            app.addEventListeners();
            try {
                const session = await apiClient.checkSession();
                if (session.loggedIn) {
                    app.showDashboard(true);
                    await app.loadTips();
                } else {
                    app.showDashboard(false);
                }
            } catch (error) {
                console.error('Error al verificar sesión:', error);
                app.showDashboard(false);
            }
        },

        addEventListeners: () => {
            DOMElements.loginForm.addEventListener('submit', app.handleLogin);
            DOMElements.logoutBtn.addEventListener('click', app.handleLogout);
            DOMElements.filterForm.addEventListener('submit', app.handleFilter);
            DOMElements.resetFiltersBtn.addEventListener('click', app.handleResetFilters);
            DOMElements.exportCsvBtn.addEventListener('click', app.handleExport);
            
            // Ocultar errores al escribir
            [DOMElements.usernameInput, DOMElements.passwordInput].forEach(input => 
                input.addEventListener('input', () => toggleElement(DOMElements.loginErrorMessage, false))
            );
            [DOMElements.startDateInput, DOMElements.endDateInput].forEach(input =>
                input.addEventListener('input', () => toggleElement(DOMElements.filterErrorMessage, false))
            );
        },

        showDashboard: (show) => {
            toggleElement(DOMElements.loginModalOverlay, !show);
            toggleElement(DOMElements.dashboardContainer, show);
        },

        handleLogin: async (e) => {
            e.preventDefault();
            toggleElement(DOMElements.loader, true);
            try {
                await apiClient.login(DOMElements.usernameInput.value, DOMElements.passwordInput.value);
                app.showDashboard(true);
                await app.loadTips();
            } catch (error) {
                DOMElements.loginErrorMessage.textContent = error.message;
                toggleElement(DOMElements.loginErrorMessage, true);
            } finally {
                toggleElement(DOMElements.loader, false);
            }
        },

        handleLogout: async () => {
            toggleElement(DOMElements.loader, true);
            try {
                await apiClient.logout();
                app.showDashboard(false);
            } catch (error) {
                showTemporaryError(DOMElements.loginErrorMessage, 'Error al cerrar la sesión.');
            } finally {
                toggleElement(DOMElements.loader, false);
            }
        },

        loadTips: async (filters = {}) => {
            toggleElement(DOMElements.loader, true);
            try {
                const tips = await apiClient.getTips(filters);
                app.render.table(tips);
                app.render.totals(tips);
            } catch (error) {
                console.error('Error al cargar propinas:', error);
                if (error.message.includes('401')) { // Si no está autorizado
                    app.showDashboard(false);
                } else {
                    DOMElements.tipsTbody.innerHTML = `<tr><td colspan="5">Error al cargar los datos.</td></tr>`;
                }
            } finally {
                toggleElement(DOMElements.loader, false);
            }
        },

        getFilters: () => ({
            waiterName: DOMElements.waiterFilterInput.value,
            startDate: DOMElements.startDateInput.value,
            endDate: DOMElements.endDateInput.value,
        }),

        handleFilter: (e) => {
            e.preventDefault();
            const filters = app.getFilters();
            if (filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate)) {
                showTemporaryError(DOMElements.filterErrorMessage, 'La fecha de inicio no puede ser posterior a la fecha de fin.');
                return;
            }
            app.loadTips(filters);
        },

        handleResetFilters: () => {
            DOMElements.filterForm.reset();
            toggleElement(DOMElements.filterErrorMessage, false);
            app.loadTips();
        },

        handleExport: async () => {
            toggleElement(DOMElements.loader, true);
            try {
                const response = await apiClient.downloadTipsCsv(app.getFilters());
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Error ${response.status}`);
                }
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'reporte_propinas.csv';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            } catch (error) {
                console.error('Error en la descarga del CSV:', error);
                showTemporaryError(DOMElements.exportErrorMessage, error.message);
            } finally {
                toggleElement(DOMElements.loader, false);
            }
        },
        
        // Funciones de Renderizado
        render: {
            table: (tips) => {
                DOMElements.tipsTbody.innerHTML = '';
                if (tips.length === 0) {
                    DOMElements.tipsTbody.innerHTML = '<tr><td colspan="5">No se encontraron registros.</td></tr>';
                    return;
                }
                const rows = tips.map(tip => `
                    <tr>
                        <td>${tip.id}</td>
                        <td>${tip.table_number}</td>
                        <td>${tip.waiter_name}</td>
                        <td>${tip.tip_percentage}%</td>
                        <td>${new Date(tip.created_at).toLocaleString()}</td>
                    </tr>`
                ).join('');
                DOMElements.tipsTbody.innerHTML = rows;
            },
            totals: (tips) => {
                DOMElements.totalRecordsSpan.textContent = tips.length;
                if (tips.length > 0) {
                    const totalTip = tips.reduce((sum, tip) => sum + tip.tip_percentage, 0);
                    const average = (totalTip / tips.length).toFixed(2);
                    DOMElements.averageTipSpan.textContent = `${average}%`;
                } else {
                    DOMElements.averageTipSpan.textContent = '0%';
                }
            }
        }
    };

    app.init();
});