// --- Início da Configuração do Pyodide ---
let pyodide;
let pyodideReady = false;

async function initializePyodide() {
    console.log("Carregando Pyodide...");
    pyodide = await loadPyodide();
    pyodideReady = true;
    console.log("Pyodide pronto para uso.");
}

initializePyodide();

async function runPythonCode(code, outputId) {
    const output = document.getElementById(outputId);
    if (!pyodideReady) {
        output.textContent = "Aguarde, o ambiente Python está carregando...";
        return;
    }
    output.textContent = "Executando código Python...";
    try {
        await pyodide.loadPackagesFromImports(code);
        // Redireciona a saída do Python para que possamos capturá-la
        pyodide.runPython(`
            import sys
            import io
            sys.stdout = io.StringIO()
        `);
        await pyodide.runPythonAsync(code);
        const stdout = pyodide.runPython("sys.stdout.getvalue()");
        output.textContent = stdout ? stdout.trim() : "Código executado sem saída (use print() para ver algo).";
    } catch (err) {
        output.textContent = `Erro: ${err}`;
    } finally {
        // Marca a atividade como concluída após a execução
        const activityContainer = output.closest('.trackable-activity');
        if (activityContainer && !activityContainer.classList.contains('completed')) {
            activityContainer.classList.add('completed');
            checkStepCompletion(currentStep);
        }
        // Restaura a saída padrão para o console do navegador
        if (pyodideReady) {
            pyodide.runPython("sys.stdout = sys.__stdout__");
        }
    }
}
// --- Fim da Configuração do Pyodide ---

// --- Lógica do Glossário ---
const glossaryToggle = document.getElementById('glossary-toggle');
const glossaryModal = document.getElementById('glossary-modal-overlay');
const glossaryCloseBtn = document.querySelector('.glossary-modal-close-btn');

if (glossaryToggle && glossaryModal) {
    glossaryToggle.addEventListener('click', () => {
        glossaryModal.style.display = 'flex';
    });
}

if (glossaryCloseBtn) {
    glossaryCloseBtn.addEventListener('click', () => {
        glossaryModal.style.display = 'none';
    });
}
if (glossaryModal) {
    glossaryModal.addEventListener('click', (e) => {
        if (e.target === glossaryModal) glossaryModal.style.display = 'none';
    });
}

// Controle de navegação entre etapas
let currentStep = 1;
const totalSteps = 17; 

function saveAndNotifyProgress(stepNumber) {
    // Salva o progresso no localStorage. Desbloqueia a PRÓXIMA etapa.
    const unlockedStep = stepNumber + 1;
    localStorage.setItem('unlockedStep', unlockedStep);

    // Envia uma mensagem para a página pai (o mapa) para que ela saiba do progresso
    // Progresso reativado!
    if (window.parent) {
        window.parent.postMessage({
            type: 'UPDATE_PROGRESS',
            unlockedStep: unlockedStep
        }, '*'); // Em produção, use a URL exata da página do mapa no lugar de '*'
    }
}

function showStep(stepNumber) {
    const currentActiveStep = document.querySelector('.step.active');
    const newStep = document.getElementById(`step-${stepNumber}`);

    if (currentActiveStep) {
        currentActiveStep.classList.remove('active');
    }
    if (newStep) {
        newStep.classList.add('active');
    }

    currentStep = stepNumber;

    // Salva o progresso sempre que uma nova etapa é exibida
    saveAndNotifyProgress(stepNumber);
}

/**
 * Verifica se todas as atividades de uma etapa foram concluídas.
 * Se sim, dispara um evento 'step:completed'.
 * @param {number} stepNumber - O número da etapa a ser verificada.
 */
function checkStepCompletion(stepNumber) {
    const stepElement = document.getElementById(`step-${stepNumber}`);
    if (!stepElement) return;

    const totalActivities = parseInt(stepElement.dataset.totalActivities || '0');
    
    // Se a etapa não tem atividades, consideramos completa por padrão.
    if (totalActivities === 0) {
        stepElement.dispatchEvent(new CustomEvent('step:completed', { detail: { step: stepNumber } }));
        return;
    }

    const completedActivities = stepElement.querySelectorAll('.trackable-activity.completed').length;

    if (completedActivities >= totalActivities) {
        // Dispara um evento para indicar que a etapa foi concluída.
        stepElement.dispatchEvent(new CustomEvent('step:completed', { detail: { step: stepNumber } }));
    }
}

