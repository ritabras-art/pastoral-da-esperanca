// ===== SUPABASE CONFIG =====
const SUPABASE_URL = 'https://lwwokbownpdcmwptmnrs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3d29rYm93bnBkY213cHRtbnJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMTIwOTYsImV4cCI6MjA5MDg4ODA5Nn0.b8tHJUQAg1AiZW20Fj9lythhh7bikyxobyoN7ZSlhm0';

let sb = null;
try {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
    console.error('Erro ao conectar com Supabase:', e);
}
var db = sb;

// ===== STATE =====
const state = {
    currentModule: 'home',
    completedModules: [],
    quizAnswers: {},
    user: null
};

const modules = ['modulo1','modulo2','modulo3','modulo4','modulo5','modulo6','modulo7','modulo8','modulo9','modulo10'];

// ===== AUTH =====
function showLogin(e) {
    if (e) e.preventDefault();
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    clearAuthErrors();
}

function showRegister(e) {
    if (e) e.preventDefault();
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
    clearAuthErrors();
}

function clearAuthErrors() {
    document.querySelectorAll('.auth-error, .auth-success').forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
    });
}

function showAuthError(formId, message) {
    const el = document.getElementById(formId);
    el.textContent = message;
    el.style.display = 'block';
}

async function handleLogin(e) {
    e.preventDefault();
    clearAuthErrors();

    var email = document.getElementById('loginEmail').value.trim();
    var password = document.getElementById('loginPassword').value;
    var btn = document.getElementById('loginBtn');

    if (!db) {
        showAuthError('loginError', 'Erro de conexao com o servidor. Recarregue a pagina.');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Entrando...';

    try {
        var result = await db.auth.signInWithPassword({ email: email, password: password });

        btn.disabled = false;
        btn.textContent = 'Entrar';

        if (result.error) {
            var msg = 'Erro ao entrar: ' + result.error.message;
            if (result.error.message.includes('Invalid login')) msg = 'E-mail ou senha incorretos.';
            if (result.error.message.includes('Email not confirmed')) msg = 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.';
            showAuthError('loginError', msg);
            return;
        }

        await enterApp(result.data.user);
    } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Entrar';
        showAuthError('loginError', 'Erro inesperado: ' + err.message);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    clearAuthErrors();

    var name = document.getElementById('regName').value.trim();
    var parish = document.getElementById('regParish').value.trim();
    var email = document.getElementById('regEmail').value.trim();
    var password = document.getElementById('regPassword').value;
    var btn = document.getElementById('regBtn');

    if (name.length < 3) {
        showAuthError('registerError', 'Digite seu nome completo.');
        return;
    }

    if (!db) {
        showAuthError('registerError', 'Erro de conexao com o servidor. Recarregue a pagina.');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Criando conta...';

    try {
        var result = await db.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { full_name: name, parish: parish }
            }
        });

        btn.disabled = false;
        btn.textContent = 'Criar Conta';

        if (result.error) {
            var msg = 'Erro ao criar conta: ' + result.error.message;
            if (result.error.message.includes('already registered')) msg = 'Este e-mail ja esta cadastrado. Tente fazer login.';
            showAuthError('registerError', msg);
            return;
        }

        // Update parish if provided
        if (parish && result.data && result.data.user) {
            await db.from('profiles').update({ parish: parish, full_name: name }).eq('id', result.data.user.id);
        }

        // Check if email confirmation is required
        if (result.data && result.data.user && !result.data.session) {
            var el = document.getElementById('registerSuccess');
            el.textContent = 'Conta criada com sucesso! Verifique seu e-mail para confirmar o cadastro.';
            el.style.display = 'block';
        } else if (result.data && result.data.session) {
            await enterApp(result.data.user);
        }
    } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Criar Conta';
        showAuthError('registerError', 'Erro inesperado: ' + err.message);
    }
}

async function handleLogout() {
    await db.auth.signOut();
    state.user = null;
    state.completedModules = [];
    showAuthScreen();
}

function showAuthScreen() {
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('appHeader').classList.add('hidden');
    document.getElementById('sidebar').classList.add('hidden');
    document.getElementById('mainContent').classList.add('hidden');
    document.getElementById('appFooter').classList.add('hidden');
}

