# Sistema de Encomendas — Documentação Técnica Completa

> **Versão**: 1.0 · **Data**: 2026-03-25 · **Stack**: Spring Boot 3.5 + Angular 20 + PostgreSQL 16

---

## Sumário

1. [Resumo Executivo](#1-resumo-executivo)
2. [Visão Geral da Arquitetura](#2-visão-geral-da-arquitetura)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Backend — Spring Boot](#4-backend--spring-boot)
   - 4.1 [Estrutura de Pacotes](#41-estrutura-de-pacotes)
   - 4.2 [Modelos de Dados (Entidades JPA)](#42-modelos-de-dados-entidades-jpa)
   - 4.3 [Repositórios](#43-repositórios)
   - 4.4 [Serviços](#44-serviços)
   - 4.5 [Controllers e API REST](#45-controllers-e-api-rest)
   - 4.6 [DTOs](#46-dtos)
   - 4.7 [Segurança](#47-segurança)
   - 4.8 [Configuração](#48-configuração)
5. [Frontend — Angular](#5-frontend--angular)
   - 5.1 [Estrutura de Módulos](#51-estrutura-de-módulos)
   - 5.2 [Roteamento](#52-roteamento)
   - 5.3 [Serviços](#53-serviços)
   - 5.4 [Modelos TypeScript](#54-modelos-typescript)
   - 5.5 [Componentes e Páginas](#55-componentes-e-páginas)
   - 5.6 [Autenticação e Guardas](#56-autenticação-e-guardas)
   - 5.7 [Tema Dark/Light](#57-tema-darklight)
6. [Schema do Banco de Dados](#6-schema-do-banco-de-dados)
7. [Referência Completa da API](#7-referência-completa-da-api)
8. [Modelo de Segurança](#8-modelo-de-segurança)
9. [Integrações Externas](#9-integrações-externas)
10. [Infraestrutura e Deploy](#10-infraestrutura-e-deploy)
11. [Variáveis de Ambiente](#11-variáveis-de-ambiente)
12. [Guia do Desenvolvedor](#12-guia-do-desenvolvedor)
13. [Apêndices](#13-apêndices)

---

## 1. Resumo Executivo

O **Sistema de Encomendas** é uma plataforma web completa desenvolvida para a **Drogaria Benfica**, com o objetivo de digitalizar e centralizar a gestão operacional interna. O sistema abrange quatro domínios funcionais principais:

| Domínio | Funcionalidade |
|---|---|
| **Gestão de Encomendas** | Ciclo completo de pedidos: criação → recebimento → entrega → conclusão |
| **Checklist Operacional** | Quadros Kanban com tarefas diárias, controle de horários e relatórios |
| **Comunicação** | Chat em tempo real (grupo e privado) com envio de arquivos |
| **Gestão de Equipes** | Multi-tenant com hierarquia de papéis, escalas de trabalho e notificações |

**Premissas de design:**
- Um único container Docker (Nginx + Spring Boot) para minimizar custos em AWS App Runner
- Base de dados PostgreSQL gerenciada via AWS RDS
- Armazenamento de arquivos no AWS S3 (modo `aws`) ou local (modo `dev`)
- Real-time via Supabase Broadcast (sem necessidade de WebSocket server dedicado)
- Operação com custo zero durante horários ociosos via agendador EventBridge (AWS)

---

## 2. Visão Geral da Arquitetura

```
                          ┌─────────────────────────────────────────────┐
                          │          AWS App Runner Container             │
                          │                                               │
  Usuário ──── HTTPS ───► │  ┌──────────────┐    ┌──────────────────┐   │
                          │  │    Nginx :80  │    │  Spring Boot     │   │
                          │  │   (Reverse    │───►│  :8080           │   │
                          │  │    Proxy +    │    │  (REST API +     │   │
                          │  │    Angular    │◄───│   WebSocket)     │   │
                          │  │    SPA)       │    └────────┬─────────┘   │
                          │  └──────────────┘             │             │
                          └─────────────────────────────── │ ────────────┘
                                                           │
                    ┌──────────────────────────────────────┤
                    │                                       │
              ┌─────▼──────┐    ┌──────────────┐    ┌──────▼──────┐
              │  AWS RDS   │    │  Supabase    │    │   AWS S3    │
              │ PostgreSQL │    │  Realtime    │    │  (uploads)  │
              └────────────┘    └──────────────┘    └─────────────┘
                                       │
                              ┌────────▼────────┐
                              │  Browser (STOMP │
                              │  + Supabase JS) │
                              └─────────────────┘
```

### Fluxo de Requisição

```
Browser → Nginx :80
  ├─ /api/**         → proxy_pass http://127.0.0.1:8080/api/
  ├─ /ws             → proxy_pass http://127.0.0.1:8080/ws  (WebSocket nativo)
  ├─ /ws-sockjs      → proxy_pass http://127.0.0.1:8080/ws-sockjs (SockJS)
  ├─ /uploads/**     → proxy_pass http://127.0.0.1:8080/uploads/
  ├─ /actuator/**    → proxy_pass http://127.0.0.1:8080/actuator/
  └─ /**             → serve index.html (Angular SPA)
```

### Fluxo de Autenticação

```
1. POST /api/auth/login → JWT (24h)
2. Browser armazena token em localStorage
3. Toda requisição inclui: Authorization: Bearer <token>
4. JwtAuthenticationFilter valida e popula SecurityContext
5. TeamContextFilter extrai X-Team-ID → ThreadLocal
6. Controller recebe @AuthenticationPrincipal (usuario autenticado)
```

---

## 3. Stack Tecnológica

### Backend

| Tecnologia | Versão | Papel |
|---|---|---|
| Java | 21 | Linguagem |
| Spring Boot | 3.5.7 | Framework principal |
| Spring Security | 6.x | Autenticação e autorização |
| Spring Data JPA | 3.x | Persistência |
| Spring WebSocket | 6.x | Comunicação em tempo real |
| Spring Mail | 3.x | Envio de emails |
| Spring Actuator | 3.x | Health checks |
| Hibernate | 6.x | ORM |
| PostgreSQL JDBC | 16 | Driver de banco |
| JJWT | 0.12.6 | Geração e validação JWT |
| Bucket4j | 8.10.1 | Rate limiting |
| AWS SDK | 2.25.60 | Integração S3 |
| Lombok | latest | Redução de boilerplate |
| Maven | 3.9.6 | Build |

### Frontend

| Tecnologia | Versão | Papel |
|---|---|---|
| Angular | 20.3.14 | Framework SPA |
| Angular Material | 20.2.12 | UI Components |
| Angular CDK | 20.2.12 | Drag-drop, overlay |
| RxJS | 7.8 | Programação reativa |
| TypeScript | 5.9.2 | Linguagem |
| STOMP.js | 7.3.0 | WebSocket client |
| SockJS | 1.6.1 | WebSocket fallback |
| Supabase JS | 2.99.3 | Real-time broadcast |
| jsPDF + autotable | 3.0.4 / 5.0.2 | Exportação PDF |
| Sass | 1.94.0 | CSS preprocessing |

### Infraestrutura

| Serviço | Uso |
|---|---|
| Docker | Containerização |
| Nginx | Reverse proxy + SPA hosting |
| AWS App Runner | Orquestração de container |
| AWS RDS PostgreSQL | Banco de dados gerenciado |
| AWS S3 | Armazenamento de arquivos |
| AWS EventBridge | Agendamento (pause/resume) |
| Supabase | Realtime broadcast para chat |
| Gmail SMTP | Envio de emails transacionais |

---

## 4. Backend — Spring Boot

### 4.1 Estrutura de Pacotes

```
encomendas-api/
└── src/main/java/com/benfica/encomendas_api/
    ├── EncomendasApiApplication.java     # Entry point (@SpringBootApplication, @EnableScheduling)
    ├── config/
    │   ├── DataSeeder.java               # População inicial do banco
    │   ├── GlobalExceptionHandler.java   # Handler centralizado de erros
    │   ├── S3Config.java                 # Bean do cliente AWS S3
    │   ├── StartupValidator.java         # Validação de env vars na inicialização
    │   ├── WebMvcConfig.java             # Configuração MVC (CORS, resource handlers)
    │   └── WebSocketConfig.java          # Configuração STOMP WebSocket
    ├── controller/                       # REST Controllers
    ├── dto/                              # Data Transfer Objects
    ├── model/                            # Entidades JPA
    ├── repository/                       # Spring Data Repositories
    ├── security/                         # JWT, filtros, RBAC
    └── service/                          # Lógica de negócio
```

### 4.2 Modelos de Dados (Entidades JPA)

#### 4.2.1 Usuário e Equipe

**`Usuario`** (`encomendas-api/.../model/Usuario.java`)

Implementa `UserDetails` do Spring Security para integração direta com a camada de autenticação.

```java
@Entity @Table(name = "usuarios")
public class Usuario implements UserDetails {
    Long id;                    // PK auto-increment
    String email;               // UNIQUE, usado como username
    String password;            // BCrypt hash
    String nomeCompleto;
    String identificacao;       // CPF (formatado: 000.000.000-00)
    String cargo;               // Cargo/função
    String role;                // "ROLE_ADMIN" | "ROLE_USER" | "ROLE_SUPER_ADMIN"
    String telefone;
    Boolean ativo;              // Soft delete / desativação
    Equipe equipe;              // ManyToOne — equipe ativa
    String tokenResetSenha;     // UUID token para reset de senha
    LocalDateTime dataExpiracaoToken; // Expira em 15 minutos
    LocalDateTime dataCriacao;  // @CreationTimestamp
    LocalDateTime dataAtualizacao; // @UpdateTimestamp
}
```

**`Equipe`** — Multi-tenant principal. Todos os dados (encomendas, clientes, checklists) são isolados por `equipe_id`.

```java
@Entity @Table(name = "equipes")
public class Equipe {
    UUID id;
    String nome;
    String descricao;
    Usuario administrador;      // ManyToOne — criador e admin
    List<Usuario> membros;      // ManyToMany via equipe_membros
    Boolean ativa;
    LocalDateTime dataCriacao, dataAtualizacao;
}
```

**`Convite`** — Convites por email para ingresso em equipes.

#### 4.2.2 Dados Mestres

**`Cliente`** — Clientes registrados para encomendas.

```java
String codigoInterno;          // Código interno da farmácia
String cpf;                    // Opcional
List<Endereco> enderecos;      // OneToMany cascade
```

**`Fornecedor`** — Fornecedores de produtos.
```java
String cnpj;
List<Endereco> enderecos;      // OneToMany cascade
```

**`Produto`** — Catálogo de produtos.
```java
String codigo;                 // SKU interno
BigDecimal precoBase;          // Preço de referência
```

**`Endereco`** — Polimórfico: pertence a `Cliente` ou `Fornecedor` via FK nullable.
```java
String cep, bairro, rua, numero, complemento, cidade, uf;
```

#### 4.2.3 Encomendas

**`Encomenda`** — Pedido principal.

```java
@Entity @Table(name = "encomendas",
    indexes = { equipe_id, cliente_id, status, data_criacao })
public class Encomenda {
    UUID id;
    Equipe equipe;
    Cliente cliente;
    List<EncomendaItem> itens;  // OneToMany cascade; mantém relacionamento bidirecional
    String status;              // Máquina de estados (ver abaixo)
    String observacoes;
    BigDecimal valorAdiantamento, valorTotal;
    Boolean notaFutura;         // Pedido aguardando emissão de nota fiscal
    Boolean vendaEstoqueNegativo; // Venda a descoberto
    Boolean apenasEncomenda;    // Pedido puro, sem estoque
    String enderecoRua, enderecoNumero, enderecoCep,
           enderecoBairro, enderecoComplemento;
    LocalDate dataEstimadaEntrega;
    LocalDateTime dataCriacao;
    List<EncomendaHistorico> historico; // OrderedBy dataAlteracao
}
```

**Máquina de estados de `Encomenda`:**

```
Encomenda Criada ──avancar──► Mercadoria em Loja ──avancar──► Aguardando Entrega ──avancar──► Concluído
        │                              │                               │
        └──────────────────── cancelar ► Cancelado ◄──────────────────┘
                                         │
                                    descancelar (retorna ao status anterior)
```

**`EncomendaItem`** — Item de uma encomenda.
```java
Produto produto;
Fornecedor fornecedor;   // Opcional
int quantidade;
BigDecimal precoCotado, subtotal;
```

**`EncomendaHistorico`** — Auditoria imutável de mudanças de status.
```java
String status, nomeUsuario;
LocalDateTime dataAlteracao;
```

#### 4.2.4 Checklists (Kanban)

O sistema de checklists modela um quadro Kanban com três níveis de hierarquia:

```
ChecklistBoard (coluna)
  └── ChecklistCard (card)
        ├── ChecklistItem (tarefa checkbox)
        └── ChecklistAnexo (arquivo anexado)

ChecklistLog (registro de quem marcou cada item e quando)
```

**`ChecklistBoard`** — Coluna do Kanban.
```java
String nome;
Equipe equipe;
Usuario usuarioEspecifico;  // Opcional: board pessoal para um funcionário específico
Integer ordem;
Boolean ativo;
```

**`ChecklistCard`** — Card dentro de um board. Possui janela de tempo de operação.
```java
String titulo, descricao;
LocalTime horarioAbertura, horarioFechamento;  // Define quando o card está "ABERTO"
Integer ordem;
```

**Status calculado em runtime** (não persistido):

| Condição | Status |
|---|---|
| Antes do horarioAbertura | `PENDENTE` |
| Entre abertura e fechamento | `ABERTO` |
| Após horarioFechamento | `FECHADO` |
| Sem horário definido | `CONFIG` |
| Data passada (histórico) | `HISTORICO` |

**`ChecklistLog`** — Registro de marcação/desmarcação de um item por um usuário em uma data específica.
```java
ChecklistItem item;   // FK → ON DELETE CASCADE
Usuario usuario;
LocalDate dataReferencia;  // Data do dia que está sendo registrado
LocalDateTime dataHoraAcao;
Boolean valor;  // true = marcado, false = desmarcado
```

> **Nota de implementação:** Ao deletar boards/cards/items, os logs associados devem ser deletados manualmente antes, pois a FK `checklist_logs.item_id` não possui `CASCADE DELETE` automático configurado.

#### 4.2.5 Chat

```
Conversa (GRUPO ou PRIVADO)
  └── MensagemChat
        └── MensagemAnexo (arquivos)

LeituraMensagem (rastreamento de "última leitura" por usuário)
```

**`Conversa`**
```java
enum TipoConversa { GRUPO, PRIVADO }
Equipe equipe;
Usuario participanteA, participanteB;  // Apenas para PRIVADO
String nomeGrupo;  // Apenas para GRUPO
```

**`MensagemChat`**
```java
Conversa conversa;
Usuario remetente;
String conteudo;   // TEXT, pode ser null (apenas arquivo)
Boolean deletada;  // Soft delete
LocalDateTime enviadoEm;
List<MensagemAnexo> anexos;
```

**`LeituraMensagem`** — Uma entrada por usuário por conversa, com timestamp da última mensagem lida.

#### 4.2.6 Notificações e Escala

**`Notificacao`**
```java
Equipe equipe;
Usuario destinatario, remetente;  // remetente = null → notificação de sistema
String titulo, mensagem;
Boolean lida;
String chaveDedup;  // UNIQUE — previne duplicatas ao reenviar
LocalDateTime dataEnvio;
```

**`EscalaTrabalho`** — Um registro por usuário por dia.
```java
enum TipoEscala { TRABALHO, FOLGA, FERIAS, PONTO_FACULTATIVO, ... }
Usuario usuario;
LocalDate data;        // UNIQUE constraint com usuario
LocalTime horarioInicio, horarioFim;
String observacao;
```

---

### 4.3 Repositórios

Todos os repositórios estendem `JpaRepository<Entidade, IdType>` do Spring Data, com queries JPQL personalizadas quando necessário.

| Repositório | Queries Notáveis |
|---|---|
| `UsuarioRepository` | `findByEmail(String)` |
| `EquipeRepository` | `findByAdministradorOrMembrosContaining(u, u)` |
| `EncomendaRepository` | `findByEquipeIdOrderByDataCriacaoDesc(id, pageable)` |
| `ClienteRepository` | `findByEquipeId`, `findByEquipeIdAndNomeContaining` |
| `ChecklistBoardRepository` | `findByEquipeId`, `findByEquipeAndUsuarioEspecifico` |
| `ChecklistLogRepository` | `findByUsuarioIdAndDataReferencia` |
| `ConversaRepository` | `findAllForUser(equipeId, userId)`, `findPrivado(userA, userB)` |
| `MensagemChatRepository` | `findByConversaIdOrderByEnviadoEm(id, pageable)` (30/página) |
| `NotificacaoRepository` | `findByDestinatarioIdOrderByDataEnvioDesc` |
| `EscalaTrabalhoRepository` | `findByUsuarioIdAndDataBetween` |

---

### 4.4 Serviços

#### `EncomendaService`
Orquestra o ciclo de vida de encomendas: validação de permissão de equipe, progressão de status, registro automático de histórico, e cálculo de `valorTotal` a partir dos itens.

**Progressão de status:**
```
avancarEtapa()  → "Encomenda Criada" → "Mercadoria em Loja" → "Aguardando Entrega" → "Concluído"
retornarEtapa() → inverte o fluxo
cancelarEncomenda() → marca como "Cancelado" (qualquer estado)
```

#### `ChecklistService`
Diferencia a visão de **funcionário** (respeita escala de trabalho) da visão de **admin** (todos os boards). Calcula o status de cada card em runtime com base no horário atual.

```java
// Verifica se o usuário tem EscalaTrabalho do tipo TRABALHO no dia solicitado
// Se não tiver, retorna lista vazia → funcionário não vê checklist fora do turno
List<ChecklistBoardDTO> getChecklistDoDia(equipeId, usuarioId, data)
```

#### `ChatService`
Gerencia conversas e mensagens. Após salvar uma mensagem, delega o broadcast assíncrono ao `SupabaseBroadcastService` para notificar outros participantes em tempo real.

```java
// Cria ou recupera uma conversa de grupo (singleton por equipe)
Conversa getOrCreateGrupo(equipeId)

// Cria ou recupera uma conversa privada (par de usuários)
Conversa getOrCreatePrivado(equipeId, userA, userB)
```

#### `NotificacaoService`
Envia notificações com deduplicação via `chaveDedup`. A chave é composta por `equipeId + destinatarioId + titulo + conteúdo`, prevenindo duplicatas ao reenviar.

#### `FileUploadService` / `StorageService`
Abstração de armazenamento com duas implementações:
- `LocalStorageService` — salva em `/app/uploads/`, serve via `/uploads/**`
- `S3StorageService` — upload para bucket S3, retorna URL pública

A escolha entre elas é feita por Spring Profile (`dev` / `aws`).

#### `SupabaseBroadcastService`
Realiza chamadas HTTP para a API REST do Supabase Realtime de forma **assíncrona** (`CompletableFuture`), sem bloquear a thread que processa a requisição.

```java
// Após salvar mensagem, broadcast para o canal "chat:{conversaId}"
broadcastAsync("chat:" + conversaId, "mensagem", mensagemDTO)
```

#### `EmailService`
Wrapper do Spring Mail com templates de mensagem para:
- Reset de senha (link com token)
- Convite para equipe
- Tickets de suporte

#### `DataSeeder`
Executa uma única vez na inicialização quando o banco está vazio. Cria a equipe padrão "Benfica" e popula ~28 usuários com dados reais (nome, CPF, telefone, cargo). A senha padrão vem das variáveis de ambiente `APP_SEEDER_ADMIN_PASSWORD` e `APP_SEEDER_USER_PASSWORD`.

---

### 4.5 Controllers e API REST

> **Convenção:** Todos os endpoints abaixo de `/api/**` exceto `/api/auth/**` requerem `Authorization: Bearer <jwt>`.

#### `AuthController` — `/api/auth`

| Método | Endpoint | Body | Response | Descrição |
|---|---|---|---|---|
| POST | `/login` | `LoginRequest` | `JwtAuthenticationResponse` | Autenticação |
| POST | `/register` | `RegisterRequestDTO` | `200 OK` | Cadastro com chave |
| POST | `/forgot-password` | `ForgotPasswordDTO` | `200 OK` | Solicitar reset |
| POST | `/reset-password` | `ResetPasswordDTO` | `200 OK` | Redefinir senha |

`JwtAuthenticationResponse`:
```json
{ "accessToken": "...", "role": "ROLE_ADMIN", "nome": "João Silva", "id": 1 }
```

#### `EncomendaController` — `/api/encomendas`

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/` | Lista paginada (`?page=0&size=20`) |
| GET | `/{id}` | Detalhes de uma encomenda |
| POST | `/` | Criar encomenda |
| PATCH | `/{id}/avancar` | Avançar status |
| PATCH | `/{id}/retornar` | Retroceder status |
| PATCH | `/{id}/cancelar` | Cancelar |
| PATCH | `/{id}/descancelar` | Desfazer cancelamento |
| DELETE | `/{id}` | Deletar (só se status = "Encomenda Criada") |

#### `ChecklistController` — `/api/checklists`

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/dia` | Visão diária do funcionário (respeita escala) |
| GET | `/boards` | Visão admin (todos os boards) |
| POST | `/log` | Marcar/desmarcar item |
| POST | `/boards` | Criar board |
| PATCH | `/boards/{id}` | Renomear board |
| DELETE | `/boards/{id}` | Deletar board (cascade) |
| POST | `/cards` | Criar card |
| PATCH | `/cards/{id}` | Atualizar card |
| DELETE | `/cards/{id}` | Deletar card |
| POST | `/cards/{id}/mover` | Mover card para outro board |
| POST | `/itens` | Adicionar item |
| DELETE | `/itens/{id}` | Deletar item |
| PUT | `/boards/reordenar` | Persistir ordem dos boards |
| PUT | `/cards/reordenar` | Persistir ordem dos cards |
| GET | `/relatorio` | Relatório de atividade |

#### `ChatController` — `/api/chat`

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/conversas?equipeId=` | Listar conversas do usuário |
| POST | `/conversas` | Criar/obter conversa |
| GET | `/mensagens?conversaId=&page=` | Mensagens paginadas (30/página) |
| POST | `/mensagens/upload` | Upload de arquivo (multipart, max 10MB) |
| POST | `/mensagens/enviar` | Enviar mensagem |
| POST | `/mensagens/{id}/lida` | Marcar conversa como lida |
| GET | `/badge?equipeId=` | Contagem total de não lidas |

#### `NotificacaoController` — `/api/notificacoes`

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/` | Notificações do usuário autenticado |
| GET | `/count` | Contagem de não lidas |
| POST | `/enviar` | Enviar notificação |
| POST | `/{id}/ler` | Marcar como lida |
| POST | `/ler-todas` | Marcar todas como lidas |
| DELETE | `/limpar` | Deletar todas |

#### `EquipeController` — `/api/equipes`

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/` | Minhas equipes |
| POST | `/` | Criar equipe (ADMIN+) |
| GET | `/membros` | Membros da equipe ativa |
| GET | `/{id}/membros` | Membros de equipe específica |
| DELETE | `/membros/{usuarioId}` | Remover membro |
| POST | `/{id}/convidar` | Convidar por email |
| GET | `/{id}/convites` | Convites enviados |
| GET | `/meus-convites` | Convites recebidos |
| POST | `/convites/{id}/aceitar` | Aceitar convite |

#### Outros Controllers

| Controller | Base Path | Funcionalidade |
|---|---|---|
| `ClienteController` | `/api/clientes` | CRUD + busca por nome |
| `FornecedorController` | `/api/fornecedores` | CRUD + busca por nome |
| `ProdutoController` | `/api/produtos` | CRUD + busca |
| `EscalaTrabalhoController` | `/api/escalas` | CRUD de escalas + replicação em massa |
| `UsuarioController` | `/api/usuarios` | Perfil + troca de senha |
| `SupportController` | `/api/suporte` | Envio de tickets por email |
| `ImportacaoController` | `/api/importacao` | Importação em lote (CSV/Excel) |
| `ChatWsController` | STOMP `/app/chat` | WebSocket STOMP (fallback ao Supabase) |

---

### 4.6 DTOs

Os DTOs garantem que a API exponha apenas os campos necessários e evitam a exposição direta das entidades JPA.

**Validações aplicadas (Jakarta Validation):**

| Campo | Anotações |
|---|---|
| `email` | `@NotBlank`, `@Email`, `@Size(max=254)` |
| `password` | `@NotBlank`, `@Size(min=8, max=128)` |
| `nomeCompleto` | `@NotBlank`, `@Size(max=150)` |
| `registrationKey` | `@NotBlank`, `@Size(max=100)` |
| `conteudo` (chat) | `@Size(max=4000)` |
| `titulo` (notificação) | `@NotBlank`, `@Size(max=150)` |
| `mensagem` (notificação) | `@NotBlank`, `@Size(max=1000)` |
| `urlsAnexos` | `@Size(max=10)` |

**`GlobalExceptionHandler`** captura `MethodArgumentNotValidException` e retorna:
```json
{
  "field": "email",
  "message": "Email inválido",
  "status": 400
}
```

---

### 4.7 Segurança

#### Cadeia de Filtros Spring Security

```
Request
  │
  ▼
RateLimitFilter          ← Bucket4j: limita requisições por IP por endpoint
  │
  ▼
JwtAuthenticationFilter  ← Extrai e valida Bearer token
  │
  ▼
TeamContextFilter         ← Extrai X-Team-ID → TeamContextHolder (ThreadLocal)
  │
  ▼
UsernamePasswordAuthenticationFilter (desabilitado — JWT é stateless)
  │
  ▼
Controller
```

#### `RateLimitFilter`

Protege endpoints sensíveis contra brute-force. Cada limite é por IP (extrai de `X-Forwarded-For` para suporte a load balancers).

| Endpoint | Limite |
|---|---|
| `POST /api/auth/login` | 5 req / 1 min |
| `POST /api/auth/forgot-password` | 3 req / 15 min |
| `POST /api/auth/register` | 10 req / 1 hora |
| `POST /api/auth/reset-password` | 5 req / 15 min |

Resposta ao exceder:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
Content-Type: application/json

{"error":"Muitas tentativas. Tente novamente mais tarde."}
```

#### `JwtTokenProvider`

- Algoritmo: HMAC-SHA256
- Expiração: 24 horas (86.400.000 ms)
- Segredo: `APP_JWT_SECRET` (env var obrigatória, mínimo 256 bits)
- Subject: email do usuário
- Claims adicionais: `userId`, `role`

#### `TeamContextFilter`

Extrai o header `X-Team-ID` de cada requisição e armazena no `TeamContextHolder` (ThreadLocal). Os serviços consultam este contexto para garantir que todas as queries sejam filtradas pela equipe correta.

```java
// Uso nos serviços:
UUID equipeId = TeamContextHolder.getEquipeId();
```

#### RBAC (Role-Based Access Control)

| Role | Permissões |
|---|---|
| `ROLE_USER` | Ver checklists, chat, notificações, próprio perfil, própria escala |
| `ROLE_ADMIN` | Tudo de USER + criar equipe, gerenciar membros, criar checklists, gerenciar escalas, enviar notificações |
| `ROLE_SUPER_ADMIN` | Tudo de ADMIN + acesso cross-team |

#### WebSocket Authentication

```java
// WebSocketAuthChannelInterceptor
// Valida JWT no header antes de estabelecer conexão STOMP
preSend(message) → extrai token → JwtTokenProvider.validateToken()
```

---

### 4.8 Configuração

#### `application.properties` (principais propriedades)

```properties
# Servidor
server.port=8080
spring.application.name=encomendas-api

# Banco de dados (via env vars)
spring.datasource.url=${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/sistema_encomendas}
spring.datasource.username=${SPRING_DATASOURCE_USERNAME:postgres}
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD}

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.jdbc.batch_size=50

# Connection pool (HikariCP)
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5

# JWT
app.jwtSecret=${APP_JWT_SECRET}
app.jwtExpirationMs=86400000

# Chaves de registro
app.registrationKey=${APP_REGISTRATION_KEY}
app.adminRegistrationKey=${APP_ADMIN_REGISTRATION_KEY}

# Email (Gmail SMTP)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${SPRING_MAIL_USERNAME:}
spring.mail.password=${SPRING_MAIL_PASSWORD:}

# Compressão gzip
server.compression.enabled=true
server.compression.mime-types=application/json,application/javascript,text/css

# Atuator
management.endpoints.web.exposure.include=health
```

#### `DataSeeder`

A classe `DataSeeder` executa na inicialização apenas se o banco estiver vazio (verificação idempotente). Ela popula:
- Equipe "Benfica" com um administrador
- ~28 funcionários com dados reais (nome, CPF formatado, telefone, cargo)
- Senhas a partir de `APP_SEEDER_ADMIN_PASSWORD` e `APP_SEEDER_USER_PASSWORD`

Para reexecutar o seeder (ex: reset do banco em produção), é necessário truncar as tabelas manualmente.

#### `StartupValidator`

Verifica na inicialização que todas as variáveis de ambiente obrigatórias estão presentes e com valores válidos:
- `APP_JWT_SECRET` (mínimo de comprimento para HMAC-SHA256)
- `APP_REGISTRATION_KEY`, `APP_ADMIN_REGISTRATION_KEY`
- Conectividade com o banco de dados

Se alguma falhar, a aplicação aborta com mensagem clara, evitando inicialização com configuração inválida.

---

## 5. Frontend — Angular

### 5.1 Estrutura de Módulos

O frontend usa **standalone components** (Angular 17+), sem `NgModule` clássicos. Cada página é carregada com **lazy loading** via `loadComponent()`.

```
encomendas-web/src/app/
├── app.config.ts                 # Bootstrap config (providers, router, HTTP)
├── app.routes.ts                 # Roteamento principal
├── core/
│   ├── auth/
│   │   ├── auth.service.ts       # Login/logout/JWT storage
│   │   ├── auth.guard.ts         # Route guard (CanActivate)
│   │   └── auth.interceptor.ts   # HTTP interceptor (Bearer token)
│   ├── team/
│   │   └── team.service.ts       # Equipe ativa, cache, CRUD
│   ├── theme/
│   │   └── theme.service.ts      # Dark/light mode
│   ├── models/                   # TypeScript interfaces
│   └── services/                 # Serviços de API
├── layout/
│   ├── main/                     # Shell component (sidebar + navbar + router-outlet)
│   ├── navbar/                   # Barra superior
│   └── sidebar/                  # Menu lateral
├── pages/                        # Páginas lazy-loaded
├── components/
│   └── dialogs/                  # Dialogs reutilizáveis
├── login/                        # Login page
│   └── register/                 # Registro
└── shared/
    └── directives/               # Máscaras de input (CPF, CEP, CNPJ, telefone)
```

### 5.2 Roteamento

```typescript
// app.routes.ts (resumido)
export const routes: Routes = [
  { path: 'login',    component: LoginPage },
  { path: 'register', component: RegisterPage },
  { path: 'forgot-password', component: ForgotPasswordPage },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],           // Requer autenticação
    children: [
      { path: '',           redirectTo: 'dashboard' },
      { path: 'dashboard',  loadComponent: () => import('./dashboard/dashboard') },
      { path: 'clientes',   loadComponent: () => import('./pages/clientes/...') },
      { path: 'fornecedores', loadComponent: () => ... },
      { path: 'produtos',   loadComponent: () => ... },
      { path: 'encomendas', loadComponent: () => ... },
      { path: 'encomendas/nova', loadComponent: () => ... },
      { path: 'encomendas/:id',  loadComponent: () => ... },
      { path: 'equipes',    loadComponent: () => ... },
      { path: 'gestao-equipes', loadComponent: () => ... },
      { path: 'checklists',     loadComponent: () => ... },  // Funcionário
      { path: 'admin/checklists', loadComponent: () => ... }, // Admin
      { path: 'admin/escalas',    loadComponent: () => ... }, // Admin
      { path: 'meu-calendario',   loadComponent: () => ... },
      { path: 'chat',       loadComponent: () => ... },
      { path: 'perfil',     loadComponent: () => ... },
    ]
  },
  { path: '**', redirectTo: '/login' }
];
```

### 5.3 Serviços

#### `AuthService`

Gerencia toda a sessão do usuário. Persiste no `localStorage`:

| Chave | Valor |
|---|---|
| `auth_token` | JWT completo |
| `user_role` | `ROLE_ADMIN` / `ROLE_USER` |
| `user_name` | Nome completo do usuário |
| `user_id` | ID numérico |
| `active_team_id` | UUID da equipe ativa |

```typescript
login(email, password): Observable<JwtResponse>
logout(): void                    // Limpa localStorage + redirect
getToken(): string | null
getUser(): { id, nome, role } | null
isAdmin(): boolean
isLoggedIn(): boolean
```

#### `TeamService`

Mantém cache das equipes do usuário para evitar requisições redundantes. O `active_team_id` é enviado via header `X-Team-ID` em todas as requisições através do interceptor.

```typescript
getEquipeAtivaId(): string | null        // Lê do localStorage
fetchEquipesDoUsuario(): Observable<[]>  // Busca com cache
selecionarEquipe(equipe): void          // Salva active_team_id + reload
invalidarCacheEquipes(): void
```

#### `NotificacaoService`

Possui cache TTL duplo para reduzir polling:
- Lista de notificações: **30 segundos** de TTL
- Contador de não lidas: **15 segundos** de TTL

O Navbar faz polling a cada 60 segundos para atualizar o badge.

#### `ChatService`

Gerencia tanto as chamadas REST quanto as assinaturas Supabase Realtime:

```typescript
// REST
getConversas(equipeId): Observable<Conversa[]>
getMensagens(conversaId, page): Observable<MensagemChat[]>
enviarMensagem(req): Observable<MensagemChat>
marcarLida(conversaId): Observable<void>

// Supabase Realtime
connect(userId): void          // Assina canal badge:${userId}
subscribeToConversa(id): void  // Assina canal chat:${conversaId}
messages$: Observable<MensagemChat>  // Stream de mensagens recebidas
badge$: Observable<number>           // Stream de contagem de não lidas
```

#### `ChecklistService`

```typescript
// Funcionário
getChecklistDoDia(equipeId, data?, usuarioIdAlvo?): Observable<ChecklistBoard[]>
registrarAcao(request, usuarioId?): Observable<void>

// Admin
getBoardsAdmin(equipeId): Observable<ChecklistBoard[]>
criarBoard(nome, equipeId, usuarioId?): Observable<ChecklistBoard>
adicionarItem(cardId, descricao): Observable<ChecklistItem>  // Retorna item com ID real
```

### 5.4 Modelos TypeScript

```typescript
// encomenda.interfaces.ts
interface PagedResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// chat.interfaces.ts
type TipoConversa = 'GRUPO' | 'PRIVADO';
type TipoAnexo = 'IMG' | 'PDF' | 'DOC' | 'LINK';

interface Conversa {
  id: string;
  tipo: TipoConversa;
  nomeExibicao: string;
  outroUsuarioId?: number;
  ultimaMensagem?: string;
  ultimaMensagemEm?: string;
  naoLidas: number;
}

// checklist.interfaces.ts
type ChecklistStatus = 'ABERTO' | 'FECHADO' | 'PENDENTE' | 'HISTORICO' | 'CONFIG';

interface ChecklistCard {
  id: string;
  titulo: string;
  status: ChecklistStatus;
  itens: ChecklistItem[];
  horarioAbertura?: string;   // "HH:mm"
  horarioFechamento?: string;
}
```

### 5.5 Componentes e Páginas

#### Layout

**`MainLayout`** — Shell component que envolve todas as páginas autenticadas. Gerencia:
- Responsividade mobile (sidebar como drawer vs coluna fixa)
- Emissão do evento de toggle do menu via `EventEmitter`

**`Sidebar`** — Menu de navegação lateral com:
- Ícones Material
- Links baseados em role (ADMIN vê opções extras)
- Seletor de equipe ativa

**`Navbar`** — Barra superior com:
- Nome do usuário / logout
- Badge de notificações (polling 60s)
- Toggle dark/light theme
- Dropdown de equipes

#### Páginas Principais

**`ChecklistDia` (funcionário)**
- Visualização Kanban de boards do dia
- Drag-and-drop de colunas (CDK `cdkDropList` horizontal)
- Drag-and-drop de cards entre colunas (CDK cross-list)
- Checkbox items com feedback visual imediato
- Cores de status: ABERTO (verde), FECHADO (vermelho), PENDENTE (amarelo)

**`ChecklistCriador` (admin)**
- Interface de criação de estrutura Kanban
- Drag-and-drop para reordenar boards e cards
- Configuração de horários de abertura/fechamento por card
- Atribuição de boards a funcionários específicos

**`Chat`**
- Lista de conversas (grupo + privadas) no painel esquerdo
- Área de mensagens com scroll infinito (paginação por página)
- Upload de arquivos (drag-drop + clique)
- Real-time via Supabase: sem necessidade de refresh
- Renderização de anexos por tipo (imagem inline, link para PDF/DOC)

**`EncomendaCreate`**
- Formulário multi-etapa: selecionar cliente → adicionar itens → dados de entrega
- Busca de clientes por nome com autocomplete
- Adição de itens com seletor de produto, fornecedor, quantidade e preço
- Cálculo de subtotal e total em tempo real

**`EscalaAdmin`**
- Calendário interativo para gestão de escalas
- Seletor de funcionário
- Criação individual e replicação em massa (batch)
- Tipos de escala com cores distintas

#### Dialogs

Todos os dialogs são implementados como `MatDialog` com dados injetados via `MAT_DIALOG_DATA`:

| Dialog | Dados injetados | Funcionalidade |
|---|---|---|
| `ChecklistCardDialog` | `{ card, equipeId }` | Editar card, adicionar itens e anexos |
| `ClienteFormDialog` | `{ cliente? }` | Criar/editar cliente |
| `FornecedorFormDialog` | `{ fornecedor? }` | Criar/editar fornecedor |
| `EnviarNotificacaoDialog` | `{ equipeId, membros }` | Enviar notificação (broadcast ou individual) |
| `EscalaFormDialog` | `{ usuario, data }` | Criar/editar escala |
| `NotificacaoDetalheDialog` | `notificacao` | Visualizar detalhes |
| `SuporteTicketDialog` | — | Enviar ticket de suporte |

#### Diretivas de Máscara

Aplicam formatação automática durante a digitação:

| Diretiva | Máscara | Exemplo |
|---|---|---|
| `cpfMask` | `000.000.000-00` | `123.456.789-00` |
| `cnpjMask` | `00.000.000/0000-00` | `12.345.678/0001-00` |
| `cepMask` | `00000-000` | `12345-678` |
| `phoneMask` | `(00) 00000-0000` | `(21) 99999-9999` |

### 5.6 Autenticação e Guardas

**`authGuard`** (função `CanActivateFn`):
```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  if (auth.isLoggedIn()) return true;
  inject(Router).navigate(['/login']);
  return false;
};
```

**`AuthInterceptor`** (interceptor HTTP funcional):
```typescript
// Adiciona token em toda requisição autenticada
headers = request.headers.set('Authorization', `Bearer ${token}`);
// Redireciona para login em 401
if (error.status === 401) router.navigate(['/login']);
```

O header `X-Team-ID` também é adicionado automaticamente pelo interceptor para todas as requisições à API.

### 5.7 Tema Dark/Light

**Implementação via CSS class no `<body>`:**

```typescript
// ThemeService
toggleTheme() {
  const isDark = !this.isDarkSubject.value;
  document.body.classList.toggle('dark-theme', isDark);
  localStorage.setItem('dark-mode', isDark.toString());
}
```

**Padrão SCSS por componente:**
```scss
// Estilos padrão (light)
.card { background: white; color: #333; }

// Overrides para dark theme
:host-context(.dark-theme) {
  .card { background: #1e1e1e; color: #e0e0e0; }
}
```

Todos os componentes implementam este padrão com `:host-context(.dark-theme)`, garantindo que o tema seja aplicado de forma consistente sem variáveis CSS globais.

---

## 6. Schema do Banco de Dados

```sql
-- =============================================
-- USUÁRIOS E EQUIPES
-- =============================================

CREATE TABLE usuarios (
  id                    BIGSERIAL PRIMARY KEY,
  email                 VARCHAR(254) UNIQUE NOT NULL,
  password              VARCHAR(255) NOT NULL,         -- BCrypt hash
  nome_completo         VARCHAR(150) NOT NULL,
  identificacao         VARCHAR(20),                   -- CPF formatado
  cargo                 VARCHAR(100),
  role                  VARCHAR(30) NOT NULL,           -- ROLE_ADMIN | ROLE_USER
  telefone              VARCHAR(20),
  ativo                 BOOLEAN DEFAULT TRUE,
  equipe_id             UUID REFERENCES equipes(id),
  token_reset_senha     VARCHAR(128),
  data_expiracao_token  TIMESTAMP,
  data_criacao          TIMESTAMP DEFAULT NOW(),
  data_atualizacao      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE equipes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome              VARCHAR(150) NOT NULL,
  descricao         TEXT,
  administrador_id  BIGINT REFERENCES usuarios(id),
  ativa             BOOLEAN DEFAULT TRUE,
  data_criacao      TIMESTAMP DEFAULT NOW(),
  data_atualizacao  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE equipe_membros (                          -- Junction table ManyToMany
  equipe_id   UUID    REFERENCES equipes(id),
  usuario_id  BIGINT  REFERENCES usuarios(id),
  PRIMARY KEY (equipe_id, usuario_id)
);

CREATE TABLE convites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id       UUID REFERENCES equipes(id),
  email_destino   VARCHAR(254) NOT NULL,
  status          VARCHAR(20) DEFAULT 'PENDENTE',
  criado_em       TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- DADOS MESTRES
-- =============================================

CREATE TABLE clientes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id        UUID REFERENCES equipes(id) NOT NULL,
  nome             VARCHAR(150) NOT NULL,
  codigo_interno   VARCHAR(50),
  cpf              VARCHAR(20),
  email            VARCHAR(254),
  telefone         VARCHAR(20),
  criado_em        TIMESTAMP DEFAULT NOW(),
  atualizado_em    TIMESTAMP DEFAULT NOW(),
  INDEX            idx_clientes_equipe (equipe_id),
  INDEX            idx_clientes_email (email),
  INDEX            idx_clientes_cpf (cpf),
  INDEX            idx_clientes_codigo (codigo_interno)
);

CREATE TABLE fornecedores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id     UUID REFERENCES equipes(id) NOT NULL,
  nome          VARCHAR(150) NOT NULL,
  cnpj          VARCHAR(20),
  email         VARCHAR(254),
  telefone      VARCHAR(20),
  criado_em     TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  INDEX         idx_fornecedores_equipe (equipe_id)
);

CREATE TABLE produtos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id     UUID REFERENCES equipes(id) NOT NULL,
  nome          VARCHAR(150) NOT NULL,
  codigo        VARCHAR(50),                           -- SKU
  descricao     TEXT,
  preco_base    DECIMAL(12,2),
  criado_em     TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  INDEX         idx_produtos_equipe (equipe_id)
);

CREATE TABLE enderecos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id    UUID REFERENCES clientes(id)    ON DELETE CASCADE,
  fornecedor_id UUID REFERENCES fornecedores(id) ON DELETE CASCADE,
  cep           VARCHAR(10),
  bairro        VARCHAR(100),
  rua           VARCHAR(150),
  numero        VARCHAR(20),
  complemento   VARCHAR(100),
  cidade        VARCHAR(100),
  uf            VARCHAR(2)
);

-- =============================================
-- ENCOMENDAS
-- =============================================

CREATE TABLE encomendas (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id                UUID   REFERENCES equipes(id) NOT NULL,
  cliente_id               UUID   REFERENCES clientes(id),
  status                   VARCHAR(50) NOT NULL,
  observacoes              TEXT,
  valor_adiantamento       DECIMAL(12,2),
  valor_total              DECIMAL(12,2),
  nota_futura              BOOLEAN DEFAULT FALSE,
  venda_estoque_negativo   BOOLEAN DEFAULT FALSE,
  apenas_encomenda         BOOLEAN DEFAULT FALSE,
  endereco_cep             VARCHAR(10),
  endereco_bairro          VARCHAR(100),
  endereco_rua             VARCHAR(150),
  endereco_numero          VARCHAR(20),
  endereco_complemento     VARCHAR(100),
  data_estimada_entrega    DATE,
  data_criacao             TIMESTAMP DEFAULT NOW(),
  INDEX                    idx_encomendas_equipe (equipe_id),
  INDEX                    idx_encomendas_cliente (cliente_id),
  INDEX                    idx_encomendas_status (status),
  INDEX                    idx_encomendas_data (data_criacao)
);

CREATE TABLE encomenda_itens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encomenda_id  UUID REFERENCES encomendas(id) ON DELETE CASCADE NOT NULL,
  produto_id    UUID REFERENCES produtos(id),
  fornecedor_id UUID REFERENCES fornecedores(id),
  quantidade    INT NOT NULL,
  preco_cotado  DECIMAL(12,2),
  subtotal      DECIMAL(12,2),
  INDEX         idx_encomenda_itens_encomenda (encomenda_id)
);

CREATE TABLE encomenda_historico (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encomenda_id  UUID REFERENCES encomendas(id) ON DELETE CASCADE,
  status        VARCHAR(50),
  data_alteracao TIMESTAMP DEFAULT NOW(),
  nome_usuario  VARCHAR(150)
);

-- =============================================
-- CHECKLISTS (KANBAN)
-- =============================================

CREATE TABLE checklist_boards (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                   VARCHAR(150) NOT NULL,
  equipe_id              UUID REFERENCES equipes(id) NOT NULL,
  usuario_especifico_id  BIGINT REFERENCES usuarios(id),  -- NULL = board geral
  ordem                  INT DEFAULT 0,
  ativo                  BOOLEAN DEFAULT TRUE,
  data_criacao           TIMESTAMP DEFAULT NOW(),
  INDEX                  idx_boards_equipe (equipe_id),
  INDEX                  idx_boards_usuario (usuario_especifico_id),
  INDEX                  idx_boards_ordem (ordem)
);

CREATE TABLE checklist_cards (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo             VARCHAR(150) NOT NULL,
  descricao          TEXT,
  horario_abertura   TIME,
  horario_fechamento TIME,
  board_id           UUID REFERENCES checklist_boards(id) ON DELETE CASCADE,
  ordem              INT DEFAULT 0,
  INDEX              idx_cards_board (board_id)
);

CREATE TABLE checklist_itens (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao TEXT NOT NULL,
  card_id   UUID REFERENCES checklist_cards(id) ON DELETE CASCADE,
  ordem     INT DEFAULT 0,
  INDEX     idx_itens_card (card_id)
);

CREATE TABLE checklist_anexos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_arquivo  VARCHAR(255),
  url           TEXT,
  tipo          VARCHAR(10),    -- IMG | PDF | DOC | LINK
  card_id       UUID REFERENCES checklist_cards(id) ON DELETE CASCADE
);

CREATE TABLE checklist_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         UUID REFERENCES checklist_itens(id),  -- SEM CASCADE (manual)
  usuario_id      BIGINT REFERENCES usuarios(id),
  data_referencia DATE NOT NULL,
  data_hora_acao  TIMESTAMP DEFAULT NOW(),
  valor           BOOLEAN NOT NULL,                     -- true = marcado
  INDEX           idx_logs_data (data_referencia),
  INDEX           idx_logs_item (item_id)
);

-- =============================================
-- CHAT E MENSAGENS
-- =============================================

CREATE TABLE conversas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo              VARCHAR(10) NOT NULL,   -- GRUPO | PRIVADO
  equipe_id         UUID REFERENCES equipes(id),
  participante_a_id BIGINT REFERENCES usuarios(id),
  participante_b_id BIGINT REFERENCES usuarios(id),
  nome_grupo        VARCHAR(150),
  criado_em         TIMESTAMP DEFAULT NOW(),
  INDEX             idx_conversas_equipe (equipe_id),
  INDEX             idx_conversas_tipo (tipo)
);

CREATE TABLE mensagens_chat (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id  UUID REFERENCES conversas(id) ON DELETE CASCADE,
  remetente_id BIGINT REFERENCES usuarios(id),
  conteudo     TEXT,                                    -- Pode ser NULL (só anexo)
  deletada     BOOLEAN DEFAULT FALSE,
  enviado_em   TIMESTAMP DEFAULT NOW(),
  INDEX        idx_mensagens_conversa (conversa_id),
  INDEX        idx_mensagens_enviado (enviado_em),
  INDEX        idx_mensagens_remetente (remetente_id)
);

CREATE TABLE mensagem_anexo (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mensagem_id   UUID REFERENCES mensagens_chat(id) ON DELETE CASCADE,
  nome_arquivo  VARCHAR(255),
  tipo_arquivo  VARCHAR(10),   -- IMG | PDF | DOC | LINK
  url           TEXT
);

CREATE TABLE leitura_mensagem (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id    UUID REFERENCES conversas(id),
  usuario_id     BIGINT REFERENCES usuarios(id),
  ultima_leitura TIMESTAMP,
  UNIQUE         (conversa_id, usuario_id)
);

-- =============================================
-- NOTIFICAÇÕES E ESCALAS
-- =============================================

CREATE TABLE notificacoes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipe_id      UUID REFERENCES equipes(id),
  destinatario_id BIGINT REFERENCES usuarios(id),
  remetente_id   BIGINT REFERENCES usuarios(id),    -- NULL = sistema
  titulo         VARCHAR(150) NOT NULL,
  mensagem       TEXT NOT NULL,
  lida           BOOLEAN DEFAULT FALSE,
  data_envio     TIMESTAMP DEFAULT NOW(),
  chave_dedup    VARCHAR(500) UNIQUE,               -- Previne duplicatas
  INDEX          idx_notif_destinatario (destinatario_id),
  INDEX          idx_notif_equipe (equipe_id)
);

CREATE TABLE escala_trabalho (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      BIGINT REFERENCES usuarios(id) NOT NULL,
  data            DATE NOT NULL,
  horario_inicio  TIME,
  horario_fim     TIME,
  tipo            VARCHAR(30) NOT NULL,              -- TRABALHO | FOLGA | FERIAS | ...
  observacao      TEXT,
  UNIQUE          (usuario_id, data)                -- Um registro por dia por usuário
);
```

---

## 7. Referência Completa da API

### Headers Obrigatórios (endpoints protegidos)

```http
Authorization: Bearer <jwt_token>
X-Team-ID: <uuid_da_equipe_ativa>
Content-Type: application/json
```

### Códigos de Resposta Padrão

| Código | Situação |
|---|---|
| `200 OK` | Operação bem-sucedida |
| `201 Created` | Recurso criado |
| `204 No Content` | Deletado com sucesso |
| `400 Bad Request` | Validação falhou |
| `401 Unauthorized` | Token inválido ou ausente |
| `403 Forbidden` | Permissão insuficiente |
| `404 Not Found` | Recurso não encontrado |
| `429 Too Many Requests` | Rate limit excedido |
| `500 Internal Server Error` | Erro inesperado do servidor |

### Exemplo de Fluxo Completo: Criar Encomenda

```http
# 1. Login
POST /api/auth/login
{"email": "admin@benfica.com", "password": "senha"}
→ 200 {"accessToken": "eyJ...", "role": "ROLE_ADMIN", "id": 1}

# 2. Selecionar equipe (frontend armazena no localStorage)

# 3. Criar encomenda
POST /api/encomendas
Authorization: Bearer eyJ...
X-Team-ID: 550e8400-e29b-41d4-a716-446655440000
{
  "clienteId": "uuid-cliente",
  "itens": [
    {
      "produtoId": "uuid-produto",
      "fornecedorId": "uuid-fornecedor",
      "quantidade": 2,
      "precoCotado": 45.90
    }
  ],
  "observacoes": "Urgente",
  "dataEstimadaEntrega": "2026-04-01"
}
→ 201 { "id": "uuid-nova", "status": "Encomenda Criada", "valorTotal": 91.80, ... }

# 4. Avançar status
PATCH /api/encomendas/{id}/avancar
→ 200 { "status": "Mercadoria em Loja", ... }
```

---

## 8. Modelo de Segurança

### Princípios Aplicados

| Princípio OWASP | Implementação |
|---|---|
| **A01 — Broken Access Control** | userId sempre derivado do JWT principal (nunca de request param). Dados isolados por `equipe_id`. |
| **A02 — Cryptographic Failures** | HTTPS via HSTS (1 ano). Senhas BCrypt. JWT HMAC-SHA256. |
| **A03 — Injection** | Spring Data JPA com queries parametrizadas. Sem SQL dinâmico. |
| **A04 — Insecure Design** | Rate limiting por IP. Chaves de registro separadas por role. |
| **A05 — Security Misconfiguration** | Erros genéricos sem stack trace. Headers de segurança completos. |
| **A07 — Auth Failures** | JWT stateless. Reset de senha com token expirável (15 min). Rate limiting em login. |
| **A08 — Software Integrity** | Docker multi-stage build. Dependências gerenciadas pelo Maven com BOM. |

### Headers de Segurança HTTP (Nginx)

```nginx
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: blob: https:;
  connect-src 'self' ws: wss:;
  object-src 'none'; frame-ancestors 'self'
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

### Headers de Segurança HTTP (Spring Security — respostas API)

```
Content-Security-Policy: default-src 'none'; frame-ancestors 'none'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Controle de Acesso por Role

```
/api/auth/**          → PUBLIC (sem auth, com rate limit)
/actuator/health      → PUBLIC
/ws/**                → PUBLIC (auth por WebSocket interceptor)
/uploads/**           → PUBLIC (arquivos servidos diretamente)
/api/**               → AUTHENTICATED (qualquer role válida)
```

Verificações adicionais dentro dos serviços (programáticas, não via SecurityConfig):
- `EncomendaService`: valida que a encomenda pertence à equipe do usuário autenticado
- `EquipeService`: valida que só o admin da equipe pode gerenciar membros
- `ChecklistService`: valida que apenas admins podem criar/editar estrutura

### Fluxo de Reset de Senha

```
1. POST /api/auth/forgot-password { "email": "user@..." }
   → Gera UUID token, salva em usuario.tokenResetSenha, expira em 15min
   → Envia email com token (NÃO revela se email existe ou não)

2. POST /api/auth/reset-password { "email": "...", "token": "uuid", "newPassword": "..." }
   → Busca usuário por email
   → Comparação constant-time (MessageDigest.isEqual) para prevenir timing attacks
   → Verifica expiração
   → Codifica nova senha com BCrypt
   → Limpa token e expiração
```

---

## 9. Integrações Externas

### 9.1 Supabase Realtime

**Propósito:** Broadcast em tempo real de mensagens do chat e badges sem precisar de um servidor WebSocket dedicado.

**Arquitetura:**
```
[Spring Boot] ──POST── [Supabase REST API]
                              │
                    broadcast ao canal
                              │
                   [Browser → Supabase JS SDK]
                         assina o canal
```

**Canais:**
- `chat:{conversaId}` — novas mensagens (evento: `mensagem`)
- `badge:{userId}` — atualização de contador de não lidas (evento: `update`)

**Backend:**
```java
// SupabaseBroadcastService
CompletableFuture.runAsync(() -> {
    HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(supabaseUrl + "/realtime/v1/api/broadcast"))
        .header("Authorization", "Bearer " + serviceRoleKey)
        .POST(HttpRequest.BodyPublishers.ofString(payload))
        .build();
    httpClient.send(request, ...);
});
```

**Frontend:**
```typescript
// ChatService
this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
const channel = this.supabase.channel(`chat:${conversaId}`);
channel.on('broadcast', { event: 'mensagem' }, ({ payload }) => {
  this.messagesSubject.next(payload as MensagemChat);
}).subscribe();
```

> **Segurança:** A `supabaseAnonKey` é uma chave pública, segura para uso no browser. A `SUPABASE_SERVICE_ROLE_KEY` (usada apenas no backend) nunca deve ser exposta ao cliente.

### 9.2 Gmail SMTP

**Propósito:** Emails transacionais (reset de senha, convites de equipe, suporte).

**Configuração Spring Mail:**
```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.connectiontimeout=5000
spring.mail.properties.mail.smtp.timeout=3000
spring.mail.properties.mail.smtp.writetimeout=5000
```

**Pré-requisitos:**
1. Conta Gmail com 2FA habilitado
2. Gerar "App Password" em Segurança do Google
3. Definir `SPRING_MAIL_USERNAME` e `SPRING_MAIL_PASSWORD`

**Tipos de email enviados:**
- Reset de senha: assunto "Recuperação de Senha", corpo com código UUID
- Convite de equipe: link para aceitar o convite
- Ticket de suporte: encaminhado para `APP_SUPPORT_DEV_EMAIL`

### 9.3 AWS S3

**Propósito:** Armazenamento persistente de arquivos enviados no chat e checklists.

**Ativação:** `SPRING_PROFILES_ACTIVE=aws`

**Configuração IAM para App Runner:**
- App Runner usa IAM Role automaticamente (sem chaves expostas)
- Permissões necessárias: `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`

**`S3Config.java`:**
```java
@Bean
public S3Client s3Client() {
    return S3Client.builder()
        .region(Region.of(s3Region))
        .build(); // Credenciais via IAM role
}
```

**Fallback local:** `LocalStorageService` salva em `/app/uploads/` e expõe via `GET /uploads/{filename}`.

### 9.4 CEP API (ViaCEP)

**Propósito:** Autopreenchimento de endereço a partir do CEP.

```typescript
// CepService
buscarEndereco(cep: string): Observable<Endereco> {
  return this.http.get<ViaCepResponse>(`https://viacep.com.br/ws/${cep}/json/`);
}
```

Usado nos formulários de cliente, fornecedor e encomenda para evitar digitação manual de endereço completo.

---

## 10. Infraestrutura e Deploy

### 10.1 Container Unificado (Dockerfile.unified)

O design de container único combina Angular (servido pelo Nginx) e Spring Boot no mesmo container, reduzindo custos no AWS App Runner onde cada serviço é cobrado separadamente.

```dockerfile
# Stage 1: Build Angular
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY encomendas-web/package*.json ./
RUN npm ci --ignore-scripts=false
COPY encomendas-web/ .
RUN npm run build -- --configuration docker
# Output: /app/dist/encomendas-web/browser/

# Stage 2: Build Spring Boot
FROM maven:3.9.6-eclipse-temurin-21 AS backend-build
WORKDIR /app
COPY encomendas-api/pom.xml .
RUN mvn dependency:go-offline -B          # Layer de cache de deps
COPY encomendas-api/src ./src
RUN mvn clean package -DskipTests -B
# Output: /app/target/*.jar

# Stage 3: Runtime
FROM eclipse-temurin:21-jre-alpine AS runtime
RUN apk add --no-cache nginx wget dos2unix

# Copiar artefatos dos stages anteriores
COPY --from=backend-build  /app/target/*.jar  /app/app.jar
COPY --from=frontend-build /app/dist/encomendas-web/browser/ /usr/share/nginx/html/
COPY nginx-unified.conf /etc/nginx/http.d/default.conf
COPY entrypoint.sh /app/entrypoint.sh

# JVM tunado para instâncias pequenas (0.5GB RAM)
ENV JAVA_OPTS="-Xmx384m -Xms256m -XX:+UseSerialGC -XX:MaxMetaspaceSize=128m"

EXPOSE 80
HEALTHCHECK CMD wget -qO- http://localhost:80/actuator/health || exit 1
ENTRYPOINT ["/app/entrypoint.sh"]
```

**Otimizações para instâncias pequenas:**
- `-Xmx384m -Xms256m` — Heap máximo de 384 MB (sobre 512 MB disponíveis)
- `-XX:+UseSerialGC` — GC serial consome menos overhead que G1GC em instância mono-core
- `-XX:MaxMetaspaceSize=128m` — Limita o Metaspace para evitar OOM

### 10.2 Entrypoint (entrypoint.sh)

```bash
#!/bin/sh
# Inicia Java em background
java $JAVA_OPTS -jar /app/app.jar &
JAVA_PID=$!

# Aguarda backend ficar saudável (até 3 minutos)
MAX_RETRIES=90
count=0
until wget -qO- http://localhost:8080/actuator/health | grep -q '"status":"UP"'; do
  count=$((count + 1))
  [ $count -ge $MAX_RETRIES ] && echo "Backend timeout" && exit 1
  sleep 2
done

# Inicia Nginx em foreground
nginx -g "daemon off;" &
NGINX_PID=$!

# Shutdown gracioso
trap "kill $JAVA_PID $NGINX_PID; wait" SIGTERM SIGINT
wait $JAVA_PID
```

### 10.3 Docker Compose (Desenvolvimento)

```bash
# 1. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com credenciais reais

# 2. Primeiro deploy (popula banco com DataSeeder)
SPRING_PROFILES_ACTIVE=dev docker compose up -d --build

# 3. Deploy normal (produção)
docker compose up -d --build

# 4. Verificar logs
docker compose logs -f backend

# 5. Acesso: http://localhost:8090
```

**Isolamento de redes:**
```yaml
networks:
  frontend:  # Acesso externo — frontend e backend
    driver: bridge
  backend:   # Interno — apenas backend e banco
    driver: bridge
    internal: true  # Sem acesso externo direto ao PostgreSQL
```

### 10.4 AWS App Runner

**Especificações da instância:**
- CPU: 0.25 vCPU
- RAM: 0.5 GB
- Auto scaling: mínimo 0, máximo 1 instância

**Variáveis de ambiente necessárias no App Runner:**
(ver seção 11 completa)

**Banco de dados:**
- AWS RDS PostgreSQL 16 em subnet privada
- Conexão via hostname interno da VPC
- Backups automáticos habilitados

### 10.5 Agendador de Hibernação (EventBridge)

Para reduzir custos, a instância App Runner é pausada automaticamente durante a madrugada via AWS EventBridge Scheduler.

**CloudFormation (`aws-scheduler.yml`):**
```yaml
PauseSchedule:
  Type: AWS::Scheduler::Schedule
  Properties:
    ScheduleExpression: "cron(15 3 * * ? *)"    # 00:15 BRT (UTC-3)
    Target:
      Arn: arn:aws:apprunner:...:pauseService
      RoleArn: !GetAtt AppRunnerSchedulerRole.Arn

ResumeSchedule:
  Type: AWS::Scheduler::Schedule
  Properties:
    ScheduleExpression: "cron(50 8 * * ? *)"    # 05:50 BRT (UTC-3)
    Target:
      Arn: arn:aws:apprunner:...:resumeService
```

**IAM Role necessária:**
```json
{
  "Effect": "Allow",
  "Action": ["apprunner:PauseService", "apprunner:ResumeService"],
  "Resource": "arn:aws:apprunner:*:*:service/encomendas-app/*"
}
```

> **Nota:** O banco RDS continua rodando durante a pausa. Apenas o App Runner é pausado.

---

## 11. Variáveis de Ambiente

### Obrigatórias

| Variável | Descrição | Exemplo |
|---|---|---|
| `APP_JWT_SECRET` | Chave HMAC-SHA256 para assinar JWT (mínimo 256 bits) | `uma-chave-secreta-muito-longa...` |
| `APP_REGISTRATION_KEY` | Chave para registro de usuários | `benfica-user-2026` |
| `APP_ADMIN_REGISTRATION_KEY` | Chave para registro de admins | `benfica-admin-2026` |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL | `senha-forte-aqui` |
| `SPRING_DATASOURCE_URL` | JDBC URL do banco | `jdbc:postgresql://host:5432/db` |
| `SPRING_DATASOURCE_USERNAME` | Usuário do banco | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | Senha do banco | igual `POSTGRES_PASSWORD` |

### Opcionais (com defaults)

| Variável | Default | Descrição |
|---|---|---|
| `POSTGRES_DB` | `sistema_encomendas` | Nome do banco |
| `POSTGRES_USER` | `postgres` | Usuário do banco |
| `SPRING_PROFILES_ACTIVE` | `prod` | Perfil (`dev`, `prod`, `aws`) |
| `SPRING_JPA_HIBERNATE_DDL_AUTO` | `update` | DDL strategy |
| `CORS_ALLOWED_ORIGIN` | `*` | Origem CORS permitida |
| `APP_PORT` | `8090` | Porta exposta no compose |
| `SERVER_PORT` | `8080` | Porta interna Spring Boot |

### Email (opcional mas recomendado)

| Variável | Descrição |
|---|---|
| `SPRING_MAIL_USERNAME` | Email Gmail remetente |
| `SPRING_MAIL_PASSWORD` | Gmail App Password (não a senha normal) |
| `APP_SUPPORT_DEV_EMAIL` | Email para receber tickets de suporte |

### Supabase

| Variável | Descrição |
|---|---|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role (apenas backend — NUNCA expor ao browser) |

### DataSeeder

| Variável | Default | Descrição |
|---|---|---|
| `APP_SEEDER_ADMIN_PASSWORD` | `Benfica2026` | Senha dos admins criados no seed |
| `APP_SEEDER_USER_PASSWORD` | `Benfica2026` | Senha dos usuários criados no seed |

### AWS (quando `SPRING_PROFILES_ACTIVE=aws`)

| Variável | Descrição |
|---|---|
| `AWS_S3_BUCKET` | Nome do bucket S3 |
| `AWS_REGION` | Região AWS (ex: `sa-east-1`) |

> Em App Runner, credenciais AWS são fornecidas automaticamente via IAM Role — não configure `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`.

---

## 12. Guia do Desenvolvedor

### Pré-requisitos

- Java 21+
- Node.js 20+
- Docker Desktop
- Maven 3.9+

### Setup Local (sem Docker)

```bash
# 1. Banco de dados
docker run -d --name postgres-local \
  -e POSTGRES_DB=sistema_encomendas \
  -e POSTGRES_PASSWORD=123456 \
  -p 5432:5432 postgres:16-alpine

# 2. Backend
cd encomendas-api
# Criar application-local.properties com as variáveis necessárias
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/sistema_encomendas
export SPRING_DATASOURCE_PASSWORD=123456
export APP_JWT_SECRET=desenvolvimento-apenas-nao-usar-em-prod
export APP_REGISTRATION_KEY=dev-user-key
export APP_ADMIN_REGISTRATION_KEY=dev-admin-key
mvn spring-boot:run

# 3. Frontend
cd encomendas-web
npm install
ng serve --open
# Acessa: http://localhost:4200
# API: http://localhost:8080
```

### Setup com Docker Compose

```bash
# 1. Copiar e editar variáveis
cp .env.example .env

# 2. Subir tudo
docker compose up -d --build

# 3. Logs em tempo real
docker compose logs -f

# 4. Parar
docker compose down

# 5. Resetar banco (CUIDADO: apaga todos os dados)
docker compose down -v   # Remove volumes
docker compose up -d --build
```

### Build do Container Unificado

```bash
# Build
docker build -f Dockerfile.unified -t encomendas-app .

# Executar localmente
docker run -p 80:80 --env-file .env encomendas-app

# Verificar saúde
curl http://localhost/actuator/health
```

### Padrões de Código

**Backend:**
- Usar Lombok (`@Data`, `@Builder`, `@Slf4j`) para reduzir boilerplate
- Todos os endpoints protegidos devem usar `@AuthenticationPrincipal` para obter o usuário — **nunca** confiar em `@RequestParam usuarioId`
- Usar `TeamContextHolder.getEquipeId()` nos serviços para isolamento multi-tenant
- DTOs de request devem ter anotações de validação Jakarta

**Frontend:**
- Todos os componentes são standalone (sem NgModule)
- Usar `inject()` ao invés de constructor injection em guards e interceptors funcionais
- Serviços de API: um método = um endpoint, retornar `Observable`
- Dark mode: sempre implementar `:host-context(.dark-theme)` no SCSS de cada componente

### Adicionando um Novo Endpoint

**Backend:**
```java
// 1. Criar/atualizar DTO em dto/
// 2. Adicionar lógica no Service
// 3. Expor no Controller com:
//    - @Valid no @RequestBody
//    - @AuthenticationPrincipal UserDetails para o usuário atual
//    - Sem @RequestParam para dados sensíveis do usuário

@GetMapping("/meu-recurso")
public ResponseEntity<MeuDTO> getMeuRecurso(
        @AuthenticationPrincipal UserDetails userDetails,
        @RequestParam String equipeId) {
    Long userId = ((Usuario) userDetails).getId();
    return ResponseEntity.ok(service.buscar(userId, equipeId));
}
```

**Frontend:**
```typescript
// 1. Adicionar interface em core/models/
// 2. Adicionar método no Service correspondente
// 3. Injetar e chamar no componente
```

### Troubleshooting Comum

| Problema | Causa Provável | Solução |
|---|---|---|
| `Schema-validation: missing table` | DDL auto = `validate` com banco novo | Setar `SPRING_JPA_HIBERNATE_DDL_AUTO=update` |
| `401 Unauthorized` | Token expirado ou ausente | Re-login; verificar interceptor |
| `429 Too Many Requests` em dev | Rate limit ativo | Aguardar 1 min ou reiniciar o servidor |
| Chat não recebe mensagens | Supabase desconectado | Verificar `supabaseUrl` e `supabaseAnonKey` |
| Upload falha | S3 sem permissão / perfil errado | Verificar `SPRING_PROFILES_ACTIVE` e IAM role |
| Container não inicia | Backend demora > 3min para subir | Ver logs: `docker logs <container>`; verificar conexão com banco |
| Drag-drop não funciona no mobile | CDK sem suporte mobile por padrão | Verificar import de `DragDropModule` e touch events |

---

## 13. Apêndices

### A. Glossário

| Termo | Definição |
|---|---|
| **Encomenda** | Pedido de compra de produtos para um cliente |
| **Board** | Coluna do Kanban no sistema de checklists |
| **Card** | Item de checklist dentro de um board, com janela de tempo |
| **Escala** | Registro do turno de trabalho de um funcionário em um dia |
| **Equipe** | Unidade organizacional multi-tenant; todos os dados são isolados por equipe |
| **Convite** | Mecanismo de ingresso em equipe via link/email |
| **Chave de dedup** | Hash usado para prevenir notificações duplicadas |
| **Perfil AWS** | `SPRING_PROFILES_ACTIVE=aws` ativa S3 e configurações cloud |
| **Badge** | Contador de mensagens não lidas no ícone do chat |
| **IDOR** | Insecure Direct Object Reference — acesso a dados de outro usuário via ID manipulado |

### B. Estrutura de Arquivos Completa

```
Enc/
├── Dockerfile.unified             # Build multi-stage (Angular + Spring Boot + Nginx)
├── docker-compose.yml             # Orquestração local (db + backend + frontend)
├── nginx-unified.conf             # Configuração Nginx (proxy + headers de segurança)
├── entrypoint.sh                  # Script de startup do container unificado
├── .env.example                   # Template de variáveis de ambiente
├── aws-scheduler.yml              # CloudFormation para pause/resume App Runner
├── DOCUMENTATION.md               # Este arquivo
├── GUIA_DEPLOY_AWS.md             # Guia passo a passo para deploy na AWS
│
├── encomendas-api/                # Backend Spring Boot
│   ├── pom.xml                    # Dependências Maven
│   └── src/main/
│       ├── java/com/benfica/encomendas_api/
│       │   ├── config/            # Beans de configuração
│       │   ├── controller/        # REST Controllers
│       │   ├── dto/               # Data Transfer Objects
│       │   ├── model/             # Entidades JPA
│       │   ├── repository/        # Spring Data Repositories
│       │   ├── security/          # JWT, filtros, RBAC
│       │   └── service/           # Lógica de negócio
│       └── resources/
│           └── application.properties
│
└── encomendas-web/                # Frontend Angular
    ├── angular.json               # Configuração Angular CLI
    ├── package.json               # Dependências npm
    └── src/
        ├── index.html
        ├── styles.scss            # Estilos globais + tema Material
        ├── environments/          # environment.ts, environment.prod.ts, environment.docker.ts
        └── app/
            ├── app.config.ts      # Bootstrap Angular
            ├── app.routes.ts      # Roteamento
            ├── core/
            │   ├── auth/          # AuthService, authGuard, AuthInterceptor
            │   ├── team/          # TeamService
            │   ├── theme/         # ThemeService
            │   ├── models/        # TypeScript interfaces
            │   └── services/      # Serviços de API
            ├── layout/
            │   ├── main/          # Shell component
            │   ├── navbar/        # Barra superior
            │   └── sidebar/       # Menu lateral
            ├── pages/             # Páginas lazy-loaded
            │   ├── chat/
            │   ├── checklist-criador/
            │   ├── checklist-dia/
            │   ├── encomenda-create/
            │   ├── encomenda-detalhes/
            │   ├── escala-admin/
            │   ├── meu-calendario/
            │   └── perfil/
            ├── components/
            │   └── dialogs/       # MatDialog components
            ├── login/
            │   └── register/
            └── shared/
                └── directives/    # Máscaras de input
```

### C. Diagrama de Relacionamento Entidades (ERD Simplificado)

```
EQUIPE ──────────────── USUARIO (N:N via equipe_membros)
  │                        │
  │ 1:N                    │ 1:N
  ▼                        ▼
CLIENTE ◄── ENCOMENDA    ESCALA_TRABALHO
PRODUTO ◄── ENCOMENDA_ITEM
FORNECEDOR ◄── ENCOMENDA_ITEM

CHECKLIST_BOARD ──1:N── CHECKLIST_CARD ──1:N── CHECKLIST_ITEM
                                                     │
                                                     │ 1:N
                                                     ▼
                                               CHECKLIST_LOG (USUARIO × DATA)

CONVERSA (GRUPO ou PRIVADO) ──1:N── MENSAGEM_CHAT ──1:N── MENSAGEM_ANEXO
                           ──1:N── LEITURA_MENSAGEM

USUARIO ──1:N── NOTIFICACAO
EQUIPE  ──1:N── NOTIFICACAO
```

### D. Configurações de Build Angular

| Configuração | API URL | Descrição |
|---|---|---|
| `development` | `http://localhost:8080/api` | Dev local sem Docker |
| `production` | `/api` (relativo) | Docker separado (via Nginx no frontend) |
| `docker` | `http://localhost/api` | Container unificado (Nginx na porta 80) |

### E. Referência de Variáveis CORS

Para deployments com domínio fixo, configure `CORS_ALLOWED_ORIGIN` com a URL exata:

```bash
# Docker compose com domínio próprio
CORS_ALLOWED_ORIGIN=https://sistema.benfica.com.br

# App Runner com CloudFront
CORS_ALLOWED_ORIGIN=https://d1234abcd.cloudfront.net
```

O valor `*` usa `setAllowedOriginPatterns(["*"])` no Spring, que é compatível com `allowCredentials=true`.

---

*Documentação gerada em 2026-03-25. Para atualizações, consulte o histórico de commits do repositório.*