// Lógica para alternar o tema (Dark/Light Mode)
const themeToggle = document.getElementById('theme-toggle');

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    
    // Salvar a preferência no localStorage
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Verificar se há um tema salvo no localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }

    // Lógica para o formulário da Etapa 1
    const studentForm = document.getElementById('student-info-form');
    if (studentForm) {
        studentForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Impede o envio padrão

            // Coletar dados do formulário
            const name = document.getElementById('form-student-name').value;
            const age = document.getElementById('student-age').value;
            const experienceLevel = document.querySelector('input[name="experience-level"]:checked').value;
            const interestArea = document.querySelector('input[name="interest-area"]:checked').value;

            // Criar objeto JSON
            const studentData = {
                name: name,
                age: parseInt(age),
                experienceLevel: experienceLevel,
                interestArea: interestArea
            };

            // Armazena os dados do aluno no localStorage para uso posterior
            localStorage.setItem('studentData', JSON.stringify(studentData));
            console.log('Dados do Aluno salvos no localStorage:', JSON.stringify(studentData));

            // Feedback para o usuário
            const feedbackElement = document.getElementById('form-feedback');
            feedbackElement.textContent = '✅ Suas respostas foram salvas! Agora pode avançar.';
            feedbackElement.className = 'feedback correct';
            feedbackElement.style.display = 'block';

            // Marcar a atividade como completa (para habilitar o botão)
            const activityContainer = this.closest('.trackable-activity');
            if (activityContainer && !activityContainer.classList.contains('completed')) {
                activityContainer.classList.add('completed');
                checkStepCompletion(currentStep);
            }
        });
    }

    // Verifica se a página foi carregada através de uma âncora (ex: #step-5)
    const hash = window.location.hash;
    if (hash) {
        const stepFromHash = parseInt(hash.replace('#step-', ''));
        if (!isNaN(stepFromHash) && stepFromHash > 0 && stepFromHash <= totalSteps) {
            showStep(stepFromHash);
            // Adicionado para verificar a conclusão ao carregar diretamente uma etapa
            checkStepCompletion(stepFromHash);
        }

    } else {
        // Se não houver hash, verifique a conclusão da primeira etapa
        checkStepCompletion(1);
    }

    // Listener centralizado para o evento de conclusão de etapa
    document.querySelectorAll('.step').forEach(step => {
        step.addEventListener('step:completed', (e) => {
            const stepNumber = e.detail.step;
            const stepElement = document.getElementById(`step-${stepNumber}`);
            const unlockBtn = stepElement.querySelector('.btn-unlock-next');
            if (unlockBtn) unlockBtn.disabled = false;
        });
    });

    // Garante que a lógica do exercício de associação da Etapa 4 seja carregada
    setupMatchingExercise('matching-exercise-1');
});

// Configurar quizzes
document.querySelectorAll('.quiz-option').forEach(option => {
    option.addEventListener('click', function() {
        const parent = this.parentElement;
        const quizContainer = this.closest('.quiz-container');
        const feedback = parent.nextElementSibling;
        
        // Remover seleções anteriores
        parent.querySelectorAll('.quiz-option').forEach(opt => {
            opt.classList.remove('selected', 'correct', 'incorrect');
        });
        
        // Marcar esta opção como selecionada
        this.classList.add('selected');
        
        // Verificar se está correta
        if (this.getAttribute('data-correct') === 'true') {
            this.classList.add('correct');
            feedback.textContent = '✅ Correto!';
            feedback.className = 'feedback correct';
            if (quizContainer && !quizContainer.classList.contains('completed')) {
                quizContainer.classList.add('completed');
                checkStepCompletion(currentStep);
            }
        } else {
            this.classList.add('incorrect');
            feedback.textContent = '❌ Tente novamente!';
            feedback.className = 'feedback incorrect';
            
            // Mostrar a resposta correta
            const correctOptions = parent.querySelectorAll('[data-correct="true"]');
            correctOptions.forEach(opt => {
                opt.classList.add('correct');
            });
        }
        
        feedback.style.display = 'block';
    });
});

// Configurar botões para revelar quizzes
document.querySelectorAll('.btn-reveal').forEach(button => {
    button.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.style.display = 'block';
            this.style.display = 'none'; // Esconde o botão após o clique
        }
    });
});

function runInteractiveCode(codeId, outputId) {
    const code = document.getElementById(codeId).value;
    const output = document.getElementById(outputId);
    
    // Extrai a pergunta do input()
    const questionMatch = code.match(/input\("([^"]+)"\)/);
    const question = questionMatch ? questionMatch[1] : "Digite um valor: ";

    const userInput = prompt(question);

    if (userInput !== null) {
        output.textContent = "Executando...";
        setTimeout(() => {
            // Simula a saída do print
            const welcomeMessage = `Bem-vindo(a), ${userInput}!`;
            
            // Marca a atividade como concluída APÓS a interação do usuário
            const exerciseContainer = output.closest('.interactive-exercise');
            if (exerciseContainer && !exerciseContainer.classList.contains('completed')) {
                exerciseContainer.classList.add('completed');
                checkStepCompletion(currentStep);
            }
            output.textContent = welcomeMessage;
        }, 500);
    }
}

