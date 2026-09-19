# Pokémon TCG Tournament

Sistema simples para inscrição em torneios de Pokémon TCG.

O projeto utiliza:

- HTML
- CSS
- JavaScript
- Supabase
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage

---

# Estrutura

pokemon-torneio/

├── index.html
├── style.css
├── script.js
└── README.md

---

# 1. Criar projeto no Supabase

O projeto já está configurado para utilizar:

https://pxqutbefvvfgokboejmr.supabase.co

A chave utilizada pelo frontend é a chave pública (publishable key).

Não coloque neste projeto nenhuma chave:

- service_role
- secret key
- chave privada

---

# 2. Criar banco de dados

Abra:

Supabase
→ SQL Editor
→ New query

Cole o SQL fornecido neste projeto e execute.

---

# 3. Criar Storage

No Supabase:

Storage
→ New bucket

Crie um bucket chamado:

payment-proofs

Configure o bucket para NÃO ser público.

Os comprovantes devem permanecer privados.

---

# 4. Authentication

No Supabase:

Authentication
→ Providers
→ Email

Ative o login por e-mail e senha.

Durante os testes, pode ser mais simples desativar:

Confirm email

Depois, quando o site estiver em produção, a confirmação de e-mail pode ser ativada.

---

# 5. Criar administrador

Primeiro crie uma conta normalmente pelo site.

Depois vá no Supabase:

Authentication
→ Users

Copie o UUID do usuário que será administrador.

Depois execute:

INSERT INTO admin_users (user_id)
VALUES ('UUID_DO_USUARIO');

Exemplo:

INSERT INTO admin_users (user_id)
VALUES ('12345678-abcd-1234-abcd-123456789abc');

---

# 6. Criar torneio

Execute no SQL Editor:

INSERT INTO tournaments
(
    name,
    tournament_date,
    location,
    price,
    pix_key
)
VALUES
(
    'Pokémon TCG Tournament',
    '2026-10-10',
    'Natal - RN',
    30.00,
    'SUA_CHAVE_PIX'
);

Altere os valores conforme o torneio.

---

# 7. GitHub Pages

Crie um repositório no GitHub.

Envie:

index.html
style.css
script.js
README.md

Depois:

Settings
→ Pages
→ Deploy from branch
→ main
→ /root

O GitHub irá gerar o endereço do site.

---

# 8. Configurar URL no Supabase

Depois de possuir o endereço do GitHub Pages:

Supabase
→ Authentication
→ URL Configuration

Configure:

Site URL

com o endereço do seu site.

Também adicione o endereço nas:

Redirect URLs

Isso é importante para recuperação de senha e autenticação.

---

# Funcionalidades atuais

## Usuário

- Cadastro
- Login
- Logout
- Recuperação de senha
- Nome completo
- Nickname
- Pokémon Player ID
- WhatsApp
- E-mail
- Área pessoal

## Torneio

- Nome
- Data
- Local
- Valor da inscrição
- Chave PIX
- Lista pública de inscritos

## Pagamento

- Status pendente
- Upload do comprovante
- Status confirmado
- Status recusado
- Confirmação feita pelo administrador

O jogador NÃO consegue alterar o próprio pagamento para confirmado.

## Lista pública

A lista de jogadores é pública.

O selo:

✓ CONFIRMADO

só aparece quando o administrador confirma o pagamento.

---

# Próxima etapa

A próxima versão pode adicionar:

- Construtor completo de deck
- Integração com TCGdex
- Pesquisa de cartas em português
- Pesquisa de cartas em inglês
- Imagens das cartas
- Contador 60/60
- Quantidade de cada carta
- Separação Pokémon / Treinador / Energia
- Salvamento da decklist
- Decklist privada
- Visualização da decklist pelo administrador
- Checklist de conferência
- Aprovação da decklist
- Painel administrativo
- Gerenciamento do torneio
- Gerenciamento de jogadores
- Visualização dos comprovantes
- Confirmação/rejeição de pagamentos

---

# Segurança

A chave utilizada no frontend é uma chave pública do Supabase.

A segurança real do sistema depende das políticas RLS configuradas no banco.

Nunca coloque uma service_role key no GitHub.

---

# Tecnologias

HTML5
CSS3
JavaScript
Supabase
GitHub Pages
TCGdex (futura integração)