(function () {
    function parseDateString(dateString) {
        const [year, month, day] = String(dateString).split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    function toDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function startOfDay(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    function startOfWeek(date) {
        const normalizedDate = startOfDay(date);
        const dayIndex = (normalizedDate.getDay() + 6) % 7;
        normalizedDate.setDate(normalizedDate.getDate() - dayIndex);
        return normalizedDate;
    }

    function startOfMonth(date) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    function formatTime(totalMinutes) {
        const safeMinutes = Math.max(0, Number(totalMinutes) || 0);
        const hours = Math.floor(safeMinutes / 60);
        const minutes = safeMinutes % 60;
        return `${hours}h ${minutes}m`;
    }

    function minutesToParts(totalMinutes) {
        const safeMinutes = Math.max(0, Number(totalMinutes) || 0);
        return {
            horas: Math.floor(safeMinutes / 60),
            minutos: safeMinutes % 60
        };
    }

    function sumField(records, fieldName) {
        return records.reduce((total, record) => total + (Number(record[fieldName]) || 0), 0);
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

    function filterByStartDate(records, startDate) {
        return records.filter((record) => parseDateString(record.data) >= startDate);
    }

    function filterByYearMonth(records, yearValue, monthValue) {
        return records.filter((record) => {
            const recordDate = parseDateString(record.data);

            if (yearValue && recordDate.getFullYear() !== Number(yearValue)) {
                return false;
            }

            if (monthValue && (recordDate.getMonth() + 1) !== Number(monthValue)) {
                return false;
            }

            return true;
        });
    }

    function buildDashboardData(sessoes, despesas, manutencoes, settings, now) {
        const currentDate = now || new Date();
        const todayKey = toDateKey(currentDate);
        const weekStart = startOfWeek(currentDate);
        const monthStart = startOfMonth(currentDate);

        const sessoesHoje = sessoes.filter((sessao) => sessao.data === todayKey);
        const sessoesSemana = filterByStartDate(sessoes, weekStart);
        const sessoesMes = filterByStartDate(sessoes, monthStart);
        const despesasSemana = filterByStartDate(despesas, weekStart);
        const despesasMes = filterByStartDate(despesas, monthStart);
        const manutencoesSemana = filterByStartDate(manutencoes, weekStart);
        const manutencoesMes = filterByStartDate(manutencoes, monthStart);

        const saldoHoje = sumField(sessoesHoje, 'valorTotal');
        const horasHoje = sumField(sessoesHoje, 'tempoTotalMinutos');
        const totalCorridasHoje = sumField(sessoesHoje, 'quantidadeCorreidas');
        const ganhoHoraHoje = horasHoje > 0 ? saldoHoje / (horasHoje / 60) : 0;

        const ganhoSemana = sumField(sessoesSemana, 'valorTotal');
        const ganhoMes = sumField(sessoesMes, 'valorTotal');
        const totalDespesasSemana = sumField(despesasSemana, 'valor') + sumField(manutencoesSemana, 'valor');
        const totalDespesasMes = sumField(despesasMes, 'valor') + sumField(manutencoesMes, 'valor');
        const lucroLiquidoMes = ganhoMes - totalDespesasMes;
        const lucroLiquidoSemana = ganhoSemana - totalDespesasSemana;

        return {
            saldoHoje,
            horasHoje,
            totalCorridasHoje,
            ganhoHoraHoje,
            ganhoSemana,
            ganhoMes,
            totalDespesasMes,
            lucroLiquidoMes,
            lucroLiquidoSemana,
            latestSessions: sortByMostRecent(sessoes).slice(0, 5),
            monthlyGoals: {
                gross: {
                    current: ganhoMes,
                    target: Number(settings.monthly_goal_gross) || 0
                },
                net: {
                    current: lucroLiquidoMes,
                    target: Number(settings.monthly_goal_net) || 0
                }
            },
            weeklyGoals: {
                gross: {
                    current: ganhoSemana,
                    target: Number(settings.weekly_goal_gross) || 0
                },
                net: {
                    current: lucroLiquidoSemana,
                    target: Number(settings.weekly_goal_net) || 0
                }
            }
        };
    }

    function getWeeklyEarningsData(sessoes) {
        const labels = ['Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado', 'Domingo'];
        const values = [0, 0, 0, 0, 0, 0, 0];

        sessoes.forEach((sessao) => {
            const sessionDate = parseDateString(sessao.data);
            const dayIndex = sessionDate.getDay() === 0 ? 6 : sessionDate.getDay() - 1;
            values[dayIndex] += Number(sessao.valorTotal) || 0;
        });

        return { labels, values };
    }

    function getAvailableYears(sessoes, despesas, manutencoes) {
        const years = new Set();

        [...sessoes, ...despesas, ...manutencoes].forEach((record) => {
            if (!record.data) {
                return;
            }

            years.add(parseDateString(record.data).getFullYear());
        });

        return [...years].sort((first, second) => second - first);
    }

    function buildReportData(sessoes, despesas, manutencoes, settings, yearValue, monthValue) {
        const sessoesFiltradas = filterByYearMonth(sessoes, yearValue, monthValue);
        const despesasFiltradas = filterByYearMonth(despesas, yearValue, monthValue);
        const manutencoesFiltradas = filterByYearMonth(manutencoes, yearValue, monthValue);

        const ganhoTotal = sumField(sessoesFiltradas, 'valorTotal');
        const tempoTotalMinutos = sumField(sessoesFiltradas, 'tempoTotalMinutos');
        const distanciaTotal = sumField(sessoesFiltradas, 'distanciaTotal');
        const corridasTotais = sumField(sessoesFiltradas, 'quantidadeCorreidas');
        const tempoTotalHoras = tempoTotalMinutos / 60;
        const ganhoMedioHora = tempoTotalHoras > 0 ? ganhoTotal / tempoTotalHoras : 0;

        const despesasTotal = sumField(despesasFiltradas, 'valor');
        const manutencaoTotal = sumField(manutencoesFiltradas, 'valor');
        const despesasComManutencao = despesasTotal + manutencaoTotal;
        const lucroLiquido = ganhoTotal - despesasComManutencao;

        const ganhoKm = distanciaTotal > 0 ? ganhoTotal / distanciaTotal : 0;
        const custoCombustivelKm = window.settingsService.getFuelCostPerKm(settings);
        const lucroRealKm = ganhoKm - custoCombustivelKm;
        const eficiencia = ganhoKm > 0 ? (lucroRealKm / ganhoKm) * 100 : 0;

        const plataformas = {};
        sessoesFiltradas.forEach((sessao) => {
            if (!plataformas[sessao.plataforma]) {
                plataformas[sessao.plataforma] = {
                    ganho: 0,
                    sessoes: 0,
                    ganhoMedio: 0
                };
            }

            plataformas[sessao.plataforma].ganho += Number(sessao.valorTotal) || 0;
            plataformas[sessao.plataforma].sessoes += 1;
        });

        Object.keys(plataformas).forEach((platformName) => {
            const platformData = plataformas[platformName];
            platformData.ganhoMedio = platformData.sessoes > 0 ? platformData.ganho / platformData.sessoes : 0;
        });

        const categorias = {};
        despesasFiltradas.forEach((despesa) => {
            categorias[despesa.categoria] = (categorias[despesa.categoria] || 0) + (Number(despesa.valor) || 0);
        });
        manutencoesFiltradas.forEach((manutencao) => {
            categorias.Manutencao = (categorias.Manutencao || 0) + (Number(manutencao.valor) || 0);
        });

        return {
            ganhoTotal,
            tempoTotalMinutos,
            tempoTotalHoras,
            distanciaTotal,
            corridasTotais,
            ganhoMedioHora,
            despesasComManutencao,
            lucroLiquido,
            ganhoKm,
            custoCombustivelKm,
            lucroRealKm,
            eficiencia,
            plataformas,
            categorias,
            totalSessoes: sessoesFiltradas.length
        };
    }

    function getMaintenanceAlerts(manutencoes, now) {
        const currentDate = now || new Date();
        const nextThirtyDays = new Date(currentDate.getTime() + (30 * 24 * 60 * 60 * 1000));
        const expired = [];
        const upcoming = [];

        manutencoes.forEach((manutencao) => {
            const dueDate = parseDateString(manutencao.data);
            dueDate.setDate(dueDate.getDate() + 60);

            if (dueDate < currentDate) {
                expired.push(Object.assign({}, manutencao, { dueDate }));
                return;
            }

            if (dueDate >= currentDate && dueDate <= nextThirtyDays) {
                upcoming.push(Object.assign({}, manutencao, { dueDate }));
            }
        });

        return {
            expired: sortByMostRecent(expired),
            upcoming: sortByMostRecent(upcoming)
        };
    }

    window.reportService = {
        parseDateString,
        toDateKey,
        formatTime,
        minutesToParts,
        sortByMostRecent,
        buildDashboardData,
        getWeeklyEarningsData,
        getAvailableYears,
        buildReportData,
        getMaintenanceAlerts
    };
})();
