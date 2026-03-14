let sessoes = [];
let despesas = [];
let manutencoes = [];
let appSettings = window.settingsService.sanitize(window.settingsService.DEFAULT_SETTINGS);

let sessionIdEmEdicao = null;
let expenseIdEmEdicao = null;
let maintenanceIdEmEdicao = null;
let currentSectionId = 'dashboard';

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatCurrency(value) {
    const safeValue = Number(value) || 0;
    return `R$ ${safeValue.toFixed(2).replace('.', ',')}`;
}

function formatDate(dateString) {
    return window.reportService.parseDateString(dateString).toLocaleDateString('pt-BR');
}

function setElementText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
}

function setDateInputToToday(id) {
    const input = document.getElementById(id);
    if (input) {
        input.value = window.reportService.toDateKey(new Date());
    }
}

function ensureCancelButton(formId, buttonId, label, onClickHandler) {
    let cancelButton = document.getElementById(buttonId);
    if (cancelButton) {
        return cancelButton;
    }

    cancelButton = document.createElement('button');
    cancelButton.id = buttonId;
    cancelButton.type = 'button';
    cancelButton.className = 'btn';
    cancelButton.textContent = label;
    cancelButton.style.backgroundColor = '#6b7280';
    cancelButton.style.marginLeft = '10px';
    cancelButton.onclick = onClickHandler;

    const form = document.getElementById(formId);
    form.appendChild(cancelButton);

    return cancelButton;
}

function removeCancelButton(buttonId) {
    const cancelButton = document.getElementById(buttonId);
    if (cancelButton) {
        cancelButton.remove();
    }
}

function setPrimaryButtonState(formId, label, backgroundColor) {
    const form = document.getElementById(formId);
    const submitButton = form.querySelector('button[type="submit"]');

    submitButton.textContent = label;
    submitButton.style.backgroundColor = backgroundColor || '';
}

function resetSessionForm() {
    sessionIdEmEdicao = null;
    document.getElementById('formSessao').reset();
    setDateInputToToday('dataSessao');
    setPrimaryButtonState('formSessao', 'Registrar Sessao');
    removeCancelButton('cancelarEditSessaoBtn');
}

function resetExpenseForm() {
    expenseIdEmEdicao = null;
    document.getElementById('formDespesa').reset();
    setDateInputToToday('dataDespesa');
    setPrimaryButtonState('formDespesa', 'Registrar Despesa');
    removeCancelButton('cancelarEditDespesaBtn');
}

function resetMaintenanceForm() {
    maintenanceIdEmEdicao = null;
    document.getElementById('formManutencao').reset();
    setDateInputToToday('dataManutencao');
    setPrimaryButtonState('formManutencao', 'Registrar Manutencao');
    removeCancelButton('cancelarEditMaintenanceBtn');
}

async function reloadState() {
    const [loadedSessions, loadedExpenses, loadedMaintenance, loadedSettings] = await Promise.all([
        window.sessionService.list(),
        window.expenseService.list(),
        window.maintenanceService.list(),
        window.settingsService.load()
    ]);

    sessoes = loadedSessions;
    despesas = loadedExpenses;
    manutencoes = loadedMaintenance;
    appSettings = loadedSettings;
}

function loadSettings() {
    document.getElementById('monthlyGoalGross').value = appSettings.monthly_goal_gross.toFixed(2);
    document.getElementById('monthlyGoalNet').value = appSettings.monthly_goal_net.toFixed(2);
    document.getElementById('weeklyGoalGross').value = appSettings.weekly_goal_gross.toFixed(2);
    document.getElementById('weeklyGoalNet').value = appSettings.weekly_goal_net.toFixed(2);
    document.getElementById('fuelPrice').value = appSettings.fuel_price.toFixed(2);
    document.getElementById('carConsumption').value = appSettings.car_consumption.toFixed(1);

    updateSettingsSummary();
}

