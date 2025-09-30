/**
 * Kiosco Público de Propinas (Con mejoras de UX)
 */
document.addEventListener('DOMContentLoaded', () => {
    // Estado de la aplicación para guardar datos temporalmente
    const appState = {
        waiter_name: '',
        table_number: '',
        tip_percentage: 0,
        device_id: `kiosk-${Date.now()}` // Un ID simple para el dispositivo
    };

    // Seleccionar elementos del DOM
    const waiterScreen = document.getElementById('waiter-screen');
    const customerScreen = document.getElementById('customer-screen');
    const thanksScreen = document.getElementById('thanks-screen');

    const waiterForm = document.getElementById('waiter-form');
    const waiterNamePlaceholder = document.getElementById('waiter-name-placeholder');
    const tipOptionsContainer = document.querySelector('.tip-options');
    const waiterNameError = document.getElementById('waiter-name-error'); // Selector para el mensaje de error

    // Función para cambiar entre pantallas
    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    // --- LÓGICA DE LA PANTALLA DEL MESERO (ACTUALIZADA) ---
    waiterForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const waiterName = document.getElementById('waiter_name').value;
        waiterNameError.textContent = ''; // Limpiar cualquier error anterior

        // **Validación mejorada para el selector de usuario**
        if (waiterName === '0') {
            waiterNameError.textContent = 'Por favor, selecciona un nombre.'; // Muestra el error en el span
            return; // Detiene la ejecución
        }

        appState.waiter_name = waiterName;
        appState.table_number = document.getElementById('table_number').value;

        // Personalizar y mostrar la pantalla del cliente
        waiterNamePlaceholder.textContent = appState.waiter_name;
        showScreen('customer-screen');
    });
    
    // Ocultar mensaje de error al cambiar la selección
    document.getElementById('waiter_name').addEventListener('change', () => {
        waiterNameError.textContent = '';
    });


    // --- LÓGICA DE LA PANTALLA DEL CLIENTE ---
    tipOptionsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('btn-tip')) {
            const percentage = parseInt(event.target.dataset.percentage, 10);
            appState.tip_percentage = percentage;
            sendTipData();
        }
    });

    // --- FUNCIÓN PARA COMUNICARSE CON LA API ---
    async function sendTipData() {
        console.log('Enviando propina:', appState);
        try {
            const result = await apiClient.sendTip({
                table_number: appState.table_number,
                waiter_name: appState.waiter_name,
                tip_percentage: appState.tip_percentage,
                device_id: appState.device_id
            });
            
            console.log('Respuesta del servidor:', result);

            showScreen('thanks-screen');

            setTimeout(() => {
                showScreen('waiter-screen');
                waiterForm.reset();
            }, 4000);

        } catch (error) {
            console.error('Error al enviar la propina:', error.message);
            alert('Hubo un problema de conexión. Por favor, intente de nuevo.');
        }
    }

    // Iniciar en la pantalla del mesero
    showScreen('waiter-screen');
});