async function runInteractivePythonCode(code, outputId) {
    const output = document.getElementById(outputId);
    if (!pyodideReady) {
        output.textContent = "Aguarde, o ambiente Python está carregando...";
        return;
    }
    output.textContent = "Executando código interativo...\n";

    // Substitui o input do Python pelo prompt do JS
    pyodide.globals.set("js_prompt", (s) => prompt(s));
    const pythonSetupCode = `
import sys
import io

sys.stdout = io.StringIO()
__builtins__.input = js_prompt
`;
    pyodide.runPython(pythonSetupCode);

    try {
        // Marca a atividade como concluída ao executar
        const activityContainer = output.closest('.trackable-activity');
        if (activityContainer && !activityContainer.classList.contains('completed')) {
            activityContainer.classList.add('completed');
            checkStepCompletion(currentStep);
        }

        await pyodide.runPythonAsync(code);

        const stdout = pyodide.runPython("sys.stdout.getvalue()");
        output.textContent = stdout ? stdout.trim() : "Código executado sem saída.";
        return true; // Sucesso
    } catch (err) {
        output.textContent = `Erro: ${err}`;
        return false; // Falha
    } finally {
        // Restaura a saída padrão
        if (pyodideReady) {
            pyodide.runPython("sys.stdout = sys.__stdout__");
        }
    }
}

document.getElementById('run-rh360').addEventListener('click', async () => {
    const code = document.getElementById('rh360-code').value;
    const success = await runInteractivePythonCode(code, 'rh360-output');
    // Apenas marca como completo se o código rodar sem erros
    if (success) {
        const activityContainer = document.getElementById('run-rh360').closest('.trackable-activity');
        activityContainer.classList.add('completed');
        checkStepCompletion(currentStep);
    }
});

document.getElementById('reveal-rh360-solution').addEventListener('click', function() {
    const codeArea = document.getElementById('rh360-code');
    
    const solutionCode = `# Protótipo InovaTech - Módulo de Cadastro

# Solicitar informações do usuário
nome = input("Digite seu nome de usuário: ")
idade = int(input("Digite sua idade: "))
email = input("Digite seu e-mail: ")

# Calcular ano de nascimento (considerando 2024 como ano atual)
ano_atual = 2024
ano_nascimento = ano_atual - idade

# Exibir mensagem de boas-vindas
print("\\n--- Perfil Criado na InovaTech ---")
print("Usuário cadastrado com sucesso!")
print(f"Nome: {nome}")
print(f"Idade: {idade} anos")
print(f"E-mail: {email}")
print(f"Ano de nascimento: {ano_nascimento}")

# Verificar se é maior de idade
if idade >= 18:
    print("Status: MAIOR de idade")
else:
    print("Status: MENOR de idade")

print("\\nBem-vindo(a) à plataforma InovaTech!")`;

    codeArea.value = solutionCode;
});

// Lógica para salvar e carregar anotações da pesquisa no localStorage
const researchNotesTextarea = document.getElementById('research-notes');
const saveResearchBtn = document.getElementById('save-research-btn');
const researchFeedback = document.getElementById('research-feedback');

// Carrega as anotações salvas quando a página é iniciada
if (researchNotesTextarea) {
    const savedNotes = localStorage.getItem('pythonResearchNotes');
    if (savedNotes) {
        researchNotesTextarea.value = savedNotes;
    }
}

// Configura o botão para salvar as anotações
if (saveResearchBtn && researchNotesTextarea && researchFeedback) {
    saveResearchBtn.addEventListener('click', function() {
        const notes = researchNotesTextarea.value;
        localStorage.setItem('pythonResearchNotes', notes);

        const activityContainer = this.closest('.trackable-activity');
        if (activityContainer && !activityContainer.classList.contains('completed')) {
            activityContainer.classList.add('completed');
            checkStepCompletion(currentStep);
        }
        researchFeedback.textContent = '✅ Suas anotações foram salvas com sucesso no navegador!';
        researchFeedback.className = 'feedback correct';
        researchFeedback.style.display = 'block';
    });
}

// --- Lógica Genérica para Construtor de Código (Arrastar e Soltar) ---
function setupDragDropExercise(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const dropZone = container.querySelector('.code-drop-zone');
    const blockSource = container.querySelector('.code-block-source');
    const checkBtn = container.querySelector('.check-btn');
    const resetBtn = container.querySelector('.reset-btn');
    const feedback = container.querySelector('.feedback');
    const allBlocks = Array.from(blockSource.querySelectorAll('.code-block'));

    let draggedItem = null;

    blockSource.addEventListener('dragstart', e => {
        if (e.target.classList.contains('code-block')) {
            draggedItem = e.target;
            setTimeout(() => e.target.classList.add('dragging'), 0);
        }
    });

    document.addEventListener('dragend', e => {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            draggedItem = null;
        }
    });

    dropZone.addEventListener('dragover', e => {
        e.preventDefault();
        dropZone.classList.add('over');
    });

    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('over'));

    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        if (draggedItem) {
            dropZone.appendChild(draggedItem);
        }
        dropZone.classList.remove('over');
    });

    checkBtn.addEventListener('click', () => {
        const blocksInZone = dropZone.querySelectorAll('.code-block');
        let isCorrect = true;

        if (blocksInZone.length !== allBlocks.length) {
            isCorrect = false;
        } else {
            blocksInZone.forEach((block, index) => {
                if (parseInt(block.dataset.order) !== index) {
                    isCorrect = false;
                }
            });
        }

        feedback.textContent = isCorrect ? '✅ Perfeito! O código está na ordem correta.' : '❌ Ops! A ordem dos blocos não está correta. Tente novamente.';
        feedback.className = isCorrect ? 'feedback correct' : 'feedback incorrect';
        feedback.style.display = 'block';

        if (isCorrect) {
            const activityContainer = container.closest('.trackable-activity');
            activityContainer.classList.add('completed');
            checkStepCompletion(currentStep);
            confetti(); // Adiciona um efeito de comemoração!
        }
    });

    resetBtn.addEventListener('click', () => {
        const blocksInZone = dropZone.querySelectorAll('.code-block');
        blocksInZone.forEach(block => blockSource.appendChild(block));
        feedback.style.display = 'none';
    });
}

