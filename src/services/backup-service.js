(function () {
    const BACKUP_VERSION = 1;

    function createFileName() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        return `motorista-gestor-backup-${year}-${month}-${day}-${hours}${minutes}.json`;
    }

    async function collectCurrentData() {
        const [sessoes, despesas, manutencoes, settings] = await Promise.all([
            window.sessionService.list(),
            window.expenseService.list(),
            window.maintenanceService.list(),
            window.settingsService.load()
        ]);

        return { sessoes, despesas, manutencoes, settings };
    }

    function buildBackupPayload(data) {
        return {
            app: 'Motorista Gestor',
            version: BACKUP_VERSION,
            createdAt: new Date().toISOString(),
            storageMode: window.storageService.getMode(),
            data: {
                sessoes: data.sessoes || [],
                despesas: data.despesas || [],
                manutencoes: data.manutencoes || [],
                settings: window.settingsService.sanitize(data.settings || {})
            }
        };
    }

    async function exportToJson() {
        const payload = buildBackupPayload(await collectCurrentData());
        return {
            fileName: createFileName(),
            payload,
            json: JSON.stringify(payload, null, 2)
        };
    }

    function normalizePayload(parsedValue) {
        const sourceData = parsedValue && typeof parsedValue === 'object' && parsedValue.data
            ? parsedValue.data
            : parsedValue;

        if (!sourceData || typeof sourceData !== 'object') {
            throw new Error('O arquivo nao contem um backup valido.');
        }

        if (!Array.isArray(sourceData.sessoes) || !Array.isArray(sourceData.despesas) || !Array.isArray(sourceData.manutencoes)) {
            throw new Error('O backup precisa conter sessoes, despesas e manutencoes em formato de lista.');
        }

        const normalizedSettings = window.settingsService.sanitize(
            sourceData.settings || sourceData.appSettings || window.settingsService.DEFAULT_SETTINGS
        );

        return {
            sessoes: sourceData.sessoes,
            despesas: sourceData.despesas,
            manutencoes: sourceData.manutencoes,
            settings: normalizedSettings
        };
    }

    async function importFromJson(jsonText) {
        let parsedValue = null;

        try {
            parsedValue = JSON.parse(jsonText);
        } catch (error) {
            throw new Error('O arquivo selecionado nao e um JSON valido.');
        }

        const normalizedData = normalizePayload(parsedValue);

        await window.storageService.replaceAll('sessoes', normalizedData.sessoes);
        await window.storageService.replaceAll('despesas', normalizedData.despesas);
        await window.storageService.replaceAll('manutencoes', normalizedData.manutencoes);
        await window.storageService.replaceAll('settings', [
            Object.assign({ id: 'appSettings' }, normalizedData.settings)
        ]);

        return {
            sessoes: normalizedData.sessoes.length,
            despesas: normalizedData.despesas.length,
            manutencoes: normalizedData.manutencoes.length
        };
    }

    window.backupService = {
        exportToJson,
        importFromJson
    };
})();