function showApp() {
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('appHeader').classList.remove('hidden');
    document.getElementById('sidebar').classList.remove('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
    document.getElementById('appFooter').classList.remove('hidden');
}

async function enterApp(user) {
    state.user = user;

    // Get profile
    const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single();

    const displayName = profile?.full_name || user.user_metadata?.full_name || user.email;
    document.getElementById('userName').textContent = displayName;

    // Load progress from Supabase
    const { data: progress } = await db.from('module_progress').select('module_id').eq('user_id', user.id);

    state.completedModules = progress ? progress.map(p => p.module_id) : [];

    showApp();
    updateProgress();
    navigateTo('home');
}

// ===== NAVIGATION =====
function navigateTo(moduleId) {
    document.querySelectorAll('.module').forEach(m => m.classList.add('hidden'));

    const target = document.getElementById(moduleId);
    if (target) {
        target.classList.remove('hidden');
        state.currentModule = moduleId;

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.module === moduleId) {
                link.classList.add('active');
            }
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });
        closeSidebar();

        if (moduleId === 'quiz') {
            initQuiz();
        }
    }
}

async function completeModule(moduleId) {
    if (!state.completedModules.includes(moduleId)) {
        state.completedModules.push(moduleId);

        // Save to Supabase
        if (state.user) {
            await db.from('module_progress').upsert({
                user_id: state.user.id,
                module_id: moduleId
            }, { onConflict: 'user_id,module_id' });
        }
    }
    updateProgress();

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

    document.querySelectorAll('.nav-link').forEach(link => {
        const mod = link.dataset.module;
        if (state.completedModules.includes(mod)) {
            link.classList.add('completed');
        } else {
            link.classList.remove('completed');
        }
    });
}

// ===== SIDEBAR =====
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
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
            navigateTo(link.dataset.module);
        });
    });

    // Accordion
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const isOpen = item.classList.contains('open');
            item.parentElement.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
            if (!isOpen) item.classList.add('open');
        });
    });

    // Check existing session
    if (db) {
        try {
            var sessionResult = await db.auth.getSession();
            var session = sessionResult.data.session;
            if (session) {
                await enterApp(session.user);
            } else {
                showAuthScreen();
            }
        } catch (e) {
            console.error('Erro ao verificar sessao:', e);
            showAuthScreen();
        }
    } else {
        showAuthScreen();
    }
});

