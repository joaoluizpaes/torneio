// ============================================================
// POKÉMON TCG TOURNAMENT - SCRIPT V2.1
// ============================================================

// ============================================================
// CONFIGURAÇÃO SUPABASE
// ============================================================

const SUPABASE_URL = "https://pxqutbefvvfgokboejmr.supabase.co";
const SUPABASE_KEY = "sb_publishable_tRDeWRvVl0dn_BA1hX6CqQ_LWSWmvtU";

let supabaseClient = null;

try {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );

        console.log("Supabase conectado.");
    } else {
        console.error("Biblioteca do Supabase não foi carregada.");
    }
} catch (error) {
    console.error("Erro ao iniciar Supabase:", error);
}


// ============================================================
// VARIÁVEIS
// ============================================================

let currentUser = null;
let currentPlayer = null;
let tournament = null;


// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

    console.log("Site iniciado.");

    // Primeiro configura os eventos.
    // Assim, mesmo que o Supabase dê algum erro,
    // os botões continuam funcionando.
    setupForms();

    setupPasswordToggle();

    // Verifica sessão
    try {
        await checkSession();
    } catch (error) {
        console.error("Erro ao verificar sessão:", error);
    }

    // Carrega torneio
    try {
        await loadTournament();
    } catch (error) {
        console.error("Erro ao carregar torneio:", error);
    }

    // Carrega lista pública
    try {
        await loadPublicPlayers();
    } catch (error) {
        console.error("Erro ao carregar jogadores:", error);
    }
});


// ============================================================
// CONFIGURAÇÃO DOS FORMULÁRIOS
// ============================================================

function setupForms() {

    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        registerForm.addEventListener("submit", register);
    }

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", login);
    }

    const paymentForm = document.getElementById("paymentForm");

    if (paymentForm) {
        paymentForm.addEventListener("submit", uploadPaymentProof);
    }

    const searchInput = document.getElementById("playerSearch");

    if (searchInput) {
        searchInput.addEventListener("input", filterPlayers);
    }
}


// ============================================================
// BOTÃO "QUERO ME INSCREVER"
// ============================================================

function startRegistration() {

    console.log("Botão Quero me inscrever clicado.");

    // Se o usuário já estiver logado,
    // pode ir diretamente para a inscrição.
    if (currentUser) {
        showSection("registerSection");

        const emailInput = document.getElementById("registerEmail");

        if (emailInput && currentUser.email) {
            emailInput.value = currentUser.email;
        }

        return;
    }

    // Caso não esteja logado, abre a inscrição.
    showSection("registerSection");
}


// ============================================================
// NAVEGAÇÃO ENTRE SEÇÕES
// ============================================================