// Inicializa todos os exercícios de arrastar e soltar na página
document.addEventListener('DOMContentLoaded', () => {
    for (let i = 1; i <= 5; i++) {
        setupDragDropExercise(`dd-exercise-${i}`);
    }
});

// --- Lógica para Associação de Colunas (Matching Exercise) ---
function setupMatchingExercise(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const conceptsColumn = container.querySelector('#concepts-column');
    const definitionsColumn = container.querySelector('#definitions-column');
    const feedback = container.querySelector('#matching-feedback');
    const resetBtn = container.querySelector('#reset-matching-btn');
    const checkBtn = container.querySelector('#check-matching-btn');

    let draggedItem = null;

    conceptsColumn.addEventListener('dragstart', e => {
        if (e.target.classList.contains('matching-item')) {
            draggedItem = e.target;
            setTimeout(() => e.target.classList.add('dragging'), 0);
        }
    });

    document.addEventListener('dragend', e => {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            draggedItem = null;
        }
    });

    definitionsColumn.addEventListener('dragover', e => {
        e.preventDefault();
        const dropzone = e.target.closest('.matching-dropzone');
        if (dropzone && !dropzone.classList.contains('correct')) {
            dropzone.classList.add('over');
        }
    });

    definitionsColumn.addEventListener('dragleave', e => {
        const dropzone = e.target.closest('.matching-dropzone');
        if (dropzone) {
            dropzone.classList.remove('over');
        }
    });

    definitionsColumn.addEventListener('drop', e => {
        e.preventDefault();
        // Encontra a dropzone mais próxima, não importa se o alvo é a zona ou um item dentro dela.
        let dropzone = e.target;
        if (!dropzone.classList.contains('matching-dropzone')) {
            dropzone = dropzone.closest('.matching-dropzone');
        }

        if (dropzone && draggedItem) {
            dropzone.classList.remove('over');
            
            // Se a dropzone já contiver um item, devolva-o à coluna de origem.
            const existingItem = dropzone.querySelector('.matching-item');
            if (existingItem) {
                conceptsColumn.appendChild(existingItem);
                existingItem.draggable = true;
                existingItem.classList.remove('matched');
                // Limpa o status da dropzone se o item for removido
                dropzone.classList.remove('correct');
            }

            const isCorrect = draggedItem.dataset.matchId === dropzone.dataset.matchId;

            if (isCorrect) {
                dropzone.innerHTML = ''; // Limpa o texto placeholder
                dropzone.appendChild(draggedItem);
                draggedItem.draggable = false;
                draggedItem.classList.remove('dragging');
                draggedItem.classList.add('matched');
                dropzone.classList.add('correct');
                draggedItem = null;
            } else {
                dropzone.classList.add('incorrect');
                setTimeout(() => dropzone.classList.remove('incorrect'), 500);
            }
        }
    });

    checkBtn.addEventListener('click', () => {
        const totalActivities = conceptsColumn.querySelectorAll('.matching-item').length + definitionsColumn.querySelectorAll('.matching-item').length;
        const dropzones = definitionsColumn.querySelectorAll('.matching-dropzone');
        const allMatched = Array.from(dropzones).every(dz => dz.classList.contains('correct'));
        const matchedCount = definitionsColumn.querySelectorAll('.matching-dropzone.correct').length;

        if (allMatched && matchedCount === totalActivities) {
            feedback.textContent = '✅ Excelente! Todas as associações estão corretas.';
            feedback.className = 'feedback correct';
            feedback.style.display = 'block';
            
            const activityContainer = container.closest('.trackable-activity');
            if (activityContainer) activityContainer.classList.add('completed');
            checkStepCompletion(currentStep);
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } else {
            feedback.textContent = '❌ Ainda faltam associações ou algumas estão incorretas. Continue tentando!';
            feedback.className = 'feedback incorrect';
            feedback.style.display = 'block';
        }
    });

    resetBtn.addEventListener('click', () => {
        // A maneira mais fácil de resetar é recarregar a etapa, mas isso pode ser complexo.
        // Uma solução mais simples seria mover os elementos de volta.
        // Por enquanto, vamos apenas sugerir recarregar a página ou refazer a etapa.
        // Para uma implementação completa, seria necessário clonar os nós no início.
        // Por simplicidade, vamos recarregar a página da aula.
        window.location.reload();
    });
}

