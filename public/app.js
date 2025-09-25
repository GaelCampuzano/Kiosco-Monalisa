/**
 * Kiosco Público de Propinas
 * - Paso 1: Mesero ingresa su nombre y mesa
 * - Paso 2: Cliente selecciona porcentaje de propina
 * - Paso 3: Se envía a la API y se muestra agradecimiento
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

    // Función para cambiar entre pantallas
    /**
     * Activa una pantalla por id y oculta el resto.
     * @param {"waiter-screen"|"customer-screen"|"thanks-screen"} screenId
     */
    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    // --- LÓGICA DE LA PANTALLA DEL MESERO ---
    waiterForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const waiterName = document.getElementById('waiter_name').value;

        // **Validación para el selector de usuario**
        if (waiterName === '0') {
            alert('Por favor, selecciona un usuario antes de continuar.');
            return; // detiene la ejecución si no se ha seleccionado un usuario
        }

        appState.waiter_name = waiterName;
        appState.table_number = document.getElementById('table_number').value;

        // Personalizar y mostrar la pantalla del cliente
        waiterNamePlaceholder.textContent = appState.waiter_name;
        showScreen('customer-screen');
    });

    // --- LÓGICA DE LA PANTALLA DEL CLIENTE ---
    tipOptionsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('btn-tip')) {
            const percentage = parseInt(event.target.dataset.percentage, 10);
            appState.tip_percentage = percentage;

            // Enviar los datos al servidor
            sendTipData();
        }
    });

    // --- FUNCIÓN PARA COMUNICARSE CON LA API ---
    /**
     * Envía datos del kiosco a POST /api/tips y gestiona transiciones.
     */
    async function sendTipData() {
        console.log('Enviando propina:', appState);
        try {
            const response = await fetch('/api/tips', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    table_number: appState.table_number,
                    waiter_name: appState.waiter_name,
                    tip_percentage: appState.tip_percentage,
                    device_id: appState.device_id
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error en la respuesta del servidor');
            }

            const result = await response.json();
            console.log('Respuesta del servidor:', result);

            // Transición a la pantalla de agradecimiento
            showScreen('thanks-screen');

            // --- NUEVO: Resetear la aplicación después de un tiempo ---
            setTimeout(() => {
                showScreen('waiter-screen');
                waiterForm.reset(); // Limpiar el formulario para el siguiente uso
            }, 4000); // 4000 milisegundos = 4 segundos

        } catch (error) {
            console.error('Error al enviar la propina:', error.message);
            alert('Hubo un problema de conexión. Por favor, intente de nuevo.');
        }
    }

    // Iniciar en la pantalla del mesero
    showScreen('waiter-screen');
});