function showSection(sectionId) {

    console.log("Abrindo seção:", sectionId);

    const sections = document.querySelectorAll(".section");

    sections.forEach(section => {
        section.classList.remove("active");
    });

    const target = document.getElementById(sectionId);

    if (!target) {
        console.error("Seção não encontrada:", sectionId);
        return;
    }

    target.classList.add("active");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ============================================================
// CADASTRO
// ============================================================

async function register(event) {

    event.preventDefault();

    console.log("Iniciando cadastro...");

    if (!supabaseClient) {
        showMessage(
            "registerMessage",
            "O sistema de banco de dados não foi carregado.",
            "error"
        );
        return;
    }

    const name = getValue("registerName");
    const nickname = getValue("registerNickname");
    const pokemonPlayerId = getValue("registerPokemonId");
    const whatsapp = getValue("registerWhatsapp");
    const email = getValue("registerEmail");
    const password = getValue("registerPassword");
    const passwordConfirm = getValue("registerPasswordConfirm");

    // Validações
    if (!name) {
        showMessage(
            "registerMessage",
            "Digite seu nome.",
            "error"
        );
        return;
    }

    if (!email) {
        showMessage(
            "registerMessage",
            "Digite seu e-mail.",
            "error"
        );
        return;
    }

    if (!password) {
        showMessage(
            "registerMessage",
            "Digite uma senha.",
            "error"
        );
        return;
    }

    if (password.length < 6) {
        showMessage(
            "registerMessage",
            "A senha precisa ter pelo menos 6 caracteres.",
            "error"
        );
        return;
    }

    if (password !== passwordConfirm) {
        showMessage(
            "registerMessage",
            "As senhas não são iguais.",
            "error"
        );
        return;
    }

    try {

        setButtonLoading(
            "registerForm button[type='submit']",
            true,
            "Criando conta..."
        );

        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,

            options: {
                data: {
                    name: name,
                    nickname: nickname,
                    pokemon_player_id: pokemonPlayerId,
                    whatsapp: whatsapp
                }
            }
        });

        if (error) {
            console.error("Erro no cadastro:", error);

            showMessage(
                "registerMessage",
                traduzirErro(error.message),
                "error"
            );

            return;
        }

        console.log("Cadastro realizado:", data);

        // Caso o Supabase exija confirmação de e-mail
        if (!data.session) {

            showMessage(
                "registerMessage",
                "Cadastro realizado! Verifique seu e-mail para confirmar sua conta antes de fazer login.",
                "success"
            );

            return;
        }

        // Caso o login seja automático
        currentUser = data.user;

        showMessage(
            "registerMessage",
            "Conta criada com sucesso!",
            "success"
        );

        await new Promise(resolve => setTimeout(resolve, 1000));

        await checkSession();

        showSection("accountSection");

    } catch (error) {

        console.error("Erro inesperado no cadastro:", error);

        showMessage(
            "registerMessage",
            "Ocorreu um erro ao criar sua conta.",
            "error"
        );

    } finally {

        setButtonLoading(
            "registerForm button[type='submit']",
            false
        );
    }
}


// ============================================================
// LOGIN
// ============================================================

async function login(event) {

    event.preventDefault();

    console.log("Tentando fazer login...");

    if (!supabaseClient) {
        showMessage(
            "loginMessage",
            "O sistema de banco de dados não foi carregado.",
            "error"
        );
        return;
    }

    const email = getValue("loginEmail");
    const password = getValue("loginPassword");

    if (!email || !password) {

        showMessage(
            "loginMessage",
            "Preencha e-mail e senha.",
            "error"
        );

        return;
    }

    try {

        setButtonLoading(
            "loginForm button[type='submit']",
            true,
            "Entrando..."
        );

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {

            console.error("Erro no login:", error);

            showMessage(
                "loginMessage",
                traduzirErro(error.message),
                "error"
            );

            return;
        }

        currentUser = data.user;

        console.log("Login realizado:", currentUser);

        showMessage(
            "loginMessage",
            "Login realizado com sucesso!",
            "success"
        );

        await checkSession();

        await new Promise(resolve => setTimeout(resolve, 500));

        showSection("accountSection");

    } catch (error) {

        console.error("Erro inesperado no login:", error);

        showMessage(
            "loginMessage",
            "Não foi possível fazer login.",
            "error"
        );

    } finally {

        setButtonLoading(
            "loginForm button[type='submit']",
            false
        );
    }
}


// ============================================================
// VERIFICAR SESSÃO
// ============================================================

async function checkSession() {

    if (!supabaseClient) {
        return;
    }

    try {

        const { data, error } =
            await supabaseClient.auth.getSession();

        if (error) {
            console.error("Erro ao obter sessão:", error);
            return;
        }

        currentUser = data.session
            ? data.session.user
            : null;

        updateHeader();

        if (currentUser) {

            console.log(
                "Usuário logado:",
                currentUser.email
            );

            await loadPlayer();

        } else {

            console.log("Nenhum usuário logado.");

            currentPlayer = null;
        }

    } catch (error) {

        console.error(
            "Erro ao verificar sessão:",
            error
        );
    }
}


// ============================================================
// MONITORAR MUDANÇAS DE AUTENTICAÇÃO
// ============================================================

if (supabaseClient) {

    supabaseClient.auth.onAuthStateChange(
        async (event, session) => {

            console.log(
                "Auth event:",
                event
            );

            currentUser = session
                ? session.user
                : null;

            updateHeader();

            if (currentUser) {

                // Pequeno atraso para evitar conflitos
                // com a criação automática do player
                setTimeout(async () => {
                    await loadPlayer();
                }, 300);

            } else {

                currentPlayer = null;
            }
        }
    );
}