function updateSettingsSummary() {
    setElementText('summaryGoalGross', formatCurrency(appSettings.monthly_goal_gross));
    setElementText('summaryGoalNet', formatCurrency(appSettings.monthly_goal_net));
    setElementText('summaryGoalGrossWeekly', formatCurrency(appSettings.weekly_goal_gross));
    setElementText('summaryGoalNetWeekly', formatCurrency(appSettings.weekly_goal_net));
    setElementText('summaryFuelPrice', formatCurrency(appSettings.fuel_price));
    setElementText('summaryCarConsumption', `${appSettings.car_consumption.toFixed(1).replace('.', ',')} km/l`);
    setElementText('summaryCostPerKmFuel', formatCurrency(window.settingsService.getFuelCostPerKm(appSettings)));
}

function renderBackupSummary() {
    const storageModeLabel = window.storageService.getMode() === 'indexeddb' ? 'IndexedDB' : 'localStorage';
    setElementText('backupStorageMode', `Armazenamento atual: ${storageModeLabel}`);
    setElementText('backupSummaryCounts', `Sessoes: ${sessoes.length} | Despesas: ${despesas.length} | Manutencoes: ${manutencoes.length}`);
}

function setBackupStatus(message) {
    setElementText('backupStatus', message);
}

function updateProgress(fillId, textId, currentValue, targetValue) {
    const percentage = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;
    const fillElement = document.getElementById(fillId);
    const textElement = document.getElementById(textId);

    if (fillElement) {
        fillElement.style.width = `${Math.max(0, Math.min(percentage, 100))}%`;
    }

    if (textElement) {
        textElement.textContent = `${Math.round(percentage)}% - ${formatCurrency(currentValue)} / ${formatCurrency(targetValue)}`;
    }
}

function renderLatestSessions(latestSessions) {
    const tableBody = document.getElementById('ultimasSecoesBody');
    if (!tableBody) {
        return;
    }

    if (latestSessions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="empty">Nenhuma sessao registrada</td></tr>';
        return;
    }

    tableBody.innerHTML = latestSessions.map((sessao) => `
        <tr>
            <td>${formatDate(sessao.data)}</td>
            <td><strong>${escapeHtml(sessao.plataforma)}</strong></td>
            <td>${window.reportService.formatTime(sessao.tempoTotalMinutos)}</td>
            <td>${sessao.quantidadeCorreidas}</td>
            <td style="color: #22c55e; font-weight: bold;">${formatCurrency(sessao.valorTotal)}</td>
            <td>${formatCurrency(sessao.ganhosPorHora)}</td>
        </tr>
    `).join('');
}

function renderDashboard() {
    const dashboardData = window.reportService.buildDashboardData(sessoes, despesas, manutencoes, appSettings);

    setElementText('saldoHoje', formatCurrency(dashboardData.saldoHoje));
    setElementText('horasTrabalhadas', window.reportService.formatTime(dashboardData.horasHoje));
    setElementText('totalCorridas', String(dashboardData.totalCorridasHoje));
    setElementText('ganhoHora', formatCurrency(dashboardData.ganhoHoraHoje));
    setElementText('ganhoSemana', formatCurrency(dashboardData.ganhoSemana));
    setElementText('ganhoMes', formatCurrency(dashboardData.ganhoMes));
    setElementText('despesasTotal', formatCurrency(dashboardData.totalDespesasMes));
    setElementText('lucroLiquido', formatCurrency(dashboardData.lucroLiquidoMes));

    updateProgress(
        'progressFillGross',
        'progressTextGross',
        dashboardData.monthlyGoals.gross.current,
        dashboardData.monthlyGoals.gross.target
    );
    updateProgress(
        'progressFillNet',
        'progressTextNet',
        dashboardData.monthlyGoals.net.current,
        dashboardData.monthlyGoals.net.target
    );
    updateProgress(
        'progressFillGrossWeekly',
        'progressTextGrossWeekly',
        dashboardData.weeklyGoals.gross.current,
        dashboardData.weeklyGoals.gross.target
    );
    updateProgress(
        'progressFillNetWeekly',
        'progressTextNetWeekly',
        dashboardData.weeklyGoals.net.current,
        dashboardData.weeklyGoals.net.target
    );

    renderLatestSessions(dashboardData.latestSessions);
    renderMaintenanceAlerts();
}