// Lógica para os Flip Cards (Cards de Estudo)
document.querySelectorAll('.flip-card').forEach(card => {
    card.addEventListener('click', function() {
        this.classList.toggle('is-flipped');
    });
});

// Lógica para o Modal de Empresas
const companyModalOverlay = document.getElementById('company-modal-overlay'); // Sem alterações aqui, pois o ID já é único
const modalCloseBtn = document.querySelector('.company-modal-close-btn'); // Alterado para buscar pela nova classe
const companyLogos = document.querySelectorAll('.company-logo');

const modalCompanyName = document.getElementById('modal-company-name');
const modalCompanyIcon = document.getElementById('modal-company-icon');
const modalCompanyUsage = document.getElementById('modal-company-usage');

companyLogos.forEach(logo => {
    logo.addEventListener('click', function() {
        const name = this.dataset.companyName;
        const icon = this.dataset.companyIcon;
        const usage = this.dataset.companyUsage;

        modalCompanyName.textContent = name;
        modalCompanyIcon.textContent = icon;
        modalCompanyUsage.textContent = usage;

        companyModalOverlay.style.display = 'flex';
    });
});

function closeModal() {
    companyModalOverlay.style.display = 'none';
}

if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
companyModalOverlay.addEventListener('click', (e) => {
    if (e.target === companyModalOverlay) {
        closeModal();
    }
});

// --- Lógica para o Modal Genérico ---
const genericModalOverlay = document.getElementById('generic-modal-overlay');
const genericModalCloseBtn = document.querySelector('.generic-modal-close-btn');
const genericModalTitle = document.getElementById('generic-modal-title');
const genericModalText = document.getElementById('generic-modal-text');

function openGenericModal(title, text) {
    if (genericModalOverlay) {
        genericModalTitle.innerHTML = title;
        genericModalText.innerHTML = text;
        genericModalOverlay.style.display = 'flex';
    }
}

function closeGenericModal() {
    if (genericModalOverlay) {
        genericModalOverlay.style.display = 'none';
    }
}

if (genericModalCloseBtn) genericModalCloseBtn.addEventListener('click', closeGenericModal);
if (genericModalOverlay) genericModalOverlay.addEventListener('click', (e) => {
    if (e.target === genericModalOverlay) {
        closeGenericModal();
    }
});

// Botão específico da Etapa 4
const showPythonModalBtn = document.getElementById('show-python-modal-btn');
if (showPythonModalBtn) {
    showPythonModalBtn.addEventListener('click', () => {
        openGenericModal('E o Python? 🐍', '<strong>Python</strong> combina a simplicidade de uma linguagem <strong>interpretada</strong> com o poder da <strong>Programação Orientada a Objetos</strong>, tornando-o uma escolha versátil e poderosa. 🧙‍♂️🏗️');
    });
}