// ============================================================
// CARREGAR DADOS DO JOGADOR
// ============================================================

async function loadPlayer() {

    if (!supabaseClient || !currentUser) {
        return;
    }

    try {

        const { data, error } = await supabaseClient
            .from("players")
            .select("*")
            .eq("id", currentUser.id)
            .maybeSingle();

        if (error) {

            console.error(
                "Erro ao carregar jogador:",
                error
            );

            return;
        }

        currentPlayer = data;

        console.log(
            "Dados do jogador:",
            currentPlayer
        );

        renderAccount();

    } catch (error) {

        console.error(
            "Erro inesperado ao carregar jogador:",
            error
        );
    }
}


// ============================================================
// RENDERIZAR CONTA
// ============================================================

function renderAccount() {

    if (!currentUser) {
        return;
    }

    // Nome
    setText(
        "accountName",
        currentPlayer?.name ||
        currentUser.user_metadata?.name ||
        "Jogador"
    );

    // Apelido
    setText(
        "accountNickname",
        currentPlayer?.nickname ||
        currentUser.user_metadata?.nickname ||
        ""
    );

    // E-mail
    setText(
        "accountEmail",
        currentUser.email || ""
    );

    // Pokémon Player ID
    setText(
        "accountPokemonId",
        currentPlayer?.pokemon_player_id ||
        currentUser.user_metadata?.pokemon_player_id ||
        "Não informado"
    );

    // WhatsApp
    setText(
        "accountWhatsapp",
        currentPlayer?.whatsapp ||
        currentUser.user_metadata?.whatsapp ||
        "Não informado"
    );

    // Status pagamento
    updatePaymentStatus();

    // Mostra área da conta
    const accountButton =
        document.getElementById("btnAccount");

    if (accountButton) {
        accountButton.style.display = "inline-flex";
    }
}


// ============================================================
// ATUALIZAR CABEÇALHO
// ============================================================

function updateHeader() {

    const loginButton =
        document.getElementById("btnLogin");

    const accountButton =
        document.getElementById("btnAccount");

    const logoutButton =
        document.getElementById("btnLogout");

    if (currentUser) {

        if (loginButton) {
            loginButton.style.display = "none";
        }

        if (accountButton) {
            accountButton.style.display =
                "inline-flex";
        }

        if (logoutButton) {
            logoutButton.style.display =
                "inline-flex";
        }

    } else {

        if (loginButton) {
            loginButton.style.display =
                "inline-flex";
        }

        if (accountButton) {
            accountButton.style.display =
                "none";
        }

        if (logoutButton) {
            logoutButton.style.display =
                "none";
        }
    }
}


// ============================================================
// CARREGAR TORNEIO
// ============================================================

async function loadTournament() {

    if (!supabaseClient) {
        return;
    }

    try {

        const { data, error } = await supabaseClient
            .from("tournaments")
            .select("*")
            .order("tournament_date", {
                ascending: true
            })
            .limit(1)
            .maybeSingle();

        if (error) {

            console.error(
                "Erro ao buscar torneio:",
                error
            );

            return;
        }

        if (!data) {

            console.log(
                "Nenhum torneio cadastrado no banco."
            );

            return;
        }

        tournament = data;

        console.log(
            "Torneio carregado:",
            tournament
        );

        renderTournament();

    } catch (error) {

        console.error(
            "Erro ao carregar torneio:",
            error
        );
    }
}


// ============================================================
// RENDERIZAR TORNEIO
// ============================================================

function renderTournament() {

    if (!tournament) {
        return;
    }

    // Nome
    setText(
        "tournamentName",
        tournament.name
    );

    // Local
    setText(
        "tournamentLocation",
        tournament.location
    );

    // Preço
    const price = Number(
        tournament.price || 0
    );

    setText(
        "tournamentPrice",
        price.toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        )
    );

    // Data
    if (tournament.tournament_date) {

        const date =
            new Date(
                tournament.tournament_date +
                "T00:00:00"
            );

        setText(
            "tournamentDate",
            date.toLocaleDateString(
                "pt-BR"
            )
        );
    }

    // PIX
    setText(
        "pixKey",
        tournament.pix_key ||
        "PIX não informado"
    );
}