// ===== QUIZ =====
const quizQuestions = [
    {
        q: "O que significa a palavra 'animar', raiz da missao da Pastoral da Esperanca?",
        options: [
            "Fazer festa e divertir as pessoas",
            "Dar alento a alma (do latim 'anima' = alma)",
            "Organizar eventos na paroquia",
            "Cantar e tocar musicas alegres"
        ],
        correct: 1
    },
    {
        q: "Qual e o elemento essencial que a Pastoral da Esperanca deve levar?",
        options: [
            "Flores e presentes para a familia",
            "Dinheiro para ajudar nas despesas",
            "Esperanca, sobretudo na ressurreicao",
            "Comida e bebida para o velorio"
        ],
        correct: 2
    },
    {
        q: "A atuacao da Pastoral da Esperanca se limita ao velorio?",
        options: [
            "Sim, apenas durante o velorio",
            "Sim, no velorio e no sepultamento",
            "Nao, vai desde a prevencao ate a elaboracao do luto",
            "Nao, mas apenas ate a missa de 7o dia"
        ],
        correct: 2
    },
    {
        q: "Quantas pessoas sao necessarias para iniciar a Pastoral da Esperanca?",
        options: [
            "No minimo 10 pessoas",
            "Apenas o padre e suficiente",
            "Com 3 ou 4 pessoas ja da para comecar",
            "E preciso ter pelo menos 20 voluntarios"
        ],
        correct: 2
    },
    {
        q: "Qual deve ser a postura da pastoral em relacao a dependencia do padre?",
        options: [
            "Toda acao deve ter a presenca obrigatoria do padre",
            "Trabalhar com ou sem a presenca do padre, mantendo-o informado",
            "O padre nao deve saber das acoes da pastoral",
            "So atuar quando o padre mandar"
        ],
        correct: 1
    },
    {
        q: "Quais sao as tres dimensoes da formacao dos agentes?",
        options: [
            "Musical, artistica e esportiva",
            "Teorica, pratica e espiritual",
            "Financeira, administrativa e juridica",
            "Liturgica, catequetica e social"
        ],
        correct: 1
    },
    {
        q: "Sobre a vestimenta do agente, qual e a orientacao correta?",
        options: [
            "Pode ir com qualquer roupa",
            "Deve usar roupa preta obrigatoriamente",
            "Vestir-se adequadamente, com veste propria da pastoral",
            "Nao ha orientacao sobre vestimenta"
        ],
        correct: 2
    },
    {
        q: "O que fazer se oferecerem dinheiro ao agente pelos seus servicos?",
        options: [
            "Aceitar normalmente",
            "Aceitar e dividir com a equipe",
            "Recusar e sugerir doacao a paroquia",
            "Aceitar apenas se for pouco"
        ],
        correct: 2
    },
    {
        q: "Antes de fazer uma celebracao de exequias no velorio, o que se deve fazer primeiro?",
        options: [
            "Comecar imediatamente a oracao",
            "Consultar a familia se deseja a presenca da Igreja Catolica",
            "Distribuir panfletos da paroquia",
            "Criticar outras religioes presentes"
        ],
        correct: 1
    },
    {
        q: "Qual e a postura correta se houver lider de outra denominacao religiosa no velorio?",
        options: [
            "Ignora-lo completamente",
            "Pedir que ele se retire",
            "Convida-lo respeitosamente para participar da celebracao",
            "Fazer uma pregacao contra sua religiao"
        ],
        correct: 2
    },
    {
        q: "Quais sao os quatro ritos da celebracao de exequias?",
        options: [
            "Entrada, Homilia, Comunhao e Saida",
            "Ritos Iniciais, Rito da Palavra, Rito de Encomendacao e Rito Final",
            "Acolhida, Canto, Oracao e Despedida",
            "Leitura, Reflexao, Oracao e Bencao"
        ],
        correct: 1
    },
    {
        q: "O que significa a palavra 'missa' em latim?",
        options: [
            "Sacrificio",
            "Celebracao",
            "Despedida",
            "Encontro"
        ],
        correct: 2
    },
    {
        q: "Por que a missa e celebrada no 7o dia apos a morte?",
        options: [
            "Por motivos praticos apenas",
            "Porque o numero 7 na Biblia simboliza plenitude e completude",
            "Por decisao do Vaticano II",
            "Nao ha razao especifica"
        ],
        correct: 1
    },
    {
        q: "Sobre a cremacao, qual e a posicao da Igreja Catolica?",
        options: [
            "Proibe totalmente a cremacao",
            "Permite, desde que nao manifeste posicao contraria a fe na ressurreicao",
            "So permite em casos excepcionais",
            "Nao tem posicao sobre o assunto"
        ],
        correct: 1
    },
    {
        q: "Qual e a atitude correta quando uma pessoa enlutada diz que 'Deus castigou' a familia?",
        options: [
            "Concordar para nao contrariar",
            "Dizer que ela esta errada de forma direta",
            "Mostrar com delicadeza que Deus nao pune nem castiga, e que Ele quer a vida",
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

    const options = document.querySelectorAll(`[data-question="${questionIdx}"]`);
    options.forEach(opt => {
        opt.classList.remove('selected');
        if (parseInt(opt.dataset.option) === optionIdx) {
            opt.classList.add('selected');
        }
    });
}

async function submitQuiz() {
    const total = quizQuestions.length;
    const answeredCount = Object.keys(state.quizAnswers).length;

    if (answeredCount < total) {
        alert('Por favor, responda todas as ' + total + ' questoes antes de enviar. Voce respondeu ' + answeredCount + ' de ' + total + '.');
        return;
    }

    let score = 0;

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

    // Save to Supabase
    if (state.user) {
        await db.from('quiz_results').insert({
            user_id: state.user.id,
            score: score,
            total: total,
            answers: state.quizAnswers
        });
    }

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
    results.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function restartQuiz() {
    initQuiz();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