// --- Lógica do Caça-Palavras ---
function setupWordSearch() {
    const gridElement = document.getElementById('word-search-grid');
    const listElement = document.getElementById('word-search-list');
    const feedbackElement = document.getElementById('word-search-feedback');
    const revealBtn = document.getElementById('reveal-word-btn');
    if (!gridElement) return;

    const gridSize = 12;
    const words = [
        { word: 'VARIAVEL', concept: '"Caixa" para guardar dados', found: false, start: [1, 0], end: [1, 7], colorClass: 'found-c1' },
        { word: 'FUNCAO', concept: 'Bloco de código reutilizável', found: false, start: [0, 0], end: [0, 5], colorClass: 'found-c2' },
        { word: 'LISTA', concept: 'Coleção ordenada e mutável', found: false, start: [3, 2], end: [3, 6], colorClass: 'found-c3' },
        { word: 'IF', concept: 'Estrutura de decisão', found: false, start: [7, 2], end: [7, 3], colorClass: 'found-c4' },
        { word: 'ELSE', concept: 'Caminho alternativo do "if"', found: false, start: [4, 0], end: [7, 0], colorClass: 'found-c5' },
        { word: 'PYTHON', concept: 'Linguagem de programação', found: false, start: [0, 9], end: [6, 9], colorClass: 'found-c6' },
        { word: 'FOR', concept: 'Loop para iterar sequências', found: false, start: [10, 1], end: [10, 3], colorClass: 'found-c7' },
        { word: 'INPUT', concept: 'Captura dados do usuário', found: false, start: [2, 11], end: [6, 11], colorClass: 'found-c8' },
        { word: 'PRINT', concept: 'Exibe dados na tela', found: false, start: [11, 6], end: [11, 10], colorClass: 'found-c1' },
        { word: 'DICT', concept: 'Coleção com chave-valor', found: false, start: [9, 5], end: [9, 8], colorClass: 'found-c2' }
    ];

    const grid = [
        ['F', 'U', 'N', 'C', 'A', 'O', 'L', 'P', 'O', 'P', 'Y', 'T'],
        ['V', 'A', 'R', 'I', 'A', 'V', 'E', 'L', 'U', 'Y', 'T', 'H'],
        ['M', 'B', 'N', 'S', 'D', 'F', 'G', 'H', 'N', 'T', 'R', 'I'],
        ['Q', 'W', 'L', 'I', 'S', 'T', 'A', 'Z', 'C', 'H', 'E', 'N'],
        ['E', 'C', 'V', 'B', 'N', 'M', 'K', 'J', 'A', 'O', 'W', 'P'],
        ['L', 'G', 'F', 'D', 'S', 'A', 'P', 'O', 'O', 'N', 'Q', 'U'],
        ['S', 'U', 'Y', 'T', 'R', 'E', 'W', 'Q', 'L', 'A', 'A', 'T'],
        ['E', 'J', 'I', 'F', 'H', 'G', 'F', 'D', 'S', 'S', 'S', 'X'],
        ['P', 'O', 'I', 'U', 'Y', 'T', 'R', 'E', 'W', 'D', 'D', 'C'],
        ['A', 'S', 'D', 'F', 'G', 'D', 'I', 'C', 'T', 'F', 'F', 'V'],
        ['Z', 'F', 'O', 'R', 'X', 'C', 'V', 'B', 'N', 'G', 'G', 'B'],
        ['Q', 'A', 'Z', 'W', 'S', 'X', 'P', 'R', 'I', 'N', 'T', 'N']
    ];

    let isSelecting = false;
    let selectedCells = [];

    // Gerar grade e lista
    gridElement.style.gridTemplateColumns = `repeat(${gridSize}, 35px)`;
    gridElement.style.gridTemplateRows = `repeat(${gridSize}, 35px)`;
    grid.forEach((row, r) => {
        row.forEach((letter, c) => {
            const cell = document.createElement('div');
            cell.className = 'word-search-cell';
            cell.textContent = letter;
            cell.dataset.row = r;
            cell.dataset.col = c;
            gridElement.appendChild(cell);
        });
    });

    function updateWordList() {
        listElement.innerHTML = '';
        words.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.concept;
            if (item.found) {
                li.classList.add('found-word');
                // Adiciona a palavra encontrada ao lado do conceito
                const foundWordSpan = document.createElement('span');
                foundWordSpan.className = 'found-word-text';
                foundWordSpan.textContent = ` — ${item.word}`;
                li.appendChild(foundWordSpan);
            }
            listElement.appendChild(li);
        });
    }

    gridElement.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('word-search-cell')) {
            isSelecting = true;
            selectedCells = [e.target];
            e.target.classList.add('selected');
        }
    });

    gridElement.addEventListener('mouseover', (e) => {
        if (isSelecting && e.target.classList.contains('word-search-cell') && !selectedCells.includes(e.target)) {
            selectedCells.push(e.target);
            e.target.classList.add('selected');
        }
    });

    gridElement.addEventListener('mouseup', () => {
        isSelecting = false;
        const selectedWord = selectedCells.map(cell => cell.textContent).join('');
        
        const wordFound = words.find(w => !w.found && (w.word === selectedWord || w.word === selectedWord.split('').reverse().join('')));

        if (wordFound) {
            wordFound.found = true;
            selectedCells.forEach(cell => {
                cell.classList.add('found');
                cell.classList.add(wordFound.colorClass);
            });
        }

        selectedCells.forEach(cell => cell.classList.remove('selected'));
        selectedCells = [];
        updateWordList();

        if (words.every(w => w.found)) {
            feedbackElement.textContent = '🎉 Parabéns! Você encontrou todas as palavras!';
            feedbackElement.className = 'feedback correct';
            feedbackElement.style.display = 'block';

            const activityContainer = gridElement.closest('.trackable-activity');
            if(activityContainer) {
                activityContainer.classList.add('completed');
                checkStepCompletion(currentStep);
            }
        }
    });

    updateWordList();

    // Lógica para o botão de revelar
    revealBtn.addEventListener('click', () => {
        const wordToReveal = words.find(w => !w.found);
        if (!wordToReveal) {
            revealBtn.disabled = true;
            return;
        }

        wordToReveal.found = true;
        const { start, end } = wordToReveal;
        const cellsToReveal = [];

        if (start[0] === end[0]) { // Palavra horizontal
            for (let c = Math.min(start[1], end[1]); c <= Math.max(start[1], end[1]); c++) {
                cellsToReveal.push(gridElement.querySelector(`[data-row="${start[0]}"][data-col="${c}"]`));
            }
        } else if (start[1] === end[1]) { // Palavra vertical
            for (let r = Math.min(start[0], end[0]); r <= Math.max(start[0], end[0]); r++) {
                cellsToReveal.push(gridElement.querySelector(`[data-row="${r}"][data-col="${start[1]}"]`));
            }
        }

        cellsToReveal.forEach(cell => {
            if (cell) {
                cell.classList.add('found'); // Marca como encontrada
                cell.classList.add(wordToReveal.colorClass); // Aplica a cor específica
            }
        });

        updateWordList();

        if (words.every(w => w.found)) {
            feedbackElement.textContent = '🎉 Parabéns! Você encontrou todas as palavras!';
            feedbackElement.className = 'feedback correct';
            feedbackElement.style.display = 'block';
            const activityContainer = gridElement.closest('.trackable-activity');
            if(activityContainer) {
                activityContainer.classList.add('completed');
                checkStepCompletion(currentStep);
            }
            revealBtn.disabled = true;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Garante que o DOM está carregado antes de configurar os jogos
    for (let i = 1; i <= 5; i++) { setupDragDropExercise(`dd-exercise-${i}`); }

    // Função para verificar um desafio de código individual
    setupMatchingExercise('matching-exercise-1');
    function checkCodeChallenge(challengeNum) {
        const challengeContainer = document.getElementById(`code-challenge-${challengeNum}`);
        if (!challengeContainer) return false;

        const code = challengeContainer.querySelector('.code-area').value;
        const outputDiv = challengeContainer.querySelector('.exercise-output');
        const feedbackDiv = challengeContainer.querySelector('.feedback');
        
        let isCorrect = false;
        let expectedOutput = "";
        switch (challengeNum) {
            case 1: // Soma
                isCorrect = code.includes('15') && code.includes('30') && code.includes('+');
                expectedOutput = "45";
                break;
            case 2: // Idade
                isCorrect = code.includes('idade') && code.includes('>= 18') && code.includes('if') && code.includes('else');
                expectedOutput = "Maior de idade";
                break;
            case 3: // Loop
                isCorrect = code.includes('for') && (code.includes('range(1, 6)') || code.includes('range(1,5)')); // Aceita ambas as lógicas
                expectedOutput = "1\n2\n3\n4\n5";
                break;
            case 4: // Lista
                isCorrect = code.includes('frutas') && (code.includes('[-1]') || code.includes('[2]'));
                expectedOutput = "Uva";
                break;
            case 5: // Dicionário
                isCorrect = code.includes('carro') && (code.includes('["marca"]') || code.includes("['marca']"));
                expectedOutput = "Tesla";
                break;
        }

        if (isCorrect) {
            outputDiv.textContent = expectedOutput;
            feedbackDiv.textContent = '✅ Código correto!';
            feedbackDiv.className = 'feedback correct';
            challengeContainer.dataset.correct = "true"; // Marca como correto
        } else {
            outputDiv.textContent = 'Saída incorreta.';
            feedbackDiv.textContent = '❌ Tente novamente. Verifique a lógica do seu código.';
            feedbackDiv.className = 'feedback incorrect';
            challengeContainer.dataset.correct = "false";
        }
        feedbackDiv.style.display = 'block';
        return isCorrect;
    }

    // Adiciona listener para os botões de revelar solução de código
    document.querySelectorAll('.btn-reveal-solution').forEach(btn => {
        btn.addEventListener('click', function() {
            const challengeNum = parseInt(this.dataset.challengeId);
            const challengeContainer = document.getElementById(`code-challenge-${challengeNum}`);
            if (!challengeContainer) return;

            const codeArea = challengeContainer.querySelector('.code-area');
            const solutions = [
                "a = 15\nb = 30\nprint(a + b)",
                "idade = 25\nif idade >= 18:\n    print('Maior de idade')\nelse:\n    print('Menor de idade')",
                "for i in range(1, 6):\n    print(i)",
                "frutas = ['Maçã', 'Banana', 'Uva']\nprint(frutas[-1])",
                "carro = {'marca': 'Tesla', 'ano': 2023}\nprint(carro['marca'])"
            ];
            codeArea.value = solutions[challengeNum - 1];
            checkCodeChallenge(challengeNum); // Valida e marca como completo
        });
    });

    // Adiciona listener para cada botão de verificação de código
    document.querySelectorAll('.check-code-btn').forEach((btn, index) => {

        btn.addEventListener('click', () => checkCodeChallenge(index + 1));
    });

    // Lógica para o Quiz Final
    const finalQuizBtn = document.getElementById('check-final-quiz');
    if (finalQuizBtn) {
        finalQuizBtn.addEventListener('click', async () => {
            const quizContainer = document.getElementById('final-quiz-container');
            const correctQuizAnswers = quizContainer.querySelectorAll('.quiz-option.correct.selected').length;
            const correctCodeChallenges = quizContainer.querySelectorAll('.interactive-exercise[data-correct="true"]').length;

            const totalScore = correctQuizAnswers + correctCodeChallenges;
            const finalFeedback = document.getElementById('final-quiz-feedback');
            finalFeedback.textContent = `Sua pontuação final é: ${totalScore}/10.`;
            finalFeedback.className = 'feedback correct';
            finalFeedback.style.display = 'block';

            // Se o quiz final for concluído, marca a atividade
            const activityContainer = quizContainer.closest('.trackable-activity');
            if (activityContainer) {
                activityContainer.classList.add('completed');
                checkStepCompletion(currentStep);
            }
        });
    }

    setupWordSearch();

    // Adiciona listener para os botões de revelar resposta do quiz
    document.querySelectorAll('.btn-reveal-answer').forEach(btn => {
        btn.addEventListener('click', function() {
            const quizContainer = this.closest('.quiz-container');
            if (!quizContainer) return;

            const correctOption = quizContainer.querySelector('.quiz-option[data-correct="true"]');
            const feedback = quizContainer.querySelector('.feedback');

            if (correctOption) correctOption.classList.add('correct');
            feedback.textContent = '💡 A resposta correta foi destacada.';
            feedback.className = 'feedback correct';
            feedback.style.display = 'block';
            quizContainer.classList.add('completed');
            checkStepCompletion(currentStep);
        });
    });

    // Configurar botões "Desbloquear Próxima Etapa"
    document.querySelectorAll('.btn-unlock-next').forEach(button => {
        button.addEventListener('click', function() {
            const step = parseInt(this.dataset.step);

            // Lógica existente para salvar o progresso
            saveAndNotifyProgress(step);
            this.textContent = '✅ Desbloqueado!';
            this.disabled = true; // Desabilita após o clique para evitar múltiplos envios

            // Envia uma mensagem específica para mostrar a recompensa na página do mapa
            if (window.parent) {
                window.parent.postMessage({ type: 'SHOW_REWARD', points: 10, step: step }, '*');
            }
        });
    });

    // --- Lógica para Geração de Certificado PDF ---
    const generatePdfBtn = document.getElementById('generate-pdf-btn');
    if (generatePdfBtn) {
        generatePdfBtn.addEventListener('click', async () => { // 1. Tornar a função assíncrona
            const savedData = localStorage.getItem('studentData');
            let studentName = '';
            if (savedData) {
                const studentData = JSON.parse(savedData);
                studentName = studentData.name || '';
            }

            if (!studentName.trim()) {
                alert("Não foi possível encontrar seu nome. Por favor, volte para a Etapa 1 e preencha o formulário.");
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            // --- NOVO DESIGN DO CERTIFICADO ---

            const pythonBlue = '#3776AB';
            const pythonYellow = '#FFD43B';
            const darkText = '#212529';
            const lightText = '#6c757d';

            // Fundo com cor sólida (gradiente e fonte customizada removidos para corrigir erros)
            const backgroundColor = '#f0f8ff'; // AliceBlue
            doc.setFillColor(backgroundColor);
            doc.rect(0, 0, 297, 210, 'F');

            // Bordas decorativas
            doc.setDrawColor(pythonBlue);
            doc.setLineWidth(1.5);
            doc.rect(10, 10, 277, 190);

            doc.setDrawColor(pythonYellow);
            doc.setLineWidth(0.5);
            doc.rect(12, 12, 273, 186);

            // 2. Carrega a imagem dinamicamente
            const loadImage = (src) => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = src;
                });
            };

            const logoImage = await loadImage('logo.png');

            // Desenha o logo no topo
            const logoWidth = 40;
            const logoHeight = 40;
            const logoX = (297 - logoWidth) / 2; // Centraliza o logo
            const logoY = 25;
            doc.addImage(logoImage, 'PNG', logoX, logoY, logoWidth, logoHeight);

            // Título
            doc.setTextColor(pythonBlue);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(36);
            doc.text('Certificado de Conclusão', 148.5, 85, { align: 'center' });

            // Texto "concedido a"
            doc.setTextColor(darkText);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(18);
            doc.text('Este certificado é concedido a', 148.5, 95, { align: 'center' });

            // Nome do Aluno
            doc.setTextColor(pythonBlue);
            doc.setFont('times', 'bolditalic');
            doc.setFontSize(32);
            doc.text(studentName, 148.5, 115, { align: 'center' });

            // Descrição do curso
            doc.setTextColor(darkText);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(16);
            doc.text('Por ter concluído com sucesso a aula interativa de', 148.5, 135, { align: 'center' });
            doc.setFont('helvetica', 'bold');
            doc.text('"Introdução ao Python para Backend"', 148.5, 145, { align: 'center' });

            // Data e aviso de validade
            const today = new Date();
            const dateString = today.toLocaleDateString('pt-BR');
            doc.setTextColor(lightText);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(`Emitido em: ${dateString}`, 148.5, 175, { align: 'center' });
            doc.setFont('helvetica', 'italic');
            doc.text('Este certificado é gerado para fins educacionais e de demonstração. Não possui validade como documento formal.', 148.5, 180, { align: 'center' });

            doc.save(`Certificado-Python-${studentName.replace(/ /g, '_')}.pdf`);
        });
    }
});