// ============================================================
// STATUS DO PAGAMENTO
// ============================================================

function updatePaymentStatus() {

    const statusElement =
        document.getElementById(
            "paymentStatus"
        );

    if (!statusElement) {
        return;
    }

    const status =
        currentPlayer?.payment_status ||
        "pending";

    statusElement.className =
        "status";

    if (status === "confirmed") {

        statusElement.classList.add(
            "success"
        );

        statusElement.textContent =
            "✓ PAGAMENTO CONFIRMADO";

    } else if (status === "rejected") {

        statusElement.classList.add(
            "error"
        );

        statusElement.textContent =
            "Pagamento recusado";

    } else {

        statusElement.classList.add(
            "pending"
        );

        statusElement.textContent =
            "Pagamento pendente";
    }
}


// ============================================================
// COPIAR PIX
// ============================================================

async function copyPix() {

    const pixElement =
        document.getElementById("pixKey");

    if (!pixElement) {
        return;
    }

    const pix =
        pixElement.textContent.trim();

    if (!pix || pix === "PIX não informado") {

        showMessage(
            "paymentMessage",
            "A chave PIX ainda não foi cadastrada.",
            "error"
        );

        return;
    }

    try {

        await navigator.clipboard.writeText(
            pix
        );

        showMessage(
            "paymentMessage",
            "Chave PIX copiada!",
            "success"
        );

    } catch (error) {

        console.error(
            "Erro ao copiar PIX:",
            error
        );

        showMessage(
            "paymentMessage",
            "Não foi possível copiar automaticamente.",
            "error"
        );
    }
}


// ============================================================
// UPLOAD DO COMPROVANTE
// ============================================================

async function uploadPaymentProof(event) {

    event.preventDefault();

    if (!currentUser) {

        showMessage(
            "paymentMessage",
            "Faça login antes de enviar o comprovante.",
            "error"
        );

        return;
    }

    if (!supabaseClient) {

        showMessage(
            "paymentMessage",
            "Banco de dados não disponível.",
            "error"
        );

        return;
    }

    const fileInput =
        document.getElementById(
            "paymentProof"
        );

    if (!fileInput || !fileInput.files.length) {

        showMessage(
            "paymentMessage",
            "Selecione o comprovante.",
            "error"
        );

        return;
    }

    const file =
        fileInput.files[0];

    // Limite de 10 MB
    if (file.size > 10 * 1024 * 1024) {

        showMessage(
            "paymentMessage",
            "O arquivo deve ter no máximo 10 MB.",
            "error"
        );

        return;
    }

    try {

        setButtonLoading(
            "paymentForm button[type='submit']",
            true,
            "Enviando..."
        );

        const extension =
            file.name
                .split(".")
                .pop()
                .toLowerCase();

        const filePath =
            `${currentUser.id}/${Date.now()}.${extension}`;

        const { error: uploadError } =
            await supabaseClient.storage
                .from("payment-proofs")
                .upload(
                    filePath,
                    file,
                    {
                        upsert: true
                    }
                );

        if (uploadError) {

            console.error(
                "Erro no upload:",
                uploadError
            );

            showMessage(
                "paymentMessage",
                "Não foi possível enviar o comprovante: " +
                traduzirErro(uploadError.message),
                "error"
            );

            return;
        }

        // IMPORTANTE:
        // O jogador NÃO confirma o próprio pagamento.
        // Apenas envia o comprovante.
        const { error: updateError } =
            await supabaseClient
                .from("players")
                .update({
                    payment_proof_path:
                        filePath,
                    payment_status:
                        "pending",
                    updated_at:
                        new Date().toISOString()
                })
                .eq(
                    "id",
                    currentUser.id
                );

        if (updateError) {

            console.error(
                "Erro ao salvar comprovante:",
                updateError
            );

            showMessage(
                "paymentMessage",
                "Comprovante enviado, mas não foi possível atualizar o cadastro.",
                "error"
            );

            return;
        }

        showMessage(
            "paymentMessage",
            "Comprovante enviado! Aguarde a confirmação da organização.",
            "success"
        );

        await loadPlayer();

    } catch (error) {

        console.error(
            "Erro no comprovante:",
            error
        );

        showMessage(
            "paymentMessage",
            "Ocorreu um erro ao enviar o comprovante.",
            "error"
        );

    } finally {

        setButtonLoading(
            "paymentForm button[type='submit']",
            false
        );
    }
}