function atualizarTabelaSessoes() {
    const tableBody = document.getElementById('todasSecoesBody');
    if (!tableBody) {
        return;
    }

    if (sessoes.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="empty">Nenhuma sessao registrada</td></tr>';
        return;
    }

    tableBody.innerHTML = sessoes.map((sessao) => `
        <tr>
            <td>${formatDate(sessao.data)}</td>
            <td><strong>${escapeHtml(sessao.plataforma)}</strong></td>
            <td>${window.reportService.formatTime(sessao.tempoTotalMinutos)}</td>
            <td>${sessao.quantidadeCorreidas}</td>
            <td style="color: #22c55e; font-weight: bold;">${formatCurrency(sessao.valorTotal)}</td>
            <td>${formatCurrency(sessao.ganhosPorHora)}</td>
            <td>${formatCurrency(sessao.ganhosPorKm)}</td>
            <td>
                <button class="btn btn-warning" onclick="editarSessao(${sessao.id})">Editar</button>
                <button class="btn btn-danger" onclick="deletarSessao(${sessao.id})">Deletar</button>
            </td>
        </tr>
    `).join('');
}

function atualizarTabelaDespesas() {
    const tableBody = document.getElementById('todasDespesasBody');
    if (!tableBody) {
        return;
    }

    if (despesas.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="empty">Nenhuma despesa registrada</td></tr>';
        return;
    }

    tableBody.innerHTML = despesas.map((despesa) => `
        <tr>
            <td>${formatDate(despesa.data)}</td>
            <td><strong>${escapeHtml(despesa.categoria)}</strong></td>
            <td>${escapeHtml(despesa.descricao || '-')}</td>
            <td style="color: #ef4444;">${formatCurrency(despesa.valor)}</td>
            <td>
                <button class="btn btn-warning" onclick="editarDespesa(${despesa.id})">Editar</button>
                <button class="btn btn-danger" onclick="deletarDespesa(${despesa.id})">Deletar</button>
            </td>
        </tr>
    `).join('');
}

function atualizarTabelaManuteacoes() {
    const tableBody = document.getElementById('todasManutecoesBody');
    if (!tableBody) {
        return;
    }

    if (manutencoes.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="empty">Nenhuma manutencao registrada</td></tr>';
        return;
    }

    tableBody.innerHTML = manutencoes.map((manutencao) => `
        <tr>
            <td>${formatDate(manutencao.data)}</td>
            <td><strong>${escapeHtml(manutencao.tipo)}</strong></td>
            <td style="color: #ef4444;">${formatCurrency(manutencao.valor)}</td>
            <td>${manutencao.quilometragem.toLocaleString('pt-BR')} km</td>
            <td>
                <button class="btn btn-warning" onclick="editarManutencao(${manutencao.id})">Editar</button>
                <button class="btn btn-danger" onclick="deletarManutencao(${manutencao.id})">Deletar</button>
            </td>
        </tr>
    `).join('');
}

function generateWeeklyEarningsChart() {
    const canvas = document.getElementById('weeklyEarningsChart');
    if (!canvas) {
        return;
    }

    const chartData = window.reportService.getWeeklyEarningsData(sessoes);
    window.chartService.drawWeeklyEarningsChart(canvas, chartData);
}

function preencherAnosDisponiveis() {
    const yearSelect = document.getElementById('filtroAno');
    if (!yearSelect) {
        return;
    }

    const previousValue = yearSelect.value;
    const availableYears = window.reportService.getAvailableYears(sessoes, despesas, manutencoes);

    yearSelect.innerHTML = '<option value="">Todos os anos</option>';

    availableYears.forEach((year) => {
        const option = document.createElement('option');
        option.value = String(year);
        option.textContent = String(year);
        yearSelect.appendChild(option);
    });

    if (previousValue) {
        yearSelect.value = previousValue;
    }
}

