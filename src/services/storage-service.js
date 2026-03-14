(function () {
    const DB_NAME = 'motorista-gestor';
    const DB_VERSION = 1;
    const STORES = ['sessoes', 'despesas', 'manutencoes', 'settings'];
    const LEGACY_KEYS = {
        sessoes: 'sessoes',
        despesas: 'despesas',
        manutencoes: 'manutencoes',
        settings: 'appSettings'
    };

    let db = null;
    let storageMode = 'indexeddb';
    const memoryCache = {
        sessoes: [],
        despesas: [],
        manutencoes: [],
        settings: []
    };

    function cloneValue(value) {
        if (typeof structuredClone === 'function') {
            return structuredClone(value);
        }

        return JSON.parse(JSON.stringify(value));
    }

    function getLegacyValue(storeName) {
        const rawValue = localStorage.getItem(LEGACY_KEYS[storeName]);
        if (!rawValue) {
            return storeName === 'settings' ? [] : [];
        }

        try {
            const parsedValue = JSON.parse(rawValue);
            if (storeName === 'settings') {
                if (!parsedValue || typeof parsedValue !== 'object') {
                    return [];
                }

                return [Object.assign({ id: 'appSettings' }, parsedValue)];
            }

            return Array.isArray(parsedValue) ? parsedValue : [];
        } catch (error) {
            console.warn(`Nao foi possivel ler ${storeName} do localStorage.`, error);
            return [];
        }
    }

    function writeFallbackStore(storeName, records) {
        if (storeName === 'settings') {
            const settingsRecord = records[0];

            if (!settingsRecord) {
                localStorage.removeItem(LEGACY_KEYS.settings);
                return;
            }

            const payload = Object.assign({}, settingsRecord);
            delete payload.id;
            localStorage.setItem(LEGACY_KEYS.settings, JSON.stringify(payload));
            return;
        }

        localStorage.setItem(LEGACY_KEYS[storeName], JSON.stringify(records));
    }

    function openDatabase() {
        return new Promise((resolve, reject) => {
            if (!('indexedDB' in window)) {
                reject(new Error('IndexedDB indisponivel neste navegador.'));
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const database = event.target.result;

                STORES.forEach((storeName) => {
                    if (!database.objectStoreNames.contains(storeName)) {
                        database.createObjectStore(storeName, { keyPath: 'id' });
                    }
                });
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error('Falha ao abrir o IndexedDB.'));
        });
    }

    function readAllFromStore(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error || new Error(`Falha ao ler ${storeName}.`));
        });
    }

    function putInStore(storeName, record) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.put(record);

            request.onsuccess = () => resolve(cloneValue(record));
            request.onerror = () => reject(request.error || new Error(`Falha ao salvar em ${storeName}.`));
        });
    }

    function deleteFromStore(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error || new Error(`Falha ao remover de ${storeName}.`));
        });
    }

    function clearStoreInDb(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error || new Error(`Falha ao limpar ${storeName}.`));
        });
    }

    async function hydrateCacheFromIndexedDb() {
        for (const storeName of STORES) {
            memoryCache[storeName] = await readAllFromStore(storeName);
        }
    }

    async function migrateLegacyLocalStorage() {
        let migratedAnyStore = false;

        for (const storeName of STORES) {
            if (memoryCache[storeName].length > 0) {
                continue;
            }

            const legacyRecords = getLegacyValue(storeName);
            if (legacyRecords.length === 0) {
                continue;
            }

            for (const record of legacyRecords) {
                await putInStore(storeName, record);
            }

            migratedAnyStore = true;
        }

        if (migratedAnyStore) {
            await hydrateCacheFromIndexedDb();
        }
    }

    function updateMemoryCache(storeName, record) {
        const currentRecords = memoryCache[storeName] || [];
        const recordIndex = currentRecords.findIndex((item) => item.id === record.id);

        if (recordIndex === -1) {
            memoryCache[storeName] = currentRecords.concat(record);
            return;
        }

        memoryCache[storeName] = currentRecords.map((item) => {
            if (item.id !== record.id) {
                return item;
            }

            return record;
        });
    }

    async function init() {
        try {
            db = await openDatabase();
            storageMode = 'indexeddb';
            await hydrateCacheFromIndexedDb();
            await migrateLegacyLocalStorage();
        } catch (error) {
            storageMode = 'localstorage';
            db = null;
            console.warn('Usando localStorage como fallback de persistencia.', error);

            STORES.forEach((storeName) => {
                memoryCache[storeName] = getLegacyValue(storeName);
            });
        }

        return storageMode;
    }

    async function getAll(storeName) {
        return cloneValue(memoryCache[storeName] || []);
    }

    async function getOne(storeName, id) {
        const records = memoryCache[storeName] || [];
        const record = records.find((item) => item.id === id) || null;
        return cloneValue(record);
    }

    async function put(storeName, record) {
        const clonedRecord = cloneValue(record);
        updateMemoryCache(storeName, clonedRecord);

        if (storageMode === 'localstorage') {
            writeFallbackStore(storeName, memoryCache[storeName]);
            return cloneValue(clonedRecord);
        }

        await putInStore(storeName, clonedRecord);
        return cloneValue(clonedRecord);
    }

    async function remove(storeName, id) {
        memoryCache[storeName] = (memoryCache[storeName] || []).filter((item) => item.id !== id);

        if (storageMode === 'localstorage') {
            writeFallbackStore(storeName, memoryCache[storeName]);
            return;
        }

        await deleteFromStore(storeName, id);
    }

    async function replaceAll(storeName, records) {
        const clonedRecords = cloneValue(records || []);
        memoryCache[storeName] = clonedRecords;

        if (storageMode === 'localstorage') {
            writeFallbackStore(storeName, clonedRecords);
            return cloneValue(clonedRecords);
        }

        await clearStoreInDb(storeName);
        for (const record of clonedRecords) {
            await putInStore(storeName, record);
        }

        return cloneValue(clonedRecords);
    }

    function getMode() {
        return storageMode;
    }

    window.storageService = {
        init,
        getAll,
        getOne,
        put,
        remove,
        replaceAll,
        getMode
    };
})();