// ============================================================
// LISTA PÚBLICA DE JOGADORES
// ============================================================

async function loadPublicPlayers() {

    if (!supabaseClient) {
        return;
    }

    const container =
        document.getElementById(
            "playersList"
        );

    if (!container) {
        return;
    }

    try {

        const { data, error } =
            await supabaseClient
                .from("public_players")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );

        if (error) {

            console.error(
                "Erro ao carregar jogadores:",
                error
            );

            container.innerHTML =
                "<p>Não foi possível carregar a lista de jogadores.</p>";

            return;
        }

        renderPublicPlayers(data || []);

    } catch (error) {

        console.error(
            "Erro inesperado:",
            error
        );
    }
}


// ============================================================
// RENDERIZAR JOGADORES
// ============================================================

function renderPublicPlayers(players) {

    const container =
        document.getElementById(
            "playersList"
        );

    if (!container) {
        return;
    }

    if (!players.length) {

        container.innerHTML =
            "<p>Nenhum jogador inscrito ainda.</p>";

        return;
    }

    container.innerHTML = "";

    players.forEach(player => {

        const card =
            document.createElement("div");

        card.className =
            "player-card";

        const name =
            escapeHtml(
                player.name || "Jogador"
            );

        const nickname =
            player.nickname
                ? `“${escapeHtml(player.nickname)}”`
                : "";

        // IMPORTANTE:
        // Só mostra confirmado se o banco disser
        // explicitamente que está confirmado.
        const confirmed =
            player.payment_status ===
            "confirmed";

        card.innerHTML = `
            <div class="player-info">
                <strong>${name}</strong>
                ${
                    nickname
                        ? `<span>${nickname}</span>`
                        : ""
                }
            </div>

            ${
                confirmed
                    ? `<span class="status success">
                        ✓ CONFIRMADO
                       </span>`
                    : ""
            }
        `;

        container.appendChild(card);
    });
}


// ============================================================
// FILTRO DE JOGADORES
// ============================================================

function filterPlayers() {

    const input =
        document.getElementById(
            "playerSearch"
        );

    if (!input) {
        return;
    }

    const search =
        input.value
            .trim()
            .toLowerCase();

    const cards =
        document.querySelectorAll(
            ".player-card"
        );

    cards.forEach(card => {

        const text =
            card.textContent
                .toLowerCase();

        card.style.display =
            text.includes(search)
                ? ""
                : "none";
    });
}


// ============================================================
// DECKLIST
// ============================================================

function openDeckBuilder() {

    if (!currentUser) {

        showMessage(
            "deckMessage",
            "Faça login para montar sua decklist.",
            "error"
        );

        showSection("loginSection");

        return;
    }

    showSection("deckSection");

    console.log(
        "Deck Builder aberto."
    );
}


// ============================================================
// LOGOUT
// ============================================================

async function logout() {

    if (!supabaseClient) {
        return;
    }

    try {

        const { error } =
            await supabaseClient.auth.signOut();

        if (error) {

            console.error(
                "Erro ao sair:",
                error
            );

            return;
        }

        currentUser = null;
        currentPlayer = null;

        updateHeader();

        showSection("heroSection");

        console.log(
            "Logout realizado."
        );

    } catch (error) {

        console.error(
            "Erro inesperado no logout:",
            error
        );
    }
}


// ============================================================
// RECUPERAÇÃO DE SENHA
// ============================================================

async function resetPassword() {

    if (!supabaseClient) {
        return;
    }

    const emailInput =
        document.getElementById(
            "loginEmail"
        );

    const email =
        emailInput
            ? emailInput.value.trim()
            : "";

    if (!email) {

        showMessage(
            "loginMessage",
            "Digite seu e-mail primeiro.",
            "error"
        );

        return;
    }

    try {

        const { error } =
            await supabaseClient.auth
                .resetPasswordForEmail(
                    email,
                    {
                        redirectTo:
                            window.location.origin
                    }
                );

        if (error) {

            showMessage(
                "loginMessage",
                traduzirErro(error.message),
                "error"
            );

            return;
        }

        showMessage(
            "loginMessage",
            "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.",
            "success"
        );

    } catch (error) {

        console.error(
            "Erro na recuperação:",
            error
        );

        showMessage(
            "loginMessage",
            "Não foi possível solicitar a recuperação.",
            "error"
        );
    }
}


