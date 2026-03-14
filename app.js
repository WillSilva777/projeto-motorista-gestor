// ============ DADOS COM LOCALSTORAGE ============

let sessoes = JSON.parse(localStorage.getItem('sessoes')) || [];
let despesas = JSON.parse(localStorage.getItem('despesas')) || [];
let metaMensal = parseFloat(localStorage.getItem('metaMensal')) || 5000;
let weeklyEarningsChartInstance = null;

// Configurações padrão
let appSettings = JSON.parse(localStorage.getItem('appSettings')) || {
    monthly_goal_gross: 6000,
    monthly_goal_net: 4500,
    weekly_goal_gross: 1500,
    weekly_goal_net: 1000,
    fuel_price: 5.79,
    car_consumption: 11
};

// Controle de modo edição
let sessionIdEmEdicao = null;
let expenseIdEmEdicao = null;

// ============ MANUTENÇÃO ============
let manutencoes = JSON.parse(localStorage.getItem('manutencoes')) || [];
let maintenanceIdEmEdicao = null;

// Configurar data padrão (hoje) quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('dataSessao')) {
        document.getElementById('dataSessao').valueAsDate = new Date();
    }
    if (document.getElementById('dataDespesa')) {
        document.getElementById('dataDespesa').valueAsDate = new Date();
    }
    if (document.getElementById('dataManutencao')) {
        document.getElementById('dataManutencao').valueAsDate = new Date();
    }
    // Carregar configurações ao iniciar a página
    loadSettings();
    loadDashboardData();
    preencherAnosDisponiveis();
});

// ============ CONFIGURAÇÕES ============

function loadSettings() {
    // Carregar configurações do localStorage
    appSettings = JSON.parse(localStorage.getItem('appSettings')) || {
        monthly_goal_gross: 6000,
        monthly_goal_net: 4500,
        weekly_goal_gross: 1500,
        weekly_goal_net: 1000,
        fuel_price: 5.79,
        car_consumption: 11
    };

    // Preencher os inputs com as configurações atuais
    document.getElementById('monthlyGoalGross').value = appSettings.monthly_goal_gross.toFixed(2);
    document.getElementById('monthlyGoalNet').value = appSettings.monthly_goal_net.toFixed(2);
    document.getElementById('weeklyGoalGross').value = appSettings.weekly_goal_gross.toFixed(2);
    document.getElementById('weeklyGoalNet').value = appSettings.weekly_goal_net.toFixed(2);
    document.getElementById('fuelPrice').value = appSettings.fuel_price.toFixed(2);
    document.getElementById('carConsumption').value = appSettings.car_consumption.toFixed(1);

    // Atualizar resumo das configurações
    updateSettingsSummary();
}

function updateSettingsSummary() {
    // Exibir valores no resumo
    document.getElementById('summaryGoalGross').textContent = 'R$ ' + appSettings.monthly_goal_gross.toFixed(2).replace('.', ',');
    document.getElementById('summaryGoalGrossWeekly').textContent = 'R$ ' + appSettings.weekly_goal_gross.toFixed(2).replace('.', ',');
    document.getElementById('summaryGoalNet').textContent = 'R$ ' + appSettings.monthly_goal_net.toFixed(2).replace('.', ',');
    document.getElementById('summaryGoalNetWeekly').textContent = 'R$ ' + appSettings.weekly_goal_net.toFixed(2).replace('.', ',');
    document.getElementById('summaryFuelPrice').textContent = 'R$ ' + appSettings.fuel_price.toFixed(2).replace('.', ',');
    document.getElementById('summaryCarConsumption').textContent = appSettings.car_consumption.toFixed(1).replace('.', ',') + ' km/l';
    
    // Calcular custo de combustível por km
    const costFuelPerKm = appSettings.fuel_price / appSettings.car_consumption;
    document.getElementById('summaryCostPerKmFuel').textContent = 'R$ ' + costFuelPerKm.toFixed(2).replace('.', ',');
}

function saveSettings() {
    // Validar inputs
    const monthlyGoalGross = parseFloat(document.getElementById('monthlyGoalGross').value);
    const monthlyGoalNet = parseFloat(document.getElementById('monthlyGoalNet').value);
    const weeklyGoalGross = parseFloat(document.getElementById('weeklyGoalGross').value);
    const weeklyGoalNet = parseFloat(document.getElementById('weeklyGoalNet').value);
    const fuelPrice = parseFloat(document.getElementById('fuelPrice').value);
    const carConsumption = parseFloat(document.getElementById('carConsumption').value);

    if (isNaN(monthlyGoalGross) || isNaN(monthlyGoalNet) || isNaN(weeklyGoalGross) || isNaN(weeklyGoalNet) || isNaN(fuelPrice) || isNaN(carConsumption)) {
        alert('Por favor, preencha todos os campos com valores válidos.');
        return;
    }

    // Atualizar objeto de configurações
    appSettings = {
        monthly_goal_gross: monthlyGoalGross,
        monthly_goal_net: monthlyGoalNet,
        weekly_goal_gross: weeklyGoalGross,
        weekly_goal_net: weeklyGoalNet,
        fuel_price: fuelPrice,
        car_consumption: carConsumption
    };

    // Salvar no localStorage
    localStorage.setItem('appSettings', JSON.stringify(appSettings));

    // Atualizar resumo
    updateSettingsSummary();

    // Atualizar dashboard com novas configurações
    updateDashboardWithSettings();

    // Exibir mensagem de sucesso
    alert('✅ Configurações salvas com sucesso!');
}

function updateDashboardWithSettings() {
    // Recalcular e atualizar o dashboard
    loadDashboardData();
}

// ============ FUNÇÕES UTILITÁRIAS ============

function obterDataHoje() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

function converterParaMinutos(horas, minutos) {
    return (horas * 60) + minutos;
}

function converterParaHorasMinutos(totalMinutos) {
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    return { horas, minutos };
}

function formatarTempo(totalMinutos) {
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    return `${horas}h ${minutos}m`;
}

// ============ CARREGAR DADOS DO DASHBOARD ============

function loadDashboardData() {
    const hoje = obterDataHoje();
    const semanaPassada = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const mesPassado = new Date();
    mesPassado.setMonth(mesPassado.getMonth() - 1);
    
    console.log('Carregando dados do Dashboard para:', hoje);
    console.log('Sessões no localStorage:', sessoes);
    
    // Filtrar sessões de hoje
    const sessoesHoje = sessoes.filter(s => s.data === hoje);
    
    console.log('Sessões de hoje:', sessoesHoje);
    
    // Calcular totais de hoje
    const saldoHoje = sessoesHoje.reduce((sum, s) => sum + (parseFloat(s.valorTotal) || 0), 0);
    const horasTrabalhadas = sessoesHoje.reduce((sum, s) => sum + (parseInt(s.tempoTotalMinutos) || 0), 0);
    const totalCorridas = sessoesHoje.reduce((sum, s) => sum + (parseInt(s.quantidadeCorreidas) || 0), 0);
    const ganhoHora = horasTrabalhadas > 0 ? saldoHoje / (horasTrabalhadas / 60) : 0;
    
    // Calcular ganhos semana
    const sessoesSemana = sessoes.filter(s => {
        const dataSession = new Date(s.data);
        return dataSession >= semanaPassada;
    });
    const ganhoSemana = sessoesSemana.reduce((sum, s) => sum + (parseFloat(s.valorTotal) || 0), 0);
    
    // Calcular ganhos mês
    const sessoesMes = sessoes.filter(s => {
        const dataSession = new Date(s.data);
        return dataSession >= mesPassado;
    });
    const ganhoMes = sessoesMes.reduce((sum, s) => sum + (parseFloat(s.valorTotal) || 0), 0);
    
    // Calcular despesas (incluir manutenções)
    const despesasTotal = despesas.reduce((sum, d) => sum + (parseFloat(d.valor) || 0), 0);
    const manutencoesMes = manutencoes.reduce((sum, m) => sum + (parseFloat(m.valor) || 0), 0);
    const despesasTotalComManutencao = despesasTotal + manutencoesMes;
    const lucroLiquido = ganhoMes - despesasTotalComManutencao;
    
    // Calcular ganhos e despesas semana
    const despesasSemana = despesas.filter(d => {
        const dataDespesa = new Date(d.data);
        return dataDespesa >= semanaPassada;
    }).reduce((sum, d) => sum + (parseFloat(d.valor) || 0), 0);
    
    const manutencoesSemana = manutencoes.filter(m => {
        const dataManutencao = new Date(m.data);
        return dataManutencao >= semanaPassada;
    }).reduce((sum, m) => sum + (parseFloat(m.valor) || 0), 0);
    
    const ganhoSemanaLiquido = ganhoSemana - despesasSemana - manutencoesSemana;
    
    // Atualizar elementos
    const elementos = {
        saldoHoje: `R$ ${saldoHoje.toFixed(2)}`,
        horasTrabalhadas: formatarTempo(horasTrabalhadas),
        totalCorridas: totalCorridas,
        ganhoHora: `R$ ${ganhoHora.toFixed(2)}`,
        ganhoSemana: `R$ ${ganhoSemana.toFixed(2)}`,
        ganhoMes: `R$ ${ganhoMes.toFixed(2)}`,
        despesasTotal: `R$ ${despesasTotalComManutencao.toFixed(2)}`,
        lucroLiquido: `R$ ${lucroLiquido.toFixed(2)}`
    };
    
    Object.keys(elementos).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.textContent = elementos[key];
        }
    });
    
    // Atualizar progresso da meta bruta
    const percentualGross = (ganhoMes / appSettings.monthly_goal_gross) * 100;
    const progressFillGross = document.getElementById('progressFillGross');
    const progressTextGross = document.getElementById('progressTextGross');
    
    if (progressFillGross) progressFillGross.style.width = Math.min(percentualGross, 100) + '%';
    if (progressTextGross) progressTextGross.textContent = `${Math.round(percentualGross)}% - R$ ${ganhoMes.toFixed(2)} / R$ ${appSettings.monthly_goal_gross.toFixed(2)}`;
    
    // Atualizar progresso da meta líquida mensal
    const percentualNet = (lucroLiquido / appSettings.monthly_goal_net) * 100;
    const progressFillNet = document.getElementById('progressFillNet');
    const progressTextNet = document.getElementById('progressTextNet');
    
    if (progressFillNet) progressFillNet.style.width = Math.min(percentualNet, 100) + '%';
    if (progressTextNet) progressTextNet.textContent = `${Math.round(percentualNet)}% - R$ ${lucroLiquido.toFixed(2)} / R$ ${appSettings.monthly_goal_net.toFixed(2)}`;
    
    // Atualizar progresso da meta bruta semanal
    const percentualGrossWeekly = (ganhoSemana / appSettings.weekly_goal_gross) * 100;
    const progressFillGrossWeekly = document.getElementById('progressFillGrossWeekly');
    const progressTextGrossWeekly = document.getElementById('progressTextGrossWeekly');
    
    if (progressFillGrossWeekly) progressFillGrossWeekly.style.width = Math.min(percentualGrossWeekly, 100) + '%';
    if (progressTextGrossWeekly) progressTextGrossWeekly.textContent = `${Math.round(percentualGrossWeekly)}% - R$ ${ganhoSemana.toFixed(2)} / R$ ${appSettings.weekly_goal_gross.toFixed(2)}`;
    
    // Atualizar progresso da meta líquida semanal
    const percentualNetWeekly = (ganhoSemanaLiquido / appSettings.weekly_goal_net) * 100;
    const progressFillNetWeekly = document.getElementById('progressFillNetWeekly');
    const progressTextNetWeekly = document.getElementById('progressTextNetWeekly');
    
    if (progressFillNetWeekly) progressFillNetWeekly.style.width = Math.min(percentualNetWeekly, 100) + '%';
    if (progressTextNetWeekly) progressTextNetWeekly.textContent = `${Math.round(percentualNetWeekly)}% - R$ ${ganhoSemanaLiquido.toFixed(2)} / R$ ${appSettings.weekly_goal_net.toFixed(2)}`;
    
    // Atualizar últimas sessões
    const ultimasSecoesBody = document.getElementById('ultimasSecoesBody');
    if (ultimasSecoesBody) {
        const ultimas = sessoes.slice(-5).reverse();
        
        if (ultimas.length === 0) {
            ultimasSecoesBody.innerHTML = '<tr><td colspan="6" class="empty">Nenhuma sessão registrada</td></tr>';
        } else {
            ultimasSecoesBody.innerHTML = ultimas.map(s => `
                <tr>
                    <td>${new Date(s.data).toLocaleDateString('pt-BR')}</td>
                    <td><strong>${s.plataforma}</strong></td>
                    <td>${formatarTempo(s.tempoTotalMinutos)}</td>
                    <td>${s.quantidadeCorreidas}</td>
                    <td style="color: #22c55e; font-weight: bold;">R$ ${s.valorTotal.toFixed(2)}</td>
                    <td>R$ ${s.ganhosPorHora.toFixed(2)}</td>
                </tr>
            `).join('');
        }
    }
    
    console.log('Dashboard atualizado:', { saldoHoje, horasTrabalhadas, totalCorridas, ganhoHora, ganhoSemana, ganhoMes });
    
    // Carregar alertas de manutenção
    carregarAlertas();
}

// ============ SESSÕES DE TRABALHO ============

function showSection(sectionId) {
    // Esconder todas as seções
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remover active de todos os links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Mostrar a seção selecionada
    document.getElementById(sectionId).classList.add('active');
    
    // Marcar link como ativo
    event.target.classList.add('active');
    
    // Atualizar dados quando mudar de seção
    if (sectionId === 'dashboard') {
        loadDashboardData();
        generateWeeklyEarningsChart();
    } else if (sectionId === 'relatorios') {
        atualizarRelatorios();
    } else if (sectionId === 'configuracoes') {
        loadSettings();
    } else if (sectionId === 'manutencao') {
        atualizarTabelaManuteacoes();
        carregarAlertas();
    }
}

function adicionarSessao(e) {
    e.preventDefault();
    
    const data = document.getElementById('dataSessao').value;
    const plataforma = document.getElementById('plataformaSessao').value;
    const horas = parseInt(document.getElementById('horas').value) || 0;
    const minutos = parseInt(document.getElementById('minutos').value) || 0;
    const quantidadeCorreidas = parseInt(document.getElementById('quantidadeCorreidas').value);
    const valorTotal = parseFloat(document.getElementById('valorTotal').value);
    const distanciaTotal = parseFloat(document.getElementById('distanciaTotal').value);
    
    // Validações
    if (!data || !plataforma || (horas === 0 && minutos === 0) || !quantidadeCorreidas || !valorTotal || !distanciaTotal) {
        alert('Preencha todos os campos corretamente!');
        return;
    }
    
    const tempoTotalMinutos = converterParaMinutos(horas, minutos);
    const tempoTotalHoras = tempoTotalMinutos / 60;
    
    // Calcular ganhos por hora e por km
    const ganhosPorHora = valorTotal / tempoTotalHoras;
    const ganhosPorKm = valorTotal / distanciaTotal;
    
    // Se estamos em modo edição, atualizar; senão, criar novo
    if (sessionIdEmEdicao !== null) {
        // Atualizar sessão existente
        const index = sessoes.findIndex(s => s.id === sessionIdEmEdicao);
        if (index !== -1) {
            sessoes[index] = {
                id: sessionIdEmEdicao,
                data,
                plataforma,
                tempoTotalMinutos,
                quantidadeCorreidas,
                valorTotal,
                distanciaTotal,
                ganhosPorHora: parseFloat(ganhosPorHora.toFixed(2)),
                ganhosPorKm: parseFloat(ganhosPorKm.toFixed(2))
            };
            localStorage.setItem('sessoes', JSON.stringify(sessoes));
            alert('Sessão atualizada com sucesso!');
            sessionIdEmEdicao = null;
            cancelarEdicaoSessao();
        }
    } else {
        // Adicionar nova sessão
        const sessao = {
            id: Date.now(),
            data,
            plataforma,
            tempoTotalMinutos,
            quantidadeCorreidas,
            valorTotal,
            distanciaTotal,
            ganhosPorHora: parseFloat(ganhosPorHora.toFixed(2)),
            ganhosPorKm: parseFloat(ganhosPorKm.toFixed(2))
        };
        
        sessoes.push(sessao);
        localStorage.setItem('sessoes', JSON.stringify(sessoes));
        alert('Sessão registrada com sucesso!');
    }
    
    // Limpar form
    document.getElementById('formSessao').reset();
    document.getElementById('dataSessao').valueAsDate = new Date();
    atualizarTabelaSessoes();
    loadDashboardData();
    generateWeeklyEarningsChart();
    preencherAnosDisponiveis();
    atualizarRelatorios();
}

function deletarSessao(id) {
    if (confirm('Deletar essa sessão?')) {
        sessoes = sessoes.filter(s => s.id !== id);
        localStorage.setItem('sessoes', JSON.stringify(sessoes));
        atualizarTabelaSessoes();
        loadDashboardData();
        generateWeeklyEarningsChart();
        preencherAnosDisponiveis();
        atualizarRelatorios();
    }
}

function editarSessao(id) {
    const sessao = sessoes.find(s => s.id === id);
    if (!sessao) return;
    
    // Preencher formulário
    document.getElementById('dataSessao').value = sessao.data;
    document.getElementById('plataformaSessao').value = sessao.plataforma;
    
    const { horas, minutos } = converterParaHorasMinutos(sessao.tempoTotalMinutos);
    document.getElementById('horas').value = horas;
    document.getElementById('minutos').value = minutos;
    
    document.getElementById('quantidadeCorreidas').value = sessao.quantidadeCorreidas;
    document.getElementById('valorTotal').value = sessao.valorTotal;
    document.getElementById('distanciaTotal').value = sessao.distanciaTotal;
    
    // Marcar modo edição
    sessionIdEmEdicao = id;
    
    // Atualizar botão
    const submitBtn = document.getElementById('formSessao').querySelector('button[type="submit"]');
    submitBtn.textContent = 'Salvar Alterações';
    submitBtn.style.backgroundColor = '#3b82f6';
    
    // Adicionar botão de cancelamento
    let cancelBtn = document.getElementById('cancelarEditSessaoBtn');
    if (!cancelBtn) {
        cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancelarEditSessaoBtn';
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn';
        cancelBtn.textContent = 'Cancelar Edição';
        cancelBtn.style.backgroundColor = '#6b7280';
        cancelBtn.style.marginLeft = '10px';
        cancelBtn.onclick = cancelarEdicaoSessao;
        document.getElementById('formSessao').appendChild(cancelBtn);
    }
    
    // Scroll para o formulário
    document.getElementById('formSessao').scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicaoSessao() {
    sessionIdEmEdicao = null;
    document.getElementById('formSessao').reset();
    document.getElementById('dataSessao').valueAsDate = new Date();
    
    const submitBtn = document.getElementById('formSessao').querySelector('button[type="submit"]');
    submitBtn.textContent = 'Registrar Sessão';
    submitBtn.style.backgroundColor = '';
    
    const cancelBtn = document.getElementById('cancelarEditSessaoBtn');
    if (cancelBtn) cancelBtn.remove();
}

function atualizarTabelaSessoes() {
    const tbody = document.getElementById('todasSecoesBody');
    
    if (sessoes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty">Nenhuma sessão registrada</td></tr>';
        return;
    }
    
    tbody.innerHTML = sessoes.map(s => `
        <tr>
            <td>${new Date(s.data).toLocaleDateString('pt-BR')}</td>
            <td><strong>${s.plataforma}</strong></td>
            <td>${formatarTempo(s.tempoTotalMinutos)}</td>
            <td>${s.quantidadeCorreidas}</td>
            <td style="color: #22c55e; font-weight: bold;">R$ ${s.valorTotal.toFixed(2)}</td>
            <td>R$ ${s.ganhosPorHora.toFixed(2)}</td>
            <td>R$ ${s.ganhosPorKm.toFixed(2)}</td>
            <td>
                <button class="btn btn-warning" onclick="editarSessao(${s.id})">Editar</button>
                <button class="btn btn-danger" onclick="deletarSessao(${s.id})">Deletar</button>
            </td>
        </tr>
    `).join('');
}

// ============ DESPESAS ============

function adicionarDespesa(e) {
    e.preventDefault();
    
    const data = document.getElementById('dataDespesa').value;
    const categoria = document.getElementById('categoria').value;
    const valor = parseFloat(document.getElementById('valorDespesa').value);
    const descricao = document.getElementById('descricaoDespesa').value;
    
    // Se estamos em modo edição, atualizar; senão, criar novo
    if (expenseIdEmEdicao !== null) {
        // Atualizar despesa existente
        const index = despesas.findIndex(d => d.id === expenseIdEmEdicao);
        if (index !== -1) {
            despesas[index] = {
                id: expenseIdEmEdicao,
                data,
                categoria,
                valor,
                descricao
            };
            localStorage.setItem('despesas', JSON.stringify(despesas));
            alert('Despesa atualizada com sucesso!');
            expenseIdEmEdicao = null;
            cancelarEdicaoDespesa();
        }
    } else {
        // Adicionar nova despesa
        const despesa = {
            id: Date.now(),
            data,
            categoria,
            valor,
            descricao
        };
        
        despesas.push(despesa);
        localStorage.setItem('despesas', JSON.stringify(despesas));
        alert('Despesa registrada com sucesso!');
    }
    
    // Limpar form
    document.getElementById('formDespesa').reset();
    document.getElementById('dataDespesa').valueAsDate = new Date();
    atualizarTabelaDespesas();
    loadDashboardData();
    preencherAnosDisponiveis();
    atualizarRelatorios();
}

function editarDespesa(id) {
    const despesa = despesas.find(d => d.id === id);
    if (!despesa) return;
    
    // Preencher formulário
    document.getElementById('dataDespesa').value = despesa.data;
    document.getElementById('categoria').value = despesa.categoria;
    document.getElementById('valorDespesa').value = despesa.valor;
    document.getElementById('descricaoDespesa').value = despesa.descricao || '';
    
    // Marcar modo edição
    expenseIdEmEdicao = id;
    
    // Atualizar botão
    const submitBtn = document.getElementById('formDespesa').querySelector('button[type="submit"]');
    submitBtn.textContent = 'Salvar Alterações';
    submitBtn.style.backgroundColor = '#3b82f6';
    
    // Adicionar botão de cancelamento
    let cancelBtn = document.getElementById('cancelarEditDespesaBtn');
    if (!cancelBtn) {
        cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancelarEditDespesaBtn';
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn';
        cancelBtn.textContent = 'Cancelar Edição';
        cancelBtn.style.backgroundColor = '#6b7280';
        cancelBtn.style.marginLeft = '10px';
        cancelBtn.onclick = cancelarEdicaoDespesa;
        document.getElementById('formDespesa').appendChild(cancelBtn);
    }
    
    // Scroll para o formulário
    document.getElementById('formDespesa').scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicaoDespesa() {
    expenseIdEmEdicao = null;
    document.getElementById('formDespesa').reset();
    document.getElementById('dataDespesa').valueAsDate = new Date();
    
    const submitBtn = document.getElementById('formDespesa').querySelector('button[type="submit"]');
    submitBtn.textContent = 'Registrar Despesa';
    submitBtn.style.backgroundColor = '';
    
    const cancelBtn = document.getElementById('cancelarEditDespesaBtn');
    if (cancelBtn) cancelBtn.remove();
}

function deletarDespesa(id) {
    if (confirm('Deletar essa despesa?')) {
        despesas = despesas.filter(d => d.id !== id);
        localStorage.setItem('despesas', JSON.stringify(despesas));
        atualizarTabelaDespesas();
        loadDashboardData();
        preencherAnosDisponiveis();
        atualizarRelatorios();
    }
}

function atualizarTabelaDespesas() {
    const tbody = document.getElementById('todasDespesasBody');
    
    if (despesas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty">Nenhuma despesa registrada</td></tr>';
        return;
    }
    
    tbody.innerHTML = despesas.map(d => `
        <tr>
            <td>${new Date(d.data).toLocaleDateString('pt-BR')}</td>
            <td><strong>${d.categoria}</strong></td>
            <td>${d.descricao || '-'}</td>
            <td style="color: #ef4444;">R$ ${d.valor.toFixed(2)}</td>
            <td>
                <button class="btn btn-warning" onclick="editarDespesa(${d.id})">Editar</button>
                <button class="btn btn-danger" onclick="deletarDespesa(${d.id})">Deletar</button>
            </td>
        </tr>
    `).join('');
}

// ============ GRÁFICO DE GANHOS POR DIA DA SEMANA ============

function generateWeeklyEarningsChart() {
    // Nomes dos dias da semana
    const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    
    // Array para armazenar ganhos de cada dia
    const ganhosPorDia = [0, 0, 0, 0, 0, 0, 0];
    
    // Somar ganhos de cada dia
    sessoes.forEach(sessao => {
        // Parsear data corretamente para evitar problemas de timezone
        const [year, month, day] = sessao.data.split('-').map(Number);
        const data = new Date(year, month - 1, day);
        const diaSemana = data.getDay(); // 0 = Domingo, 1 = Segunda, etc.
        
        // Ajustar para começar na segunda (índice 0 = Segunda)
        let diaSemanaAjustado = diaSemana === 0 ? 6 : diaSemana - 1;
        
        ganhosPorDia[diaSemanaAjustado] += parseFloat(sessao.valorTotal) || 0;
    });
    
    // Obter elemento canvas
    const ctx = document.getElementById('weeklyEarningsChart');
    
    if (!ctx) {
        console.error('Canvas do gráfico não encontrado');
        return;
    }
    
    // Destruir gráfico anterior se existir
    if (weeklyEarningsChartInstance) {
        weeklyEarningsChartInstance.destroy();
    }
    
    // Criar novo gráfico
    weeklyEarningsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: diasSemana,
            datasets: [{
                label: 'Ganhos (R$)',
                data: ganhosPorDia,
                backgroundColor: [
                    'rgba(34, 197, 94, 0.7)',   // Verde (Monday)
                    'rgba(34, 197, 94, 0.7)',   // Verde (Tuesday)
                    'rgba(34, 197, 94, 0.7)',   // Verde (Wednesday)
                    'rgba(34, 197, 94, 0.7)',   // Verde (Thursday)
                    'rgba(34, 197, 94, 0.7)',   // Verde (Friday)
                    'rgba(255, 193, 7, 0.7)',   // Amarelo (Saturday)
                    'rgba(244, 67, 54, 0.7)'    // Vermelho (Sunday)
                ],
                borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(34, 197, 94, 1)',
                    'rgba(34, 197, 94, 1)',
                    'rgba(34, 197, 94, 1)',
                    'rgba(34, 197, 94, 1)',
                    'rgba(255, 193, 7, 1)',
                    'rgba(244, 67, 54, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#d1d5db',
                        font: {
                            size: 12
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#d1d5db',
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(2);
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#d1d5db'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
    
    console.log('Gráfico de ganhos por dia da semana atualizado');
}

// ============ RELATÓRIOS ============

function preencherAnosDisponiveis() {
    // Obter anos únicos das sessões
    const anos = new Set();
    sessoes.forEach(s => {
        const year = new Date(s.data).getFullYear();
        anos.add(year);
    });
    despesas.forEach(d => {
        const year = new Date(d.data).getFullYear();
        anos.add(year);
    });
    
    // Ordenar anos em ordem decrescente
    const anosOrdenados = Array.from(anos).sort((a, b) => b - a);
    
    // Preencher select de anos
    const selectAno = document.getElementById('filtroAno');
    const anoAtual = selectAno.value;
    
    // Limpar e refazer opções
    const primeiraOpcao = selectAno.innerHTML.split('</option>')[0] + '</option>';
    selectAno.innerHTML = primeiraOpcao;
    
    anosOrdenados.forEach(ano => {
        const option = document.createElement('option');
        option.value = ano;
        option.textContent = ano;
        selectAno.appendChild(option);
    });
    
    // Restaurar valor anterior se ainda existir
    if (anoAtual) {
        selectAno.value = anoAtual;
    }
}

function atualizarRelatorios() {
    const anoSelecionado = document.getElementById('filtroAno').value;
    const mesSelecionado = document.getElementById('filtroMes').value;
    
    console.log('Filtrando relatórios:', { anoSelecionado, mesSelecionado });
    
    // Filtrar sessões
    let sessoesFiltradas = sessoes;
    let despesasFiltradas = despesas;
    
    if (anoSelecionado) {
        sessoesFiltradas = sessoesFiltradas.filter(s => {
            const year = new Date(s.data).getFullYear();
            return year == anoSelecionado;
        });
        despesasFiltradas = despesasFiltradas.filter(d => {
            const year = new Date(d.data).getFullYear();
            return year == anoSelecionado;
        });
    }
    
    if (mesSelecionado && anoSelecionado) {
        sessoesFiltradas = sessoesFiltradas.filter(s => {
            const month = new Date(s.data).getMonth() + 1;
            return month == mesSelecionado;
        });
        despesasFiltradas = despesasFiltradas.filter(d => {
            const month = new Date(d.data).getMonth() + 1;
            return month == mesSelecionado;
        });
    }
    
    // Cálculos
    const ganhoTotal = sessoesFiltradas.reduce((sum, s) => sum + (parseFloat(s.valorTotal) || 0), 0);
    const tempoTotalMinutos = sessoesFiltradas.reduce((sum, s) => sum + (parseInt(s.tempoTotalMinutos) || 0), 0);
    const tempoTotalHoras = tempoTotalMinutos / 60;
    const distanciaTotal = sessoesFiltradas.reduce((sum, s) => sum + (parseFloat(s.distanciaTotal) || 0), 0);
    const corridasTotal = sessoesFiltradas.reduce((sum, s) => sum + (parseInt(s.quantidadeCorreidas) || 0), 0);
    
    // Despesas por categoria
    const despesasPorCategoria = {};
    despesasFiltradas.forEach(d => {
        if (!despesasPorCategoria[d.categoria]) {
            despesasPorCategoria[d.categoria] = 0;
        }
        despesasPorCategoria[d.categoria] += parseFloat(d.valor) || 0;
    });
    
    // Filtrar manutenções do período
    let manutencoesFiltradas = manutencoes;
    if (anoSelecionado) {
        manutencoesFiltradas = manutencoesFiltradas.filter(m => {
            const year = new Date(m.data).getFullYear();
            return year == anoSelecionado;
        });
    }
    if (mesSelecionado && anoSelecionado) {
        manutencoesFiltradas = manutencoesFiltradas.filter(m => {
            const month = new Date(m.data).getMonth() + 1;
            return month == mesSelecionado;
        });
    }
    
    const despesasTotal = despesasFiltradas.reduce((sum, d) => sum + (parseFloat(d.valor) || 0), 0);
    const manutencaoTotal = manutencoesFiltradas.reduce((sum, m) => sum + (parseFloat(m.valor) || 0), 0);
    const despesasTotalComManutencao = despesasTotal + manutencaoTotal;
    const lucroLiquido = ganhoTotal - despesasTotalComManutencao;
    
    const ganhoMedioHora = tempoTotalHoras > 0 ? ganhoTotal / tempoTotalHoras : 0;
    
    // Atualizar estatísticas
    document.getElementById('ganhoTotalRel').textContent = `R$ ${ganhoTotal.toFixed(2)}`;
    document.getElementById('horasTotaisRel').textContent = `${Math.floor(tempoTotalHoras)}h`;
    document.getElementById('sessoesTotaisRel').textContent = sessoesFiltradas.length;
    document.getElementById('ganhoMedioHoraRel').textContent = `R$ ${ganhoMedioHora.toFixed(2)}`;
    document.getElementById('despesasRel').textContent = `R$ ${despesasTotalComManutencao.toFixed(2)}`;
    document.getElementById('lucroLiquidoRel').textContent = `R$ ${lucroLiquido.toFixed(2)}`;
    document.getElementById('corridasTotaisRel').textContent = corridasTotal;
    document.getElementById('distanciaTotalRel').textContent = `${distanciaTotal.toFixed(1)} km`;
    
    // Cálculos de eficiência baseados em consumo real
    const ganhoKm = distanciaTotal > 0 ? ganhoTotal / distanciaTotal : 0;
    const custoCombustivelKm = appSettings.fuel_price / appSettings.car_consumption;
    const lucroRealKm = ganhoKm - custoCombustivelKm;
    const eficiencia = ganhoKm > 0 ? (lucroRealKm / ganhoKm) * 100 : 0;
    
    document.getElementById('ganhoKmRel').textContent = `R$ ${ganhoKm.toFixed(2)}`;
    document.getElementById('custoCombustivelKmRel').textContent = `R$ ${custoCombustivelKm.toFixed(2)}`;
    document.getElementById('lucroRealKmRel').textContent = `R$ ${lucroRealKm.toFixed(2)}`;
    document.getElementById('eficienciaRel').textContent = `${eficiencia.toFixed(1)}%`;
    
    // Ganhos por plataforma
    const plataformas = {};
    sessoesFiltradas.forEach(s => {
        if (!plataformas[s.plataforma]) {
            plataformas[s.plataforma] = { ganho: 0, sessoes: 0, ganhoMedio: 0 };
        }
        plataformas[s.plataforma].ganho += parseFloat(s.valorTotal) || 0;
        plataformas[s.plataforma].sessoes += 1;
    });
    
    // Calcular ganho médio por plataforma
    Object.keys(plataformas).forEach(plat => {
        plataformas[plat].ganhoMedio = plataformas[plat].ganho / plataformas[plat].sessoes;
    });
    
    const plataformasHtml = Object.entries(plataformas).map(([nome, dados]) => `
        <div class="relatorio-item">
            <div>
                <div class="relatorio-label">${nome} (${dados.sessoes} sessões)</div>
            </div>
            <div>
                <div class="relatorio-valor">R$ ${dados.ganho.toFixed(2)}</div>
                <div class="relatorio-sub">Média: R$ ${dados.ganhoMedio.toFixed(2)}</div>
            </div>
        </div>
    `).join('');
    
    document.getElementById('plataformasRelatorio').innerHTML = plataformasHtml || '<p style="color: #9ca3af;">Sem dados</p>';
    
    // Despesas por categoria
    const categorias = {};
    despesasFiltradas.forEach(d => {
        if (!categorias[d.categoria]) {
            categorias[d.categoria] = 0;
        }
        categorias[d.categoria] += parseFloat(d.valor) || 0;
    });
    
    const categoriasHtml = Object.entries(categorias).map(([nome, valor]) => `
        <div class="relatorio-item">
            <div class="relatorio-label">${nome}</div>
            <div class="relatorio-valor relatorio-value danger">R$ ${valor.toFixed(2)}</div>
        </div>
    `).join('');
    
    document.getElementById('categoriasRelatorio').innerHTML = categoriasHtml || '<p style="color: #9ca3af;">Sem dados</p>';
}

// ============ MANUTENÇÃO DO VEÍCULO ============

function adicionarManutencao(e) {
    e.preventDefault();
    
    const data = document.getElementById('dataManutencao').value;
    const tipo = document.getElementById('tipoManutencao').value;
    const valor = parseFloat(document.getElementById('valorManutencao').value);
    const quilometragem = parseInt(document.getElementById('quilometragemManutencao').value);
    const descricao = document.getElementById('descricaoManutencao').value;
    
    // Validações
    if (!data || !tipo || isNaN(valor) || valor <= 0 || isNaN(quilometragem) || quilometragem <= 0) {
        alert('❌ Preencha todos os campos corretamente!');
        return;
    }
    
    // Se estamos em modo edição, atualizar; senão, criar novo
    if (maintenanceIdEmEdicao !== null) {
        // Atualizar manutenção existente
        const index = manutencoes.findIndex(m => m.id === maintenanceIdEmEdicao);
        if (index !== -1) {
            manutencoes[index] = {
                id: maintenanceIdEmEdicao,
                data,
                tipo,
                valor,
                quilometragem,
                descricao
            };
            localStorage.setItem('manutencoes', JSON.stringify(manutencoes));
            alert('✅ Manutenção atualizada com sucesso!');
            maintenanceIdEmEdicao = null;
            cancelarEdicaoManutencao();
        }
    } else {
        // Adicionar nova manutenção
        const manutencao = {
            id: Date.now(),
            data,
            tipo,
            valor,
            quilometragem,
            descricao
        };
        
        manutencoes.push(manutencao);
        localStorage.setItem('manutencoes', JSON.stringify(manutencoes));
        alert('✅ Manutenção registrada com sucesso!');
    }
    
    // Limpar form
    document.getElementById('formManutencao').reset();
    document.getElementById('dataManutencao').valueAsDate = new Date();
    atualizarTabelaManuteacoes();
    carregarAlertas();
    loadDashboardData();
    atualizarRelatorios();
}

function deletarManutencao(id) {
    if (confirm('Deletar essa manutenção?')) {
        manutencoes = manutencoes.filter(m => m.id !== id);
        localStorage.setItem('manutencoes', JSON.stringify(manutencoes));
        atualizarTabelaManuteacoes();
        carregarAlertas();
        loadDashboardData();
        atualizarRelatorios();
    }
}

function editarManutencao(id) {
    const manutencao = manutencoes.find(m => m.id === id);
    if (!manutencao) return;
    
    // Preencher formulário
    document.getElementById('dataManutencao').value = manutencao.data;
    document.getElementById('tipoManutencao').value = manutencao.tipo;
    document.getElementById('valorManutencao').value = manutencao.valor;
    document.getElementById('quilometragemManutencao').value = manutencao.quilometragem;
    document.getElementById('descricaoManutencao').value = manutencao.descricao || '';
    
    // Marcar modo edição
    maintenanceIdEmEdicao = id;
    
    // Atualizar botão
    const submitBtn = document.getElementById('formManutencao').querySelector('button[type="submit"]');
    submitBtn.textContent = 'Salvar Alterações';
    submitBtn.style.backgroundColor = '#3b82f6';
    
    // Adicionar botão de cancelamento
    let cancelBtn = document.getElementById('cancelarEditMaintenanceBtn');
    if (!cancelBtn) {
        cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancelarEditMaintenanceBtn';
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn';
        cancelBtn.textContent = 'Cancelar Edição';
        cancelBtn.style.backgroundColor = '#6b7280';
        cancelBtn.style.marginLeft = '10px';
        cancelBtn.onclick = cancelarEdicaoManutencao;
        document.getElementById('formManutencao').appendChild(cancelBtn);
    }
    
    // Scroll para o formulário
    document.getElementById('formManutencao').scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicaoManutencao() {
    maintenanceIdEmEdicao = null;
    document.getElementById('formManutencao').reset();
    document.getElementById('dataManutencao').valueAsDate = new Date();
    
    const submitBtn = document.getElementById('formManutencao').querySelector('button[type="submit"]');
    submitBtn.textContent = 'Registrar Manutenção';
    submitBtn.style.backgroundColor = '';
    
    const cancelBtn = document.getElementById('cancelarEditMaintenanceBtn');
    if (cancelBtn) cancelBtn.remove();
}

function atualizarTabelaManuteacoes() {
    const tbody = document.getElementById('todasManutecoesBody');
    
    if (manutencoes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty">Nenhuma manutenção registrada</td></tr>';
        return;
    }
    
    // Ordenar por data (mais recente primeiro)
    const ordenadas = [...manutencoes].sort((a, b) => 
        new Date(b.data) - new Date(a.data));
    
    tbody.innerHTML = ordenadas.map(m => `
        <tr>
            <td>${new Date(m.data).toLocaleDateString('pt-BR')}</td>
            <td><strong>${m.tipo}</strong></td>
            <td style="color: #ef4444;">R$ ${m.valor.toFixed(2)}</td>
            <td>${m.quilometragem.toLocaleString('pt-BR')} km</td>
            <td>
                <button class="btn btn-warning" onclick="editarManutencao(${m.id})">Editar</button>
                <button class="btn btn-danger" onclick="deletarManutencao(${m.id})">Deletar</button>
            </td>
        </tr>
    `).join('');
}

function verificarManutencoesVencidas() {
    const vencidas = [];
    
    manutencoes.forEach(m => {
        // Considerar vencida se passou 60 dias desde a data registrada
        const dataProxima = new Date(m.data);
        dataProxima.setDate(dataProxima.getDate() + 60);
        
        if (dataProxima < new Date()) {
            vencidas.push(m.tipo);
        }
    });
    
    return vencidas;
}

function carregarAlertas() {
    const vencidas = verificarManutencoesVencidas();
    
    const cardStatus = document.getElementById('statusManutencao');
    const cardProximas = document.getElementById('proximasManutencoes');
    
    if (cardStatus) {
        if (vencidas.length === 0) {
            cardStatus.innerHTML = '<h3>🔧 Status Manutenção</h3><p style="color: #22c55e;">✅ Tudo em dia</p>';
        } else {
            const listaVencidas = vencidas.map(v => `<li style="color: #ef4444; margin-left: 1rem;">⚠️ ${v}</li>`).join('');
            cardStatus.innerHTML = `<h3>🔧 Status Manutenção</h3><p style="color: #ef4444;">⚠️ ${vencidas.length} vencida(s)</p><ul style="list-style: none; padding: 0;">${listaVencidas}</ul>`;
        }
    }
    
    if (cardProximas) {
        const hoje = new Date();
        const proximoMes = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        const proximas = manutencoes.filter(m => {
            const dataProxima = new Date(m.data);
            dataProxima.setDate(dataProxima.getDate() + 60);
            return dataProxima >= hoje && dataProxima <= proximoMes;
        });
        
        if (proximas.length === 0) {
            cardProximas.innerHTML = '<h3>⏰ Próximas Manutenções</h3><p style="color: #22c55e;">Nenhuma próxima</p>';
        } else {
            const listaProximas = proximas.map(p => `<li style="color: #f59e0b; margin-left: 1rem;">📅 ${p.tipo}</li>`).join('');
            cardProximas.innerHTML = `<h3>⏰ Próximas Manutenções</h3><p style="color: #f59e0b;">${proximas.length} próxima(s)</p><ul style="list-style: none; padding: 0;">${listaProximas}</ul>`;
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    // Recarregar dados do localStorage
    sessoes = JSON.parse(localStorage.getItem('sessoes')) || [];
    despesas = JSON.parse(localStorage.getItem('despesas')) || [];
    metaMensal = parseFloat(localStorage.getItem('metaMensal')) || 5000;
    
    // Atualizar tabelas e dashboard
    atualizarTabelaSessoes();
    atualizarTabelaDespesas();
    loadDashboardData();
    generateWeeklyEarningsChart();
    
    // Preencher filtros de ano e atualizar relatórios
    preencherAnosDisponiveis();
    atualizarRelatorios();
});
