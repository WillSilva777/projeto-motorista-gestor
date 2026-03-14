(function () {
    const STORE_NAME = 'sessoes';

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
        const horas = Math.max(0, parseInt(input.horas, 10) || 0);
        const minutos = Math.max(0, parseInt(input.minutos, 10) || 0);
        const tempoTotalMinutos = (horas * 60) + minutos;
        const quantidadeCorreidas = Math.max(0, parseInt(input.quantidadeCorreidas, 10) || 0);
        const valorTotal = Number(input.valorTotal);
        const distanciaTotal = Number(input.distanciaTotal);

        if (!input.data || !input.plataforma || tempoTotalMinutos <= 0 || quantidadeCorreidas <= 0 || !Number.isFinite(valorTotal) || valorTotal <= 0 || !Number.isFinite(distanciaTotal) || distanciaTotal <= 0) {
            throw new Error('Preencha todos os campos da sessao com valores validos.');
        }

        const tempoTotalHoras = tempoTotalMinutos / 60;

        return {
            id: existingId || Date.now(),
            data: input.data,
            plataforma: input.plataforma,
            tempoTotalMinutos,
            quantidadeCorreidas,
            valorTotal,
            distanciaTotal,
            ganhosPorHora: Number((valorTotal / tempoTotalHoras).toFixed(2)),
            ganhosPorKm: Number((valorTotal / distanciaTotal).toFixed(2))
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
            throw new Error('Sessao nao encontrada.');
        }

        const record = buildRecord(input, id);
        await window.storageService.put(STORE_NAME, record);
        return record;
    }

    async function remove(id) {
        await window.storageService.remove(STORE_NAME, id);
    }

    window.sessionService = {
        list,
        getById,
        create,
        update,
        remove,
        sortByMostRecent
    };
})();