// ============================================================
// MOSTRAR / ESCONDER SENHA
// ============================================================

function setupPasswordToggle() {

    const buttons =
        document.querySelectorAll(
            "[data-toggle-password]"
        );

    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const targetId =
                    button.getAttribute(
                        "data-toggle-password"
                    );

                const input =
                    document.getElementById(
                        targetId
                    );

                if (!input) {
                    return;
                }

                if (
                    input.type ===
                    "password"
                ) {

                    input.type =
                        "text";

                    button.textContent =
                        "Ocultar";

                } else {

                    input.type =
                        "password";

                    button.textContent =
                        "Mostrar";
                }
            }
        );
    });
}


// ============================================================
// MENSAGENS
// ============================================================

function showMessage(
    elementId,
    message,
    type = "info"
) {

    const element =
        document.getElementById(
            elementId
        );

    if (!element) {

        console.log(
            `[${type}] ${message}`
        );

        return;
    }

    element.textContent =
        message;

    element.className =
        `message ${type}`;

    element.style.display =
        "block";
}


// ============================================================
// TRADUZIR ERROS DO SUPABASE
// ============================================================

function traduzirErro(message) {

    if (!message) {
        return "Ocorreu um erro.";
    }

    const msg =
        message.toLowerCase();

    if (
        msg.includes(
            "invalid login credentials"
        )
    ) {
        return "E-mail ou senha incorretos.";
    }

    if (
        msg.includes(
            "email not confirmed"
        )
    ) {
        return "Seu e-mail ainda não foi confirmado.";
    }

    if (
        msg.includes(
            "user already registered"
        )
    ) {
        return "Este e-mail já está cadastrado.";
    }

    if (
        msg.includes(
            "password should be at least"
        )
    ) {
        return "A senha precisa ter pelo menos 6 caracteres.";
    }

    if (
        msg.includes(
            "invalid email"
        )
    ) {
        return "Digite um e-mail válido.";
    }

    if (
        msg.includes(
            "rate limit"
        )
    ) {
        return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
    }

    return message;
}


// ============================================================
// UTILITÁRIOS
// ============================================================

function getValue(id) {

    const element =
        document.getElementById(id);

    if (!element) {
        return "";
    }

    return element.value.trim();
}


function setText(id, value) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    element.textContent =
        value ?? "";
}


function setButtonLoading(
    selector,
    loading,
    text = "Carregando..."
) {

    const button =
        document.querySelector(
            selector
        );

    if (!button) {
        return;
    }

    if (loading) {

        if (!button.dataset.originalText) {
            button.dataset.originalText =
                button.textContent;
        }

        button.disabled = true;

        button.textContent =
            text;

    } else {

        button.disabled = false;

        if (button.dataset.originalText) {

            button.textContent =
                button.dataset.originalText;
        }
    }
}


function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value;

    return div.innerHTML;
}


// ============================================================
// EXPOR FUNÇÕES PARA O HTML
// ============================================================
//
// IMPORTANTE:
// Seu index.html utiliza onclick="..."
// Portanto essas funções precisam estar no window.
// ============================================================

window.showSection =
    showSection;

window.startRegistration =
    startRegistration;

window.register =
    register;

window.login =
    login;

window.logout =
    logout;

window.resetPassword =
    resetPassword;

window.copyPix =
    copyPix;

window.openDeckBuilder =
    openDeckBuilder;

window.filterPlayers =
    filterPlayers;


// ============================================================
// DEBUG
// ============================================================

console.log(
    "Pokémon TCG Tournament V2.1 carregado."
);

console.log(
    "startRegistration:",
    typeof window.startRegistration
);

console.log(
    "showSection:",
    typeof window.showSection
);

console.log(
    "Supabase:",
    supabaseClient
        ? "OK"
        : "NÃO CARREGADO"
);
