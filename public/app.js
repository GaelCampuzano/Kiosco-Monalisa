/**
 * Kiosco Público de Propinas v3.3 (Mejoras Offline y UX de Notificaciones)
 */

const app = {
    DOMElements: {},
    appState: {
        waiter_name: '',
        table_number: '',
        tip_percentage: 0,
        device_id: `kiosk-${Date.now()}`,
        transaction_id: null
    },

    init() {
        this.cacheDOMElements();
        this.addEventListeners();
        this.handleOfflineStatus();
        this.listenForSWMessages();
        this.loadWaiters();
        this.showScreen('waiter-screen');
    },

    cacheDOMElements() {
        this.DOMElements = {
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
            offlineIndicator: document.getElementById('offline-indicator'),
            customerInstruction: document.getElementById('customer-instruction'),
        };
    },

    showScreen(screenId) {
        this.DOMElements.screens.forEach(screen => screen.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    },

    addEventListeners() {
        this.DOMElements.waiterForm.addEventListener('submit', this.handleFormSubmit.bind(this));
        this.DOMElements.tipOptionsContainer.addEventListener('click', this.handleTipSelection.bind(this));
        this.DOMElements.waiterNameSelect.addEventListener('change', () => this.validateField(this.DOMElements.waiterNameSelect.value !== '', this.DOMElements.waiterNameError, i18n.t('error_select_name')));
        this.DOMElements.tableNumberInput.addEventListener('input', () => this.validateField(this.DOMElements.tableNumberInput.value.trim() !== '', this.DOMElements.tableNumberError, i18n.t('error_enter_table')));
        
        document.querySelectorAll('.language-selector button').forEach(button => {
            button.addEventListener('click', (e) => {
                const lang = e.target.dataset.lang;
                i18n.changeLanguage(lang);
            });
        });
    },

    handleOfflineStatus() {
        window.addEventListener('online', () => this.verifyOnlineStatus());
        window.addEventListener('offline', () => this.DOMElements.offlineIndicator.classList.remove('hidden'));
        this.verifyOnlineStatus();
    },

    verifyOnlineStatus() {
        // Usamos una petición HEAD a un recurso no cacheado para una verificación real
        fetch('/api/session', { method: 'HEAD', cache: 'no-store' })
            .then(response => {
                if (response.ok) {
                    this.DOMElements.offlineIndicator.classList.add('hidden');
                } else {
                    throw new Error('Offline status confirmed');
                }
            })
            .catch(() => {
                this.DOMElements.offlineIndicator.classList.remove('hidden');
            });
    },

    listenForSWMessages() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.onmessage = (event) => {
                if (event.data && event.data.type === 'SYNC_COMPLETE') {
                    this.showToast(`${event.data.count} propina(s) guardada(s) en el servidor.`, 'success');
                }
            };
        }
    },

    showToast(message, type = 'info', duration = 5000) {
        // Elimina cualquier toast existente para evitar duplicados
        document.querySelector('.dynamic-toast')?.remove();
    
        const toast = document.createElement('div');
        toast.className = `notification-toast dynamic-toast ${type} hidden`;
        
        const icon = document.createElement('i');
        const iconClass = {
            success: 'fa-solid fa-circle-check',
            danger: 'fa-solid fa-circle-xmark',
            info: 'fa-solid fa-circle-info'
        }[type];
        icon.className = iconClass;
        
        const text = document.createElement('span');
        text.textContent = message;
        
        toast.appendChild(icon);
        toast.appendChild(text);
        document.body.appendChild(toast);
    
        // Animar la entrada
        setTimeout(() => toast.classList.remove('hidden'), 50);
    
        // Ocultar y eliminar después de la duración especificada
        setTimeout(() => {
            toast.classList.add('hidden');
            toast.addEventListener('transitionend', () => toast.remove());
        }, duration);
    },

    async loadWaiters() {
        try {
            const waiters = await apiClient.getWaiters();
            this.DOMElements.waiterNameSelect.innerHTML = ''; // Limpiar opciones
            const defaultOption = document.createElement('option');
            defaultOption.value = "";
            defaultOption.disabled = true;
            defaultOption.selected = true;
            defaultOption.textContent = i18n.t('select_waiter'); 
            this.DOMElements.waiterNameSelect.appendChild(defaultOption);
            
            waiters.forEach(waiter => {
                const option = document.createElement('option');
                option.value = waiter.name;
                option.textContent = waiter.name.toUpperCase();
                this.DOMElements.waiterNameSelect.appendChild(option);
            });
        } catch (error) {
            console.error("No se pudo cargar la lista de meseros. Usando lista de respaldo.", error);
            this.showToast('Modo sin conexión: lista de meseros podría no estar actualizada.', 'info');
            const offlineWaiters = [
                { name: 'David' }, { name: 'Gael' }, { name: 'Ivan' }, { name: 'Luis' }, { name: 'Emmanuel' },
            ];
            this.DOMElements.waiterNameSelect.innerHTML = `<option value="" disabled selected>${i18n.t('select_waiter')}</option>`;
            offlineWaiters.forEach(waiter => {
                const option = document.createElement('option');
                option.value = waiter.name;
                option.textContent = waiter.name.toUpperCase();
                this.DOMElements.waiterNameSelect.appendChild(option);
            });
        }
    },

    handleFormSubmit(event) {
        event.preventDefault();
        const waiterName = this.DOMElements.waiterNameSelect.value;
        const tableNumber = this.DOMElements.tableNumberInput.value.trim();
        const isWaiterValid = this.validateField(waiterName, this.DOMElements.waiterNameError, i18n.t('error_select_name'));
        const isTableValid = this.validateField(tableNumber, this.DOMElements.tableNumberError, i18n.t('error_enter_table'));
        if (!isWaiterValid || !isTableValid) return;

        this.appState.waiter_name = waiterName;
        this.appState.table_number = tableNumber;
        this.DOMElements.customerInstruction.innerHTML = i18n.t('customer_instruction', { waiterName: this.appState.waiter_name });
        this.showScreen('customer-screen');
    },
        
    validateField(condition, errorElement, message) {
        errorElement.textContent = condition ? '' : message;
        errorElement.style.display = condition ? 'none' : 'block';
        return !!condition;
    },

    disableTipButtons(disabled) {
        this.DOMElements.tipOptionsContainer.querySelectorAll('.btn-tip').forEach(btn => {
            btn.disabled = disabled;
            btn.style.cursor = disabled ? 'not-allowed' : 'pointer';
            btn.style.opacity = disabled ? '0.6' : '1';
        });
    },
    
    handleTipSelection(event) {
        if (event.target.classList.contains('btn-tip') && !event.target.disabled) {
            this.disableTipButtons(true);
            this.appState.transaction_id = `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.appState.tip_percentage = parseInt(event.target.dataset.percentage, 10);
            this.sendTipData();
        }
    },

    async sendTipData() {
        const isOnline = !this.DOMElements.offlineIndicator.classList.contains('hidden');
        try {
            if (isOnline) {
                await apiClient.sendTip(this.appState);
            } else {
                throw new Error("Offline, saving to local database.");
            }
        } catch (error) {
            console.warn('No se pudo enviar la propina, guardando localmente:', error.message);
            try {
                await saveTipOffline(this.appState);
                if ('serviceWorker' in navigator && 'SyncManager' in window) {
                    const registration = await navigator.serviceWorker.ready;
                    await registration.sync.register('sync-new-tips');
                }
            } catch (saveError) {
                console.error('Error crítico al guardar en IndexedDB:', saveError);
                this.showToast('No se pudo guardar la propina localmente.', 'danger');
                this.disableTipButtons(false);
                return;
            }
        }
        
        this.showScreen('thanks-screen');
        setTimeout(() => {
            this.showScreen('waiter-screen');
            this.DOMElements.waiterForm.reset();
            this.disableTipButtons(false);
            i18n.applyTranslations();
        }, 4000);
    }
};

function manageServiceWorker() {
    let newWorker;
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            registration.addEventListener('updatefound', () => {
                newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateBar();
                    }
                });
            });
        }).catch(error => console.error('Error en Service Worker:', error));

        let refreshing;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            window.location.reload();
            refreshing = true;
        });
    }

    function showUpdateBar() {
        const notification = document.getElementById('update-notification');
        const updateButton = document.getElementById('update-btn');
        notification.classList.remove('hidden');
        updateButton.addEventListener('click', () => {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await i18n.init('es');
        app.init();
        manageServiceWorker();
    } catch (error) {
        console.error("ERROR FATAL DURANTE LA INICIALIZACIÓN:", error);
        document.body.innerHTML = '<h1>Error al cargar la aplicación. Verifique la consola.</h1>';
    }
});