(function () {
    const STORE_NAME = 'despesas';

    function parseDateString(dateString) {
        const [year, month, day] = String(dateString).split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    function sortByMostRecent(records) {
        return [...records].sort((first, second) => {
            const dateDifference = parseDateString(second.data) - parseDateString(first.data);
            if (dateDifference !== 0) {
                return dateDifference;
            }

            return Number(second.id) - Number(first.id);
        });
    }

    function buildRecord(input, existingId) {
        const valor = Number(input.valor);

        if (!input.data || !input.categoria || !Number.isFinite(valor) || valor <= 0) {
            throw new Error('Preencha todos os campos da despesa com valores validos.');
        }

        return {
            id: existingId || Date.now(),
            data: input.data,
            categoria: input.categoria,
            valor,
            descricao: (input.descricao || '').trim()
        };
    }

    async function list() {
        const records = await window.storageService.getAll(STORE_NAME);
        return sortByMostRecent(records);
    }

    async function getById(id) {
        return window.storageService.getOne(STORE_NAME, id);
    }

    async function create(input) {
        const record = buildRecord(input);
        await window.storageService.put(STORE_NAME, record);
        return record;
    }

    async function update(id, input) {
        const existingRecord = await getById(id);
        if (!existingRecord) {
            throw new Error('Despesa nao encontrada.');
        }

        const record = buildRecord(input, id);
        await window.storageService.put(STORE_NAME, record);
        return record;
    }

    async function remove(id) {
        await window.storageService.remove(STORE_NAME, id);
    }

    window.expenseService = {
        list,
        getById,
        create,
        update,
        remove,
        sortByMostRecent
    };
})();
