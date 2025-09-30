/**
 * Dashboard de Administración
 * - Maneja autenticación via Sesiones
 * - Carga y renderiza registros con filtros
 * - Calcula métricas básicas (conteo y promedio)
 * - Exporta datos filtrados a CSV
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Referencias a elementos del DOM
    const loginModalOverlay = document.getElementById('login-modal-overlay');
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginErrorMessage = document.getElementById('login-error-message');
    const mainContent = document.getElementById('main-content');
    const tipsTbody = document.getElementById('tips-tbody');
    const filterForm = document.getElementById('filter-form');
    const loader = document.getElementById('loader');
    const totalRecordsSpan = document.getElementById('total-records');
    const averageTipSpan = document.getElementById('average-tip');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // 1. Verificar si hay una sesión activa al cargar la página
    try {
        const response = await fetch('/api/session');
        const data = await response.json();
        if (data.loggedIn) {
            showDashboard();
            await loadTips();
        } else {
            showLoginModal();
        }
    } catch (error) {
        showLoginModal();
    }

    // Funciones auxiliares para mostrar/ocultar elementos
    function showDashboard() {
        loginModalOverlay.classList.add('hidden');
        mainContent.style.visibility = 'visible';
        logoutBtn.classList.remove('hidden');
    }

    function showLoginModal() {
        loginModalOverlay.classList.remove('hidden');
        mainContent.style.visibility = 'hidden';
        logoutBtn.classList.add('hidden');
    }

    // 2. Manejar el envío del formulario de login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput.value;
        const password = passwordInput.value;
        
        loader.classList.remove('hidden');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                showDashboard();
                await loadTips();
            } else {
                const data = await response.json();
                loginErrorMessage.textContent = data.error || 'Credenciales incorrectas.';
                loginErrorMessage.classList.remove('hidden');
            }
        } catch (error) {
            loginErrorMessage.textContent = 'No se pudo conectar con el servidor.';
            loginErrorMessage.classList.remove('hidden');
        } finally {
            loader.classList.add('hidden');
        }
    });

    // 3. Manejar el botón de cerrar sesión
    logoutBtn.addEventListener('click', async () => {
        loader.classList.remove('hidden');
        try {
            await fetch('/api/logout', { method: 'POST' });
            showLoginModal();
        } catch (error) {
            alert('Error al cerrar la sesión.');
        } finally {
            loader.classList.add('hidden');
        }
    });
    
    // Ocultar mensaje de error al escribir
    usernameInput.addEventListener('input', () => loginErrorMessage.classList.add('hidden'));
    passwordInput.addEventListener('input', () => loginErrorMessage.classList.add('hidden'));

    // 4. Función para cargar, renderizar y calcular datos (sin cabecera Auth)
    async function loadTips(filters = {}) {
        loader.classList.remove('hidden');
        let url = '/api/tips';
        const params = new URLSearchParams();
        if (filters.waiterName) params.append('waiterName', filters.waiterName);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        
        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;

        try {
            const response = await fetch(url); // Ya no se necesita cabecera de Auth
            if (!response.ok) {
                if(response.status === 401) { // Sesión expirada/inválida
                    showLoginModal();
                }
                throw new Error('No se pudieron cargar los datos.');
            }
            const tips = await response.json();
            renderTable(tips);
            updateTotals(tips);
        } catch (error) {
            console.error('Error al cargar propinas:', error);
            tipsTbody.innerHTML = `<tr><td colspan="5">Error al cargar los datos.</td></tr>`;
        } finally {
            loader.classList.add('hidden');
        }
    }

    // Funciones renderTable y updateTotals (sin cambios)
    function renderTable(tips) {
        tipsTbody.innerHTML = '';
        if (tips.length === 0) {
            tipsTbody.innerHTML = '<tr><td colspan="5">No se encontraron registros.</td></tr>';
            return;
        }
        tips.forEach(tip => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${tip.id}</td>
                <td>${tip.table_number}</td>
                <td>${tip.waiter_name}</td>
                <td>${tip.tip_percentage}%</td>
                <td>${new Date(tip.created_at).toLocaleString()}</td>
            `;
            tipsTbody.appendChild(row);
        });
    }

    function updateTotals(tips) {
        totalRecordsSpan.textContent = tips.length;
        if (tips.length > 0) {
            const totalTip = tips.reduce((sum, tip) => sum + tip.tip_percentage, 0);
            const average = (totalTip / tips.length).toFixed(2);
            averageTipSpan.textContent = `${average}%`;
        } else {
            averageTipSpan.textContent = '0%';
        }
    }

    // 5. Manejar filtros (sin cambios)
    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const waiterName = document.getElementById('waiter-filter').value;
        const startDate = document.getElementById('start-date-filter').value;
        const endDate = document.getElementById('end-date-filter').value;
        loadTips({ waiterName, startDate, endDate });
    });

    document.getElementById('reset-filters-btn').addEventListener('click', () => {
        filterForm.reset();
        loadTips();
    });
    
    // 6. Manejar la exportación a CSV (sin cabecera Auth)
    exportCsvBtn.addEventListener('click', async () => {
        loader.classList.remove('hidden');

        const waiterName = document.getElementById('waiter-filter').value;
        const startDate = document.getElementById('start-date-filter').value;
        const endDate = document.getElementById('end-date-filter').value;

        const params = new URLSearchParams();
        if (waiterName) params.append('waiterName', waiterName);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        
        const queryString = params.toString();
        let downloadUrl = '/api/tips/csv';
        if (queryString) downloadUrl += `?${queryString}`;
        
        try {
            const response = await fetch(downloadUrl); // Ya no se necesita cabecera de Auth

            if (!response.ok) {
                const errorData = await response.json();
                alert(`Error al exportar: ${errorData.error || response.statusText}`);
                return;
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
            alert('Ocurrió un error al intentar descargar el archivo.');
        } finally {
            loader.classList.add('hidden');
        }
    });
});