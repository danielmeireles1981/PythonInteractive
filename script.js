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
        // Restaura a saída padrão para o console do navegador
        if (pyodideReady) {
            pyodide.runPython("sys.stdout = sys.__stdout__");
        }
    }
}
// --- Fim da Configuração do Pyodide ---

// Controle de navegação entre etapas
let currentStep = 1;
const totalSteps = 15; 

// Mostrar etapa atual
function showStep(stepNumber) {
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(`step-${stepNumber}`).classList.add('active');
    
    // Atualizar menu lateral
    document.querySelectorAll('.sidebar li').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.sidebar li[data-step="${stepNumber}"]`).classList.add('active');
    
    currentStep = stepNumber;
}

// Configurar navegação pelo menu lateral
document.querySelectorAll('.sidebar li').forEach(item => {
    item.addEventListener('click', function() {
        const stepNumber = parseInt(this.getAttribute('data-step'));
        showStep(stepNumber);
    });
});

// Configurar botões de navegação
for (let i = 1; i < totalSteps; i++) {
    const nextBtn = document.getElementById(`next-${i}`);
    if (nextBtn) {
        nextBtn.addEventListener('click', () => showStep(i + 1));
    }
}

for (let i = 2; i <= totalSteps; i++) {
    const prevBtn = document.getElementById(`prev-${i}`);
    if (prevBtn) {
        prevBtn.addEventListener('click', () => showStep(i - 1));
    }
}

// Configurar quizzes
document.querySelectorAll('.quiz-option').forEach(option => {
    option.addEventListener('click', function() {
        const parent = this.parentElement;
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
    await runInteractivePythonCode(code, 'rh360-output');
});

document.getElementById('reveal-rh360-solution').addEventListener('click', function() {
    const codeArea = document.getElementById('rh360-code');
    const feedback = document.getElementById('rh360-feedback');
    
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
    feedback.style.display = 'block';
});

// Configurar botão de finalização
document.getElementById('finish-btn').addEventListener('click', function() {
    document.getElementById('completion-message').style.display = 'block';
    this.style.display = 'none';

    // Lançar confetes!
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 }
        });
    }
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

// Lógica para os Flip Cards (Cards de Estudo)
document.querySelectorAll('.flip-card').forEach(card => {
    card.addEventListener('click', function() {
        this.classList.toggle('is-flipped');
    });
});

// Lógica para o Modal de Empresas
const companyModalOverlay = document.getElementById('company-modal-overlay');
const modalCloseBtn = document.getElementById('modal-close-btn');
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

modalCloseBtn.addEventListener('click', closeModal);
companyModalOverlay.addEventListener('click', (e) => {
    if (e.target === companyModalOverlay) {
        closeModal();
    }
});

// --- Lógica do Caça-Palavras ---
function setupWordSearch() {
    const gridElement = document.getElementById('word-search-grid');
    const listElement = document.getElementById('word-search-list');
    const feedbackElement = document.getElementById('word-search-feedback');
    const revealBtn = document.getElementById('reveal-word-btn');
    if (!gridElement) return;

    const gridSize = 10;
    const words = [
        { word: 'VARIAVEL', found: false, start: [1, 0], end: [1, 7], colorClass: 'found-c1' },
        { word: 'FUNCAO', found: false, start: [0, 0], end: [0, 5], colorClass: 'found-c2' },
        { word: 'LISTA', found: false, start: [3, 2], end: [3, 6], colorClass: 'found-c3' },
        { word: 'IF', found: false, start: [7, 2], end: [7, 3], colorClass: 'found-c4' },
        { word: 'ELSE', found: false, start: [4, 0], end: [7, 0], colorClass: 'found-c5' },
        { word: 'PYTHON', found: false, start: [0, 9], end: [5, 9], colorClass: 'found-c6' }
    ];

    const grid = [
        ['F', 'U', 'N', 'C', 'A', 'O', 'L', 'P', 'O', 'P'],
        ['V', 'A', 'R', 'I', 'A', 'V', 'E', 'L', 'U', 'Y'],
        ['M', 'B', 'N', 'S', 'D', 'F', 'G', 'H', 'N', 'T'],
        ['Q', 'W', 'L', 'I', 'S', 'T', 'A', 'Z', 'C', 'H'],
        ['E', 'C', 'V', 'B', 'N', 'M', 'K', 'J', 'A', 'O'],
        ['L', 'G', 'F', 'D', 'S', 'A', 'P', 'O', 'O', 'N'],
        ['S', 'U', 'Y', 'T', 'R', 'E', 'W', 'Q', 'L', 'K'],
        ['E', 'J', 'I', 'F', 'H', 'G', 'F', 'D', 'S', 'A'],
        ['P', 'O', 'I', 'U', 'Y', 'T', 'R', 'E', 'W', 'Q'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ç']
    ];

    let isSelecting = false;
    let selectedCells = [];

    // Gerar grade e lista
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
            li.textContent = item.word;
            if (item.found) {
                li.classList.add('found-word');
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
            revealBtn.disabled = true;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Garante que o DOM está carregado antes de configurar os jogos
    for (let i = 1; i <= 5; i++) { setupDragDropExercise(`dd-exercise-${i}`); }

    // Função para verificar um desafio de código individual
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
                isCorrect = code.includes('carro') && code.includes('["marca"]');
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
            finalFeedback.textContent = `Sua pontuação final é: ${totalScore}/10. (${correctQuizAnswers} de 5 em múltipla escolha e ${correctCodeChallenges} de 5 em desafios de código).`;
            finalFeedback.className = 'feedback correct';
            finalFeedback.style.display = 'block';
        });
    }

    setupWordSearch();
});