function renderPlatformReport(platforms) {
    const container = document.getElementById('plataformasRelatorio');
    if (!container) {
        return;
    }

    const entries = Object.entries(platforms);
    if (entries.length === 0) {
        container.innerHTML = '<p style="color: #9ca3af;">Sem dados</p>';
        return;
    }

    container.innerHTML = entries.map(([platformName, data]) => `
        <div class="relatorio-item">
            <div>
                <div class="relatorio-label">${escapeHtml(platformName)} (${data.sessoes} sessoes)</div>
            </div>
            <div>
                <div class="relatorio-valor">${formatCurrency(data.ganho)}</div>
                <div class="relatorio-sub">Media: ${formatCurrency(data.ganhoMedio)}</div>
            </div>
        </div>
    `).join('');
}

function renderCategoryReport(categories) {
    const container = document.getElementById('categoriasRelatorio');
    if (!container) {
        return;
    }

    const entries = Object.entries(categories);
    if (entries.length === 0) {
        container.innerHTML = '<p style="color: #9ca3af;">Sem dados</p>';
        return;
    }

    container.innerHTML = entries.map(([categoryName, value]) => `
        <div class="relatorio-item">
            <div class="relatorio-label">${escapeHtml(categoryName)}</div>
            <div class="relatorio-valor relatorio-value danger">${formatCurrency(value)}</div>
        </div>
    `).join('');
}

function atualizarRelatorios() {
    const selectedYear = document.getElementById('filtroAno').value;
    const selectedMonth = document.getElementById('filtroMes').value;
    const reportData = window.reportService.buildReportData(
        sessoes,
        despesas,
        manutencoes,
        appSettings,
        selectedYear,
        selectedMonth
    );

    setElementText('ganhoTotalRel', formatCurrency(reportData.ganhoTotal));
    setElementText('horasTotaisRel', window.reportService.formatTime(reportData.tempoTotalMinutos));
    setElementText('sessoesTotaisRel', String(reportData.totalSessoes));
    setElementText('ganhoMedioHoraRel', formatCurrency(reportData.ganhoMedioHora));
    setElementText('despesasRel', formatCurrency(reportData.despesasComManutencao));
    setElementText('lucroLiquidoRel', formatCurrency(reportData.lucroLiquido));
    setElementText('corridasTotaisRel', String(reportData.corridasTotais));
    setElementText('distanciaTotalRel', `${reportData.distanciaTotal.toFixed(1).replace('.', ',')} km`);
    setElementText('ganhoKmRel', formatCurrency(reportData.ganhoKm));
    setElementText('custoCombustivelKmRel', formatCurrency(reportData.custoCombustivelKm));
    setElementText('lucroRealKmRel', formatCurrency(reportData.lucroRealKm));
    setElementText('eficienciaRel', `${reportData.eficiencia.toFixed(1).replace('.', ',')}%`);

    renderPlatformReport(reportData.plataformas);
    renderCategoryReport(reportData.categorias);
}

function renderMaintenanceAlerts() {
    const maintenanceAlerts = window.reportService.getMaintenanceAlerts(manutencoes);
    const statusCard = document.getElementById('statusManutencao');
    const upcomingCard = document.getElementById('proximasManutencoes');

    if (statusCard) {
        if (maintenanceAlerts.expired.length === 0) {
            statusCard.innerHTML = '<h3>Status Manutencao</h3><p style="color: #22c55e;">Tudo em dia</p>';
        } else {
            const expiredItems = maintenanceAlerts.expired.map((item) => `
                <li style="color: #ef4444; margin-left: 1rem;">
                    ${escapeHtml(item.tipo)} - vencida em ${formatDate(window.reportService.toDateKey(item.dueDate))}
                </li>
            `).join('');

            statusCard.innerHTML = `
                <h3>Status Manutencao</h3>
                <p style="color: #ef4444;">${maintenanceAlerts.expired.length} manutencao(oes) vencida(s)</p>
                <ul style="list-style: none; padding: 0;">${expiredItems}</ul>
            `;
        }
    }

    if (upcomingCard) {
        if (maintenanceAlerts.upcoming.length === 0) {
            upcomingCard.innerHTML = '<h3>Proximas Manutencoes</h3><p style="color: #22c55e;">Nenhuma proxima</p>';
        } else {
            const upcomingItems = maintenanceAlerts.upcoming.map((item) => `
                <li style="color: #f59e0b; margin-left: 1rem;">
                    ${escapeHtml(item.tipo)} - prevista para ${formatDate(window.reportService.toDateKey(item.dueDate))}
                </li>
            `).join('');

            upcomingCard.innerHTML = `
                <h3>Proximas Manutencoes</h3>
                <p style="color: #f59e0b;">${maintenanceAlerts.upcoming.length} manutencao(oes) proxima(s)</p>
                <ul style="list-style: none; padding: 0;">${upcomingItems}</ul>
            `;
        }
    }
}

function refreshUI() {
    loadSettings();
    atualizarTabelaSessoes();
    atualizarTabelaDespesas();
    atualizarTabelaManuteacoes();
    preencherAnosDisponiveis();
    renderDashboard();
    atualizarRelatorios();
    renderBackupSummary();

    if (currentSectionId === 'dashboard') {
        generateWeeklyEarningsChart();
    }
}

async function saveSettings() {
    const monthlyGoalGross = Number(document.getElementById('monthlyGoalGross').value);
    const monthlyGoalNet = Number(document.getElementById('monthlyGoalNet').value);
    const weeklyGoalGross = Number(document.getElementById('weeklyGoalGross').value);
    const weeklyGoalNet = Number(document.getElementById('weeklyGoalNet').value);
    const fuelPrice = Number(document.getElementById('fuelPrice').value);
    const carConsumption = Number(document.getElementById('carConsumption').value);

    if ([monthlyGoalGross, monthlyGoalNet, weeklyGoalGross, weeklyGoalNet, fuelPrice, carConsumption].some((value) => !Number.isFinite(value))) {
        alert('Preencha todas as configuracoes com valores validos.');
        return;
    }

    if (carConsumption <= 0) {
        alert('O consumo do carro precisa ser maior que zero.');
        return;
    }

    appSettings = await window.settingsService.save({
        monthly_goal_gross: monthlyGoalGross,
        monthly_goal_net: monthlyGoalNet,
        weekly_goal_gross: weeklyGoalGross,
        weekly_goal_net: weeklyGoalNet,
        fuel_price: fuelPrice,
        car_consumption: carConsumption
    });

    refreshUI();
    alert('Configuracoes salvas com sucesso.');
}

async function exportBackup() {
    try {
        const backup = await window.backupService.exportToJson();
        const blob = new Blob([backup.json], { type: 'application/json' });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = downloadUrl;
        link.download = backup.fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(downloadUrl);

        setBackupStatus(`Backup exportado com sucesso em ${new Date(backup.payload.createdAt).toLocaleString('pt-BR')}.`);
    } catch (error) {
        console.error('Falha ao exportar backup.', error);
        setBackupStatus('Falha ao exportar o backup.');
        alert('Nao foi possivel exportar o backup.');
    }
}

function openBackupFilePicker() {
    const fileInput = document.getElementById('backupFileInput');
    if (fileInput) {
        fileInput.click();
    }
}

