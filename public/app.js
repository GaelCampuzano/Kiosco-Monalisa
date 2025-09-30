/**
 * Kiosco Público de Propinas
 */
document.addEventListener('DOMContentLoaded', () => {
    // Función de ayuda para cambiar de pantalla
    const showScreen = (screenId) => {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    };

    // Referencias a elementos del DOM para fácil acceso
    const DOMElements = {
        waiterForm: document.getElementById('waiter-form'),
        waiterNameSelect: document.getElementById('waiter_name'),
        tableNumberInput: document.getElementById('table_number'),
        waiterNamePlaceholder: document.getElementById('waiter-name-placeholder'),
        tipOptionsContainer: document.querySelector('.tip-options'),
        waiterNameError: document.getElementById('waiter-name-error'),
        tableNumberError: document.getElementById('table-number-error'),
    };

    // Estado centralizado de la aplicación
    const appState = {
        waiter_name: '',
        table_number: '',
        tip_percentage: 0,
        device_id: `kiosk-${Date.now()}`
    };

    // Objeto principal de la aplicación
    const app = {
        init: () => {
            app.addEventListeners();
            showScreen('waiter-screen');
        },

        addEventListeners: () => {
            DOMElements.waiterForm.addEventListener('submit', app.handleFormSubmit);
            DOMElements.tipOptionsContainer.addEventListener('click', app.handleTipSelection);
            DOMElements.waiterNameSelect.addEventListener('change', () => DOMElements.waiterNameError.textContent = '');
            DOMElements.tableNumberInput.addEventListener('input', () => DOMElements.tableNumberError.textContent = '');
        },

        handleFormSubmit: (event) => {
            event.preventDefault();
            const waiterName = DOMElements.waiterNameSelect.value;
            const tableNumber = DOMElements.tableNumberInput.value;
            
            // Validar ambos campos antes de continuar
            const isWaiterValid = app.validateField(waiterName !== '0', DOMElements.waiterNameError, 'Por favor, selecciona tu nombre.');
            const isTableValid = app.validateField(tableNumber, DOMElements.tableNumberError, 'Por favor, ingresa el número de mesa.') &&
                                 app.validateField(/^\d+$/.test(tableNumber), DOMElements.tableNumberError, 'La mesa solo debe contener números.');

            if (!isWaiterValid || !isTableValid) return;

            appState.waiter_name = waiterName;
            appState.table_number = tableNumber;

            DOMElements.waiterNamePlaceholder.textContent = appState.waiter_name;
            showScreen('customer-screen');
        },
        
        validateField: (condition, errorElement, message) => {
            errorElement.textContent = condition ? '' : message;
            return condition;
        },

        handleTipSelection: (event) => {
            if (event.target.classList.contains('btn-tip')) {
                appState.tip_percentage = parseInt(event.target.dataset.percentage, 10);
                app.sendTipData();
            }
        },

        sendTipData: async () => {
            try {
                // apiClient está disponible globalmente desde apiClient.js
                await apiClient.sendTip(appState);
                showScreen('thanks-screen');
                setTimeout(() => {
                    showScreen('waiter-screen');
                    DOMElements.waiterForm.reset();
                }, 4000);
            } catch (error) {
                console.error('Error al enviar la propina:', error.message);
                alert('Hubo un problema de conexión. Por favor, intente de nuevo.');
            }
        }
    };

    app.init();
});