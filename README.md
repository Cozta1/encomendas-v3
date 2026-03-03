<div align="center">

# 📦 Sistema de Encomendas

**[Português](#português) · [English](#english)**

</div>

---

<a name="português"></a>

<div align="center">

## 🇧🇷 Português

</div>

### Sobre o Projeto

Sistema web completo de gestão operacional para equipes. Centraliza o controlo de encomendas, escalas de trabalho, checklists diárias, chat interno e notificações em tempo real — tudo num único painel com suporte a múltiplas equipas.

---

### Funcionalidades

| Módulo | Descrição |
|---|---|
| **Encomendas** | Criação, acompanhamento e histórico de pedidos com dados de cliente, endereço e itens |
| **Checklists** | Quadros estilo Trello para tarefas diárias, com drag & drop e relatórios de atividade |
| **Escalas** | Calendário de turnos para administradores e visualização pessoal por funcionário |
| **Chat** | Mensagens em tempo real via WebSocket com envio de ficheiros (PDF, imagens, docs) |
| **Notificações** | Sistema de alertas com badge na navbar e painel de leitura |
| **Clientes / Produtos / Fornecedores** | CRUD completo de entidades base |
| **Gestão de Equipa** | Convites por email, membros, múltiplas equipas por utilizador |
| **Suporte** | Envio de tickets de bug/sugestão diretamente ao desenvolvedor por email |
| **Relatórios** | Exportação de relatórios de checklists em PDF |

---

### Stack Tecnológica

**Backend**
- Java 21 + Spring Boot 3.5
- Spring Security + JWT
- Spring Data JPA + Hibernate
- PostgreSQL
- WebSocket (STOMP + SockJS)
- Gmail SMTP (Spring Mail)
- Maven

**Frontend**
- Angular 20 (standalone components)
- Angular Material 20
- Angular CDK (drag & drop)
- STOMP.js + SockJS (WebSocket)
- jsPDF (geração de PDF)
- SCSS com suporte a dark mode

---

### Pré-requisitos

- Java 21+
- Node.js 18+ e npm
- PostgreSQL 14+
- (Opcional) Maven Wrapper incluído

---

### Como Executar

#### 1. Base de Dados

Crie uma base de dados PostgreSQL:

```sql
CREATE DATABASE sistema_encomendas;
```

#### 2. Backend

```bash
cd encomendas-api

# Configurar variáveis de ambiente (ou usar os valores padrão para dev)
# SPRING_DATASOURCE_URL, SPRING_DATASOURCE_USERNAME, SPRING_DATASOURCE_PASSWORD

mvn spring-boot:run
```

O servidor inicia em `http://localhost:8080`.
O perfil `dev` ativa o **DataSeeder** que cria dados de exemplo automaticamente.

#### 3. Frontend

```bash
cd encomendas-web
npm install
ng serve
```

A aplicação abre em `http://localhost:4200`.

---

### Variáveis de Ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/sistema_encomendas` | URL da base de dados |
| `SPRING_DATASOURCE_USERNAME` | `postgres` | Utilizador da BD |
| `SPRING_DATASOURCE_PASSWORD` | `root` | Password da BD |
| `APP_JWT_SECRET` | *(valor interno)* | Chave secreta JWT |
| `APP_REGISTRATION_KEY` | `FARMACIA_USER_2025` | Chave para registo de utilizadores |
| `APP_ADMIN_REGISTRATION_KEY` | `FARMACIA_ADMIN_MASTER` | Chave para registo de admins |
| `SPRING_MAIL_USERNAME` | `sistemafarmbenfica@gmail.com` | Email SMTP |
| `SPRING_MAIL_PASSWORD` | *(app password Gmail)* | Password de aplicação Gmail |
| `CORS_ALLOWED_ORIGIN` | `http://localhost:4200` | Origem permitida pelo CORS |
| `SPRING_PROFILES_ACTIVE` | `dev` | Perfil ativo (`dev` ou `prod`) |
| `APP_SUPPORT_DEV_EMAIL` | *(email configurado)* | Email de destino dos tickets de suporte |

---

### Estrutura do Projeto

```
encomendas-v3/
├── encomendas-api/               # Backend Spring Boot
│   └── src/main/java/
│       ├── controller/           # 14 controllers REST + WebSocket
│       ├── service/              # Lógica de negócio
│       ├── model/                # Entidades JPA
│       ├── dto/                  # Objetos de transferência
│       ├── repository/           # Repositórios Spring Data
│       ├── config/               # CORS, WebSocket, ficheiros
│       └── security/             # JWT, filtros, contexto de equipa
│
├── encomendas-web/               # Frontend Angular
│   └── src/app/
│       ├── pages/                # 14 páginas de funcionalidades
│       ├── layout/               # Navbar, sidebar
│       ├── core/                 # Serviços, guards, modelos
│       └── components/           # Dialogs e componentes partilhados
│
└── uploads/                      # Ficheiros enviados (anexos de chat, etc.)
```

---

### Acesso Padrão (perfil dev)

| Campo | Valor |
|---|---|
| Email | `super@benfica.com` |
| Password | `admin123` |

> ⚠️ Altere estas credenciais antes de colocar em produção.

---

<br>

---

<a name="english"></a>

<div align="center">

## 🇬🇧 English

</div>

### About

A full-featured web management system for operational teams. It centralizes order tracking, work schedules, daily checklists, internal chat, and real-time notifications — all in a single dashboard with multi-team support.

---

### Features

| Module | Description |
|---|---|
| **Orders** | Create, track, and view history of orders with client, address, and item data |
| **Checklists** | Trello-style task boards with drag & drop and activity reports |
| **Schedules** | Shift calendar for admins and personal schedule view for employees |
| **Chat** | Real-time messaging via WebSocket with file attachments (PDF, images, docs) |
| **Notifications** | Alert system with navbar badge and read panel |
| **Clients / Products / Suppliers** | Full CRUD for core business entities |
| **Team Management** | Email invitations, member listing, multiple teams per user |
| **Support** | Bug/suggestion ticket system that sends emails directly to the developer |
| **Reports** | Checklist activity export to PDF |

---

### Tech Stack

**Backend**
- Java 21 + Spring Boot 3.5
- Spring Security + JWT
- Spring Data JPA + Hibernate
- PostgreSQL
- WebSocket (STOMP + SockJS)
- Gmail SMTP (Spring Mail)
- Maven

**Frontend**
- Angular 20 (standalone components)
- Angular Material 20
- Angular CDK (drag & drop)
- STOMP.js + SockJS (WebSocket)
- jsPDF (PDF generation)
- SCSS with dark mode support

---

### Prerequisites

- Java 21+
- Node.js 18+ and npm
- PostgreSQL 14+
- (Optional) Maven Wrapper included

---

### Getting Started

#### 1. Database

Create a PostgreSQL database:

```sql
CREATE DATABASE sistema_encomendas;
```

#### 2. Backend

```bash
cd encomendas-api

# Set environment variables (or use the dev defaults below)
# SPRING_DATASOURCE_URL, SPRING_DATASOURCE_USERNAME, SPRING_DATASOURCE_PASSWORD

mvn spring-boot:run
```

The server starts on `http://localhost:8080`.
The `dev` profile activates the **DataSeeder** which auto-creates sample data on startup.

#### 3. Frontend

```bash
cd encomendas-web
npm install
ng serve
```

The app opens at `http://localhost:4200`.

---

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/sistema_encomendas` | Database URL |
| `SPRING_DATASOURCE_USERNAME` | `postgres` | Database user |
| `SPRING_DATASOURCE_PASSWORD` | `root` | Database password |
| `APP_JWT_SECRET` | *(internal value)* | JWT signing secret |
| `APP_REGISTRATION_KEY` | `FARMACIA_USER_2025` | Key required for user registration |
| `APP_ADMIN_REGISTRATION_KEY` | `FARMACIA_ADMIN_MASTER` | Key required for admin registration |
| `SPRING_MAIL_USERNAME` | `sistemafarmbenfica@gmail.com` | SMTP email address |
| `SPRING_MAIL_PASSWORD` | *(Gmail app password)* | Gmail app-specific password |
| `CORS_ALLOWED_ORIGIN` | `http://localhost:4200` | Allowed CORS origin |
| `SPRING_PROFILES_ACTIVE` | `dev` | Active profile (`dev` or `prod`) |
| `APP_SUPPORT_DEV_EMAIL` | *(configured email)* | Destination email for support tickets |

---

### Project Structure

```
encomendas-v3/
├── encomendas-api/               # Spring Boot backend
│   └── src/main/java/
│       ├── controller/           # 14 REST + WebSocket controllers
│       ├── service/              # Business logic
│       ├── model/                # JPA entities
│       ├── dto/                  # Data transfer objects
│       ├── repository/           # Spring Data repositories
│       ├── config/               # CORS, WebSocket, file serving
│       └── security/             # JWT, filters, team context
│
├── encomendas-web/               # Angular frontend
│   └── src/app/
│       ├── pages/                # 14 feature pages
│       ├── layout/               # Navbar, sidebar
│       ├── core/                 # Services, guards, models
│       └── components/           # Shared dialogs and components
│
└── uploads/                      # Uploaded files (chat attachments, etc.)
```

---

### Default Login (dev profile)

| Field | Value |
|---|---|
| Email | `super@benfica.com` |
| Password | `admin123` |

> ⚠️ Change these credentials before deploying to production.