async function handleBackupFileChange(event) {
    const selectedFile = event.target.files && event.target.files[0];
    if (!selectedFile) {
        return;
    }

    const confirmed = confirm('Importar um backup vai substituir os dados atuais salvos no dispositivo. Deseja continuar?');
    if (!confirmed) {
        event.target.value = '';
        return;
    }

    try {
        const fileContents = await selectedFile.text();
        const importResult = await window.backupService.importFromJson(fileContents);

        await reloadState();
        resetSessionForm();
        resetExpenseForm();
        resetMaintenanceForm();
        refreshUI();

        setBackupStatus(
            `Backup importado com sucesso. ${importResult.sessoes} sessoes, ${importResult.despesas} despesas e ${importResult.manutencoes} manutencoes restauradas.`
        );
        alert('Backup importado com sucesso.');
    } catch (error) {
        console.error('Falha ao importar backup.', error);
        setBackupStatus(error.message || 'Falha ao importar o backup.');
        alert(error.message || 'Nao foi possivel importar o backup.');
    } finally {
        event.target.value = '';
    }
}

function showSection(sectionId, linkElement) {
    currentSectionId = sectionId;

    document.querySelectorAll('.section').forEach((section) => {
        section.classList.remove('active');
    });

    document.querySelectorAll('.nav-link').forEach((link) => {
        link.classList.remove('active');
    });

    document.getElementById(sectionId).classList.add('active');

    if (linkElement) {
        linkElement.classList.add('active');
    }

    if (sectionId === 'dashboard') {
        renderDashboard();
        generateWeeklyEarningsChart();
        return;
    }

    if (sectionId === 'relatorios') {
        atualizarRelatorios();
        return;
    }

    if (sectionId === 'configuracoes') {
        loadSettings();
        return;
    }

    if (sectionId === 'manutencao') {
        atualizarTabelaManuteacoes();
        renderMaintenanceAlerts();
    }
}

async function adicionarSessao(event) {
    event.preventDefault();

    const payload = {
        data: document.getElementById('dataSessao').value,
        plataforma: document.getElementById('plataformaSessao').value,
        horas: document.getElementById('horas').value,
        minutos: document.getElementById('minutos').value,
        quantidadeCorreidas: document.getElementById('quantidadeCorreidas').value,
        valorTotal: document.getElementById('valorTotal').value,
        distanciaTotal: document.getElementById('distanciaTotal').value
    };

    try {
        if (sessionIdEmEdicao !== null) {
            await window.sessionService.update(sessionIdEmEdicao, payload);
            alert('Sessao atualizada com sucesso.');
        } else {
            await window.sessionService.create(payload);
            alert('Sessao registrada com sucesso.');
        }

        resetSessionForm();
        await reloadState();
        refreshUI();
    } catch (error) {
        alert(error.message || 'Nao foi possivel salvar a sessao.');
    }
}

async function deletarSessao(id) {
    if (!confirm('Deletar essa sessao?')) {
        return;
    }

    await window.sessionService.remove(id);
    await reloadState();
    refreshUI();
}

function editarSessao(id) {
    const sessao = sessoes.find((item) => item.id === id);
    if (!sessao) {
        return;
    }

    document.getElementById('dataSessao').value = sessao.data;
    document.getElementById('plataformaSessao').value = sessao.plataforma;

    const tempo = window.reportService.minutesToParts(sessao.tempoTotalMinutos);
    document.getElementById('horas').value = tempo.horas;
    document.getElementById('minutos').value = tempo.minutos;
    document.getElementById('quantidadeCorreidas').value = sessao.quantidadeCorreidas;
    document.getElementById('valorTotal').value = sessao.valorTotal;
    document.getElementById('distanciaTotal').value = sessao.distanciaTotal;

    sessionIdEmEdicao = id;
    setPrimaryButtonState('formSessao', 'Salvar Alteracoes', '#3b82f6');
    ensureCancelButton('formSessao', 'cancelarEditSessaoBtn', 'Cancelar Edicao', cancelarEdicaoSessao);
    document.getElementById('formSessao').scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicaoSessao() {
    resetSessionForm();
}

async function adicionarDespesa(event) {
    event.preventDefault();

    const payload = {
        data: document.getElementById('dataDespesa').value,
        categoria: document.getElementById('categoria').value,
        valor: document.getElementById('valorDespesa').value,
        descricao: document.getElementById('descricaoDespesa').value
    };

    try {
        if (expenseIdEmEdicao !== null) {
            await window.expenseService.update(expenseIdEmEdicao, payload);
            alert('Despesa atualizada com sucesso.');
        } else {
            await window.expenseService.create(payload);
            alert('Despesa registrada com sucesso.');
        }

        resetExpenseForm();
        await reloadState();
        refreshUI();
    } catch (error) {
        alert(error.message || 'Nao foi possivel salvar a despesa.');
    }
}

function editarDespesa(id) {
    const despesa = despesas.find((item) => item.id === id);
    if (!despesa) {
        return;
    }

    document.getElementById('dataDespesa').value = despesa.data;
    document.getElementById('categoria').value = despesa.categoria;
    document.getElementById('valorDespesa').value = despesa.valor;
    document.getElementById('descricaoDespesa').value = despesa.descricao || '';

    expenseIdEmEdicao = id;
    setPrimaryButtonState('formDespesa', 'Salvar Alteracoes', '#3b82f6');
    ensureCancelButton('formDespesa', 'cancelarEditDespesaBtn', 'Cancelar Edicao', cancelarEdicaoDespesa);
    document.getElementById('formDespesa').scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicaoDespesa() {
    resetExpenseForm();
}

async function deletarDespesa(id) {
    if (!confirm('Deletar essa despesa?')) {
        return;
    }

    await window.expenseService.remove(id);
    await reloadState();
    refreshUI();
}

async function adicionarManutencao(event) {
    event.preventDefault();

    const payload = {
        data: document.getElementById('dataManutencao').value,
        tipo: document.getElementById('tipoManutencao').value,
        valor: document.getElementById('valorManutencao').value,
        quilometragem: document.getElementById('quilometragemManutencao').value,
        descricao: document.getElementById('descricaoManutencao').value
    };

    try {
        if (maintenanceIdEmEdicao !== null) {
            await window.maintenanceService.update(maintenanceIdEmEdicao, payload);
            alert('Manutencao atualizada com sucesso.');
        } else {
            await window.maintenanceService.create(payload);
            alert('Manutencao registrada com sucesso.');
        }

        resetMaintenanceForm();
        await reloadState();
        refreshUI();
    } catch (error) {
        alert(error.message || 'Nao foi possivel salvar a manutencao.');
    }
}

async function deletarManutencao(id) {
    if (!confirm('Deletar essa manutencao?')) {
        return;
    }

    await window.maintenanceService.remove(id);
    await reloadState();
    refreshUI();
}

function editarManutencao(id) {
    const manutencao = manutencoes.find((item) => item.id === id);
    if (!manutencao) {
        return;
    }

    document.getElementById('dataManutencao').value = manutencao.data;
    document.getElementById('tipoManutencao').value = manutencao.tipo;
    document.getElementById('valorManutencao').value = manutencao.valor;
    document.getElementById('quilometragemManutencao').value = manutencao.quilometragem;
    document.getElementById('descricaoManutencao').value = manutencao.descricao || '';

    maintenanceIdEmEdicao = id;
    setPrimaryButtonState('formManutencao', 'Salvar Alteracoes', '#3b82f6');
    ensureCancelButton('formManutencao', 'cancelarEditMaintenanceBtn', 'Cancelar Edicao', cancelarEdicaoManutencao);
    document.getElementById('formManutencao').scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicaoManutencao() {
    resetMaintenanceForm();
}

async function initializeApp() {
    try {
        await window.storageService.init();
        await reloadState();

        resetSessionForm();
        resetExpenseForm();
        resetMaintenanceForm();
        refreshUI();

        window.addEventListener('resize', () => {
            if (currentSectionId === 'dashboard') {
                generateWeeklyEarningsChart();
            }
        });
    } catch (error) {
        console.error('Falha ao iniciar o app.', error);
        alert('Nao foi possivel iniciar o aplicativo.');
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);
