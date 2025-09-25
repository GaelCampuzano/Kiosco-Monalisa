/**
 * Dashboard de Administración
 * - Maneja autenticación via Basic Auth (modal)
 * - Carga y renderiza registros con filtros
 * - Calcula métricas básicas (conteo y promedio)
 * - Exporta datos filtrados a CSV
 */
document.addEventListener('DOMContentLoaded', () => {
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

    let currentAuthHeader = null;

    // 1. Mostrar modal de inicio de sesión al cargar
    loginModalOverlay.classList.remove('hidden');

    // 2. Manejar el envío del formulario de login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = usernameInput.value;
        const password = passwordInput.value;
        const credentials = btoa(`${username}:${password}`);
        const authHeader = `Basic ${credentials}`;
        
        loader.classList.remove('hidden'); // Mostrar spinner

        try {
            const response = await fetch('/api/tips', {
                headers: { 'Authorization': authHeader }
            });

            if (response.ok) {
                currentAuthHeader = authHeader;
                loginModalOverlay.classList.add('hidden');
                mainContent.style.visibility = 'visible';
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
            loader.classList.add('hidden'); // Ocultar spinner
        }
    });
    
    // Ocultar mensaje de error al escribir
    usernameInput.addEventListener('input', () => loginErrorMessage.classList.add('hidden'));
    passwordInput.addEventListener('input', () => loginErrorMessage.classList.add('hidden'));

    // 3. Función para cargar, renderizar y calcular datos de propinas
    /**
     * Carga registros desde la API, aplicando filtros opcionales.
     * También actualiza la tabla y los totales.
     * @param {{ waiterName?: string, startDate?: string, endDate?: string }} filters
     */
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
            const response = await fetch(url, {
                headers: { 'Authorization': currentAuthHeader }
            });
            if (!response.ok) {
                if(response.status === 401) { // Sesión expirada/inválida
                    loginModalOverlay.classList.remove('hidden');
                    mainContent.style.visibility = 'hidden';
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

    // Función para renderizar los datos en la tabla
    /**
     * Dibuja filas de la tabla con la lista de propinas.
     * @param {Array<{id:number, table_number:string, waiter_name:string, tip_percentage:number, created_at:string}>} tips
     */
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

    // Función para actualizar los totales
    /**
     * Calcula y muestra métricas básicas de la lista.
     * @param {Array<{tip_percentage:number}>} tips
     */
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

    // 4. Manejar filtros
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
    
    // 5. Manejar la exportación a CSV (VERSIÓN CORREGIDA)
    exportCsvBtn.addEventListener('click', async () => {
        loader.classList.remove('hidden'); // Muestra el spinner mientras se prepara el archivo

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
            // Usamos fetch para poder enviar la cabecera de autenticación
            const response = await fetch(downloadUrl, {
                headers: { 'Authorization': currentAuthHeader }
            });

            if (!response.ok) {
                // Si hay un error (ej. no hay datos), lo mostramos al usuario
                const errorData = await response.json();
                alert(`Error al exportar: ${errorData.error || response.statusText}`);
                return;
            }

            // Convertimos la respuesta en un objeto Blob (un tipo de archivo)
            const blob = await response.blob();
            // Creamos una URL temporal para este objeto
            const url = window.URL.createObjectURL(blob);
            
            // Creamos un enlace <a> invisible en la página
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'reporte_propinas.csv'; // Nombre del archivo a descargar
            document.body.appendChild(a);
            
            // Simulamos un clic en el enlace para iniciar la descarga
            a.click();
            
            // Limpiamos la URL y el enlace creados
            window.URL.revokeObjectURL(url);
            a.remove();

        } catch (error) {
            console.error('Error en la descarga del CSV:', error);
            alert('Ocurrió un error al intentar descargar el archivo.');
        } finally {
            loader.classList.add('hidden'); // Ocultamos el spinner
        }
    });
});
