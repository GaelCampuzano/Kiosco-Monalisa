/**
 * Kiosco Público de Propinas v2.2 (Final)
 */
document.addEventListener('DOMContentLoaded', () => {
    const DOMElements = {
        screens: document.querySelectorAll('.screen'),
        waiterScreen: document.getElementById('waiter-screen'),
        customerScreen: document.getElementById('customer-screen'),
        thanksScreen: document.getElementById('thanks-screen'),
        waiterForm: document.getElementById('waiter-form'),
        waiterNameSelect: document.getElementById('waiter_name'),
        tableNumberInput: document.getElementById('table_number'),
        waiterNameError: document.getElementById('waiter-name-error'),
        tableNumberError: document.getElementById('table-number-error'),
        submitButton: document.querySelector('#waiter-form button'),
        waiterNamePlaceholder: document.getElementById('waiter-name-placeholder'),
        tipOptionsContainer: document.querySelector('.tip-options'),
    };

    const appState = {
        waiter_name: '',
        table_number: '',
        tip_percentage: 0,
        device_id: `kiosk-${Date.now()}`
    };

    const app = {
        init() {
            this.addEventListeners();
            this.loadWaiters();
            this.showScreen('waiter-screen');
        },

        showScreen(screenId) {
            DOMElements.screens.forEach(screen => {
                screen.classList.remove('active');
            });
            document.getElementById(screenId).classList.add('active');
        },

        addEventListeners() {
            DOMElements.waiterForm.addEventListener('submit', this.handleFormSubmit.bind(this));
            DOMElements.tipOptionsContainer.addEventListener('click', this.handleTipSelection.bind(this));
            DOMElements.waiterNameSelect.addEventListener('change', () => this.validateField(DOMElements.waiterNameSelect.value !== '', DOMElements.waiterNameError, 'Por favor, selecciona tu nombre.'));
            DOMElements.tableNumberInput.addEventListener('input', () => this.validateField(DOMElements.tableNumberInput.value.trim() !== '', DOMElements.tableNumberError, 'Por favor, ingresa el número de mesa.'));
        },

        async loadWaiters() {
            try {
                const waiters = await apiClient.getWaiters();
                DOMElements.waiterNameSelect.innerHTML = '<option value="" disabled selected>-- Selecciona tu usuario --</option>';
                waiters.forEach(waiter => {
                    const option = document.createElement('option');
                    option.value = waiter.name;
                    option.textContent = waiter.name.toUpperCase();
                    DOMElements.waiterNameSelect.appendChild(option);
                });
            } catch (error) {
                console.error('Error al cargar la lista de meseros:', error);
                this.showError(DOMElements.waiterNameError, 'No se pudo cargar la lista de meseros.');
            }
        },

        handleFormSubmit(event) {
            event.preventDefault();
            const waiterName = DOMElements.waiterNameSelect.value;
            const tableNumber = DOMElements.tableNumberInput.value.trim();

            const isWaiterValid = this.validateField(waiterName, DOMElements.waiterNameError, 'Por favor, selecciona tu nombre.');
            const isTableValid = this.validateField(tableNumber, DOMElements.tableNumberError, 'Por favor, ingresa el número de mesa.');

            if (!isWaiterValid || !isTableValid) return;

            appState.waiter_name = waiterName;
            appState.table_number = tableNumber;

            DOMElements.waiterNamePlaceholder.textContent = appState.waiter_name;
            this.showScreen('customer-screen');
        },
        
        validateField(condition, errorElement, message) {
            errorElement.textContent = condition ? '' : message;
            errorElement.style.display = condition ? 'none' : 'block';
            return !!condition;
        },
        
        showError(element, message) {
            element.textContent = message;
            element.style.display = 'block';
        },

        handleTipSelection(event) {
            if (event.target.classList.contains('btn-tip')) {
                appState.tip_percentage = parseInt(event.target.dataset.percentage, 10);
                this.sendTipData();
            }
        },

        async sendTipData() {
            try {
                // Comprobar si el navegador está online
                if (navigator.onLine) {
                    await apiClient.sendTip(appState);
                    console.log('Propina enviada directamente al servidor.');
                } else {
                    // Si está offline, guardar en IndexedDB
                    await saveTipOffline(appState);
                    
                    // Registrar un evento de sincronización
                    if ('serviceWorker' in navigator && 'SyncManager' in window) {
                        const registration = await navigator.serviceWorker.ready;
                        await registration.sync.register('sync-new-tips');
                    }
                }

                this.showScreen('thanks-screen');
                setTimeout(() => {
                    this.showScreen('waiter-screen');
                    DOMElements.waiterForm.reset();
                }, 4000);

            } catch (error) {
                console.error('Error al gestionar la propina:', error.message);
                const customerCard = DOMElements.customerScreen.querySelector('.card');
                const p = customerCard.querySelector('p');
                p.innerHTML = `<span style="color: var(--color-danger);">Hubo un problema. Se guardó para enviar más tarde.</span>`;
                setTimeout(() => {
                     // Restaurar el estado de la UI incluso si hubo un error de red
                    this.showScreen('thanks-screen');
                    setTimeout(() => {
                        this.showScreen('waiter-screen');
                        DOMElements.waiterForm.reset();
                    }, 4000);
                }, 3000);
            }
        }
    };

    app.init();
});