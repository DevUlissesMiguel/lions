document.addEventListener('DOMContentLoaded', function () {
    const API_URL = "/api";

    const welcomeScreen = document.getElementById('welcome-screen');
    const bookingScreen = document.getElementById('booking-screen');
    const showBookingBtn = document.getElementById('btn-show-booking');
    const dataInput = document.getElementById('data');
    const form = document.getElementById('agendamento-form');

    if (showBookingBtn) {
        showBookingBtn.addEventListener('click', () => {
            welcomeScreen.classList.add('hidden');
            bookingScreen.classList.remove('hidden');
            bookingScreen.scrollIntoView({ behavior: 'smooth' });
        });
    }

    const carregarPromocoesCliente = async () => {
        try {
            const response = await fetch(`${API_URL}/promocoes`);
            if (!response.ok) throw new Error('Falha ao buscar promoções');
            const { data } = await response.json();
            const container = document.getElementById('promocoes-destaque');

            if (data && data.length > 0) {
                let htmlPromocoes = '<h3>✨ Promoções da Semana ✨</h3>';
                data.forEach(promo => {
                    htmlPromocoes += `<div class="item-promo-cliente"><h4>${promo.titulo}</h4><p>${promo.descricao}</p></div>`;
                });
                container.innerHTML = htmlPromocoes;
            }
        } catch (error) {
            console.error('Erro ao carregar promoções:', error);
        }
    };

    const setupCalendario = async () => {
        let diasBloqueados = [];
        try {
            const response = await fetch(`${API_URL}/dias-bloqueados`);
            if (response.ok) {
                const { data } = await response.json();
                diasBloqueados = data || [];
            } else {
                console.error('Falha ao buscar dias bloqueados, o calendário funcionará sem eles.');
            }
        } catch (error) {
            console.error('Erro na requisição de dias bloqueados:', error);
        }

        if (dataInput) {
            flatpickr(dataInput, {
                "locale": "pt",
                dateFormat: "d/m/Y",
                minDate: "today",
                disable: [
                    function (date) {
                        if (date.getDay() === 0) { return true; }
                        const diaFormatado = date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2);
                        return diasBloqueados.includes(diaFormatado);
                    }
                ]
            });
        }
    };

    carregarPromocoesCliente();
    setupCalendario();

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const servicoSelecionado = form.querySelector('input[name="servico"]:checked');
            const dataValor = form.querySelector('#data').value;
            const horarioValor = form.querySelector('#horario').value;
            const nomeValor = form.querySelector('#nome').value;
            const telefoneValor = form.querySelector('#telefone').value;

            if (!servicoSelecionado || !dataValor || !horarioValor || !nomeValor || !telefoneValor) {
                alert('Por favor, preencha todos os campos para continuar.');
                return;
            }

            const novoAgendamento = {
                nome: nomeValor, telefone: telefoneValor, servico: servicoSelecionado.value,
                data: dataValor, horario: horarioValor
            };

            try {
                const response = await fetch(`${API_URL}/agendamentos`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(novoAgendamento)
                });
                if (!response.ok) throw new Error('Falha ao criar agendamento.');
                alert(`Obrigado, ${nomeValor}! Seu agendamento foi realizado com sucesso.`);
                form.reset();
                if (dataInput && dataInput._flatpickr) dataInput._flatpickr.clear();
                document.querySelectorAll('.servico-opcao').forEach(el => el.removeAttribute('has-checked'));
            } catch (error) {
                console.error('Erro ao enviar agendamento:', error);
                alert('Houve um erro ao tentar realizar seu agendamento. Por favor, tente novamente.');
            }
        });
    }

    const radios = document.querySelectorAll('input[name="servico"]');
    if (radios) {
        radios.forEach(radio => {
            radio.addEventListener('change', () => {
                document.querySelectorAll('.servico-opcao').forEach(el => el.removeAttribute('has-checked'));
                if (radio.checked) radio.parentElement.setAttribute('has-checked', 'true');
            });
        });
    }
});