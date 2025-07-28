document.addEventListener('DOMContentLoaded', function () {
    const SENHA_CORRETA = "barbeiro123";
    const API_URL = "/api";

    const adminContent = document.getElementById('admin-content');
    const dataBloqueioInput = document.getElementById('data-bloqueio');
    const btnBloquear = document.getElementById('btn-bloquear');
    const btnDesbloquear = document.getElementById('btn-desbloquear');
    const listaDiasEl = document.getElementById('lista-dias-bloqueados');
    const promoTituloInput = document.getElementById('promo-titulo');
    const promoDescricaoInput = document.getElementById('promo-descricao');
    const btnAddPromo = document.getElementById('btn-add-promo');
    const listaPromocoesEl = document.getElementById('lista-promocoes');
    const listaAgendamentosEl = document.getElementById('lista-agendamentos');
    const btnLimparAgendamentos = document.getElementById('btn-limpar-agendamentos');

    const calendarioAdmin = flatpickr(dataBloqueioInput, {
        "locale": "pt", dateFormat: "Y-m-d", minDate: "today"
    });

    const renderizarDiasBloqueados = async () => {
        try {
            const response = await fetch(`${API_URL}/dias-bloqueados`);
            if (!response.ok) throw new Error('Falha ao buscar dias');
            const { data } = await response.json();
            listaDiasEl.innerHTML = '';
            if (!data || data.length === 0) {
                listaDiasEl.innerHTML = '<li>Nenhum dia bloqueado.</li>';
            } else {
                data.sort().forEach(dia => {
                    const [ano, mes, diaNum] = dia.split('-');
                    listaDiasEl.innerHTML += `<li>${diaNum}/${mes}/${ano}</li>`;
                });
            }
        } catch (error) { console.error("Erro ao carregar dias bloqueados:", error); }
    };

    const renderizarAgendamentos = async () => {
        try {
            const response = await fetch(`${API_URL}/agendamentos`);
            if (!response.ok) throw new Error('Falha ao buscar agendamentos');
            const { data } = await response.json();
            listaAgendamentosEl.innerHTML = '';
            if (!data || data.length === 0) {
                listaAgendamentosEl.innerHTML = '<p>Nenhum agendamento recebido.</p>';
            } else {
                const agendamentosOrdenados = data.sort((a, b) => {
                    const dataA = a.data.split('/').reverse().join('-');
                    const dataB = b.data.split('/').reverse().join('-');
                    return dataA.localeCompare(dataB) || a.horario.localeCompare(b.horario);
                });
                agendamentosOrdenados.forEach(ag => {
                    listaAgendamentosEl.innerHTML += `<div class="agendamento"><h4>${ag.nome}</h4><p><strong>Serviço:</strong> ${ag.servico}</p><p><strong>Data:</strong> ${ag.data} às ${ag.horario}</p><p><strong>Contato:</strong> ${ag.telefone}</p></div>`;
                });
            }
        } catch (error) { console.error("Erro ao carregar agendamentos:", error); }
    };

    const renderizarPromocoes = async () => {
        try {
            const response = await fetch(`${API_URL}/promocoes`);
            if (!response.ok) throw new Error('Falha ao buscar promoções');
            const { data } = await response.json();
            listaPromocoesEl.innerHTML = '';
            if (!data || data.length === 0) {
                listaPromocoesEl.innerHTML = '<p>Nenhuma promoção ativa no momento.</p>';
            } else {
                data.forEach(promo => {
                    listaPromocoesEl.innerHTML += `<div class="item-promo"><div><h4>${promo.titulo}</h4><p>${promo.descricao}</p></div><button class="btn-delete-promo" data-id="${promo.id}" title="Excluir promoção">&times;</button></div>`;
                });
            }
        } catch (error) { console.error("Erro ao carregar promoções:", error); }
    };

    btnBloquear.addEventListener('click', async () => {
        const data = dataBloqueioInput.value;
        if (!data) { alert('Por favor, selecione uma data.'); return; }
        await fetch(`${API_URL}/dias-bloqueados`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) });
        renderizarDiasBloqueados();
        calendarioAdmin.clear();
    });

    btnDesbloquear.addEventListener('click', async () => {
        const data = dataBloqueioInput.value;
        if (!data) { alert('Por favor, selecione uma data.'); return; }
        await fetch(`${API_URL}/dias-bloqueados/${data}`, { method: 'DELETE' });
        renderizarDiasBloqueados();
        calendarioAdmin.clear();
    });

    btnAddPromo.addEventListener('click', async () => {
        const titulo = promoTituloInput.value.trim();
        const descricao = promoDescricaoInput.value.trim();
        if (!titulo || !descricao) { alert('Preencha os dois campos da promoção.'); return; }
        await fetch(`${API_URL}/promocoes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ titulo, descricao }) });
        promoTituloInput.value = '';
        promoDescricaoInput.value = '';
        renderizarPromocoes();
    });

    listaPromocoesEl.addEventListener('click', async (event) => {
        if (event.target.classList.contains('btn-delete-promo')) {
            if (confirm('Tem certeza que deseja excluir esta promoção?')) {
                const promoId = event.target.getAttribute('data-id');
                await fetch(`${API_URL}/promocoes/${promoId}`, { method: 'DELETE' });
                renderizarPromocoes();
            }
        }
    });

    btnLimparAgendamentos.addEventListener('click', async () => {
        if (confirm('Tem certeza que deseja apagar TODOS os agendamentos?')) {
            await fetch(`${API_URL}/agendamentos/all`, { method: 'DELETE' });
            renderizarAgendamentos();
            alert('Agendamentos limpos com sucesso.');
        }
    });

    const verificarAcesso = async () => {
        const senhaDigitada = prompt("Digite a senha de administrador:");
        if (senhaDigitada === SENHA_CORRETA) {
            adminContent.classList.remove('hidden');
            await Promise.all([
                renderizarDiasBloqueados(),
                renderizarAgendamentos(),
                renderizarPromocoes()
            ]);
        } else {
            alert("Senha incorreta.");
            document.body.innerHTML = '<h1>ACESSO NEGADO</h1>';
        }
    };

    verificarAcesso();
});