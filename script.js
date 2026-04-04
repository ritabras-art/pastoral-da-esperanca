// ===== STATE =====
const state = {
    currentModule: 'home',
    completedModules: JSON.parse(localStorage.getItem('pe_completed') || '[]'),
    quizAnswers: {}
};

const modules = ['modulo1','modulo2','modulo3','modulo4','modulo5','modulo6','modulo7','modulo8','modulo9','modulo10'];

// ===== NAVIGATION =====
function navigateTo(moduleId) {
    // Hide all modules
    document.querySelectorAll('.module').forEach(m => m.classList.add('hidden'));

    // Show target
    const target = document.getElementById(moduleId);
    if (target) {
        target.classList.remove('hidden');
        state.currentModule = moduleId;

        // Update nav
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.module === moduleId) {
                link.classList.add('active');
            }
        });

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Close mobile sidebar
        closeSidebar();

        // Initialize quiz if needed
        if (moduleId === 'quiz') {
            initQuiz();
        }
    }
}

function completeModule(moduleId) {
    if (!state.completedModules.includes(moduleId)) {
        state.completedModules.push(moduleId);
        localStorage.setItem('pe_completed', JSON.stringify(state.completedModules));
    }
    updateProgress();

    // Navigate to next module
    const idx = modules.indexOf(moduleId);
    if (idx < modules.length - 1) {
        navigateTo(modules[idx + 1]);
    } else {
        navigateTo('quiz');
    }
}

function updateProgress() {
    const total = modules.length;
    const completed = state.completedModules.length;
    const pct = Math.round((completed / total) * 100);

    const fill = document.getElementById('globalProgress');
    const text = document.getElementById('progressText');
    if (fill) fill.style.width = pct + '%';
    if (text) text.textContent = pct + '% concluido (' + completed + '/' + total + ')';

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        const mod = link.dataset.module;
        if (state.completedModules.includes(mod)) {
            link.classList.add('completed');
        }
    });
}

// ===== SIDEBAR =====
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
    // Menu toggle
    const menuBtn = document.querySelector('.menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }

    // Nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const moduleId = link.dataset.module;
            navigateTo(moduleId);
        });
    });

    // Accordion
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const isOpen = item.classList.contains('open');
            // Close others in same accordion
            item.parentElement.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
            if (!isOpen) item.classList.add('open');
        });
    });

    // Update progress on load
    updateProgress();
});

// ===== QUIZ =====
const quizQuestions = [
    {
        q: "O que significa a palavra 'animar', raiz da missão da Pastoral da Esperança?",
        options: [
            "Fazer festa e divertir as pessoas",
            "Dar alento à alma (do latim 'anima' = alma)",
            "Organizar eventos na paróquia",
            "Cantar e tocar músicas alegres"
        ],
        correct: 1
    },
    {
        q: "Qual é o elemento essencial que a Pastoral da Esperança deve levar?",
        options: [
            "Flores e presentes para a família",
            "Dinheiro para ajudar nas despesas",
            "Esperança, sobretudo na ressurreição",
            "Comida e bebida para o velório"
        ],
        correct: 2
    },
    {
        q: "A atuação da Pastoral da Esperança se limita ao velório?",
        options: [
            "Sim, apenas durante o velório",
            "Sim, no velório e no sepultamento",
            "Não, vai desde a prevenção até a elaboração do luto",
            "Não, mas apenas até a missa de 7º dia"
        ],
        correct: 2
    },
    {
        q: "Quantas pessoas são necessárias para iniciar a Pastoral da Esperança?",
        options: [
            "No mínimo 10 pessoas",
            "Apenas o padre é suficiente",
            "Com 3 ou 4 pessoas já dá para começar",
            "É preciso ter pelo menos 20 voluntários"
        ],
        correct: 2
    },
    {
        q: "Qual deve ser a postura da pastoral em relação à dependência do padre?",
        options: [
            "Toda ação deve ter a presença obrigatória do padre",
            "Trabalhar com ou sem a presença do padre, mantendo-o informado",
            "O padre não deve saber das ações da pastoral",
            "Só atuar quando o padre mandar"
        ],
        correct: 1
    },
    {
        q: "Quais são as três dimensões da formação dos agentes?",
        options: [
            "Musical, artística e esportiva",
            "Teórica, prática e espiritual",
            "Financeira, administrativa e jurídica",
            "Litúrgica, catequética e social"
        ],
        correct: 1
    },
    {
        q: "Sobre a vestimenta do agente, qual é a orientação correta?",
        options: [
            "Pode ir com qualquer roupa",
            "Deve usar roupa preta obrigatoriamente",
            "Vestir-se adequadamente, de acordo com o ambiente, de preferência com veste própria da pastoral",
            "Não há orientação sobre vestimenta"
        ],
        correct: 2
    },
    {
        q: "O que fazer se oferecerem dinheiro ao agente pelos seus serviços?",
        options: [
            "Aceitar normalmente",
            "Aceitar e dividir com a equipe",
            "Recusar e sugerir doação à paróquia",
            "Aceitar apenas se for pouco"
        ],
        correct: 2
    },
    {
        q: "Antes de fazer uma celebração de exéquias no velório, o que se deve fazer primeiro?",
        options: [
            "Começar imediatamente a oração",
            "Consultar a família se deseja a presença da Igreja Católica",
            "Distribuir panfletos da paróquia",
            "Criticar outras religiões presentes"
        ],
        correct: 1
    },
    {
        q: "Qual é a postura correta se houver líder de outra denominação religiosa no velório?",
        options: [
            "Ignorá-lo completamente",
            "Pedir que ele se retire",
            "Convidá-lo respeitosamente para participar da celebração",
            "Fazer uma pregação contra sua religião"
        ],
        correct: 2
    },
    {
        q: "Quais são os quatro ritos da celebração de exéquias?",
        options: [
            "Entrada, Homilia, Comunhão e Saída",
            "Ritos Iniciais, Rito da Palavra, Rito de Encomendação e Rito Final",
            "Acolhida, Canto, Oração e Despedida",
            "Leitura, Reflexão, Oração e Bênção"
        ],
        correct: 1
    },
    {
        q: "O que significa a palavra 'missa' em latim?",
        options: [
            "Sacrifício",
            "Celebração",
            "Despedida",
            "Encontro"
        ],
        correct: 2
    },
    {
        q: "Por que a missa é celebrada no 7º dia após a morte?",
        options: [
            "Por motivos práticos apenas",
            "Porque o número 7 na Bíblia simboliza plenitude e completude — Deus descansou no 7º dia",
            "Por decisão do Vaticano II",
            "Não há razão específica"
        ],
        correct: 1
    },
    {
        q: "Sobre a cremação, qual é a posição da Igreja Católica?",
        options: [
            "Proíbe totalmente a cremação",
            "Permite, desde que não manifeste posição contrária à fé na ressurreição",
            "Só permite em casos excepcionais",
            "Não tem posição sobre o assunto"
        ],
        correct: 1
    },
    {
        q: "Qual é a atitude correta quando uma pessoa enlutada diz que 'Deus castigou' a família?",
        options: [
            "Concordar para não contrariar",
            "Dizer que ela está errada de forma direta",
            "Mostrar com delicadeza que Deus não pune nem castiga, e que Ele quer a vida",
            "Mudar de assunto"
        ],
        correct: 2
    }
];

function initQuiz() {
    const container = document.getElementById('quizContainer');
    const results = document.getElementById('quizResults');

    if (!container) return;

    results.classList.add('hidden');
    container.classList.remove('hidden');
    state.quizAnswers = {};

    let html = '';
    quizQuestions.forEach((q, i) => {
        html += `
            <div class="quiz-question" id="question${i}">
                <h4><span class="question-num">${i+1}.</span> ${q.q}</h4>
                <div class="quiz-options">
                    ${q.options.map((opt, j) => `
                        <label class="quiz-option" data-question="${i}" data-option="${j}" onclick="selectOption(${i}, ${j})">
                            <span class="option-marker">${String.fromCharCode(65+j)}</span>
                            <span>${opt}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    });

    html += '<button class="quiz-submit" onclick="submitQuiz()">Enviar Respostas</button>';
    container.innerHTML = html;
}

function selectOption(questionIdx, optionIdx) {
    state.quizAnswers[questionIdx] = optionIdx;

    // Update visuals
    const options = document.querySelectorAll(`[data-question="${questionIdx}"]`);
    options.forEach(opt => {
        opt.classList.remove('selected');
        if (parseInt(opt.dataset.option) === optionIdx) {
            opt.classList.add('selected');
        }
    });
}

function submitQuiz() {
    const total = quizQuestions.length;
    const answeredCount = Object.keys(state.quizAnswers).length;

    if (answeredCount < total) {
        alert(`Por favor, responda todas as ${total} questoes antes de enviar. Voce respondeu ${answeredCount} de ${total}.`);
        return;
    }

    let score = 0;

    // Show correct/incorrect
    quizQuestions.forEach((q, i) => {
        const options = document.querySelectorAll(`[data-question="${i}"]`);
        options.forEach(opt => {
            const optIdx = parseInt(opt.dataset.option);
            opt.style.pointerEvents = 'none';

            if (optIdx === q.correct) {
                opt.classList.add('correct');
            }
            if (state.quizAnswers[i] === optIdx && optIdx !== q.correct) {
                opt.classList.add('incorrect');
            }
        });

        if (state.quizAnswers[i] === q.correct) {
            score++;
        }
    });

    // Hide submit button
    document.querySelector('.quiz-submit').style.display = 'none';

    // Show results
    const results = document.getElementById('quizResults');
    results.classList.remove('hidden');

    document.getElementById('scoreNumber').textContent = score;

    const pct = Math.round((score / total) * 100);
    let message = '';

    if (pct >= 90) {
        message = 'Excelente! Voce esta muito bem preparado(a) para atuar na Pastoral da Esperanca!';
    } else if (pct >= 70) {
        message = 'Muito bom! Revise os modulos onde teve dificuldade para se preparar ainda melhor.';
    } else if (pct >= 50) {
        message = 'Bom esforco! Recomendamos revisar os modulos antes de iniciar a atuacao pastoral.';
    } else {
        message = 'Recomendamos estudar novamente todos os modulos antes de atuar na pastoral.';
    }

    document.getElementById('scoreMessage').textContent = message;

    // Scroll to results
    results.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function restartQuiz() {
    initQuiz();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
