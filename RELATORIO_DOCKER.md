# Relatório Técnico — Deploy do Sistema de Encomendas no Servidor

**Data:** 12/03/2026
**Assunto:** Solicitação de instalação do Docker Desktop e PostgreSQL no servidor da farmácia para deploy do Sistema de Encomendas
**Destinatário:** João (Gestor de TI)

---

## 1. Visão Geral da Arquitetura

A aplicação será implantada usando uma **arquitetura híbrida**, que combina o melhor de dois mundos:

- **Banco de dados (PostgreSQL 16)**: instalado **nativamente no Windows Server** como um serviço do sistema. Isso garante que os dados fiquem armazenados diretamente no disco do servidor, com acesso direto, backups simples e total independência do Docker.

- **Aplicação (Backend + Frontend)**: executada dentro de **containers Docker**. Isso evita a necessidade de instalar Java, Node.js, Nginx e suas dependências diretamente no servidor, mantendo o ambiente limpo e isolado.

### Por que esta abordagem:

- **Segurança dos dados**: Os dados do banco ficam em uma pasta comum do Windows (ex: `D:\PostgreSQL\data`), acessíveis diretamente pelo sistema de ficheiros. Não dependem de discos virtuais ou da VM do Docker.
- **Backup simplificado**: Backups podem ser feitos com ferramentas padrão do Windows e do PostgreSQL, sem necessidade de comandos Docker.
- **Isolamento da aplicação**: O backend (Java) e o frontend (Angular) ficam encapsulados em containers, sem instalar software adicional no sistema operacional.
- **Resiliência**: Se o Docker for atualizado, reinstalado ou tiver qualquer problema, os dados do banco de dados permanecem intactos, pois estão fora do Docker.

---

## 2. Software Necessário para Instalação

Serão necessários **dois softwares** instalados no servidor:

### 2.1. PostgreSQL 16 (Banco de Dados)

| Item                | Detalhe                                                      |
|---------------------|--------------------------------------------------------------|
| **O que é**         | Sistema de banco de dados relacional, open-source e gratuito |
| **Download**        | https://www.postgresql.org/download/windows/                 |
| **Versão**          | PostgreSQL 16 (última versão estável)                        |
| **Instalador**      | Wizard gráfico padrão do Windows (próximo, próximo, concluir)|
| **Espaço em disco** | ~250 MB (instalação) + espaço dos dados                      |
| **RAM estimada**    | ~40–50 MB em repouso (medido em testes)                      |
| **Serviço Windows** | Instala automaticamente como serviço `postgresql-x64-16`     |
| **Porta**           | 5432 (padrão, apenas localhost)                              |

**Durante a instalação será solicitado:**
1. **Pasta de dados** — recomenda-se utilizar uma pasta fora do disco do sistema, como `D:\PostgreSQL\data`, para facilitar backups e evitar perda de dados em caso de reinstalação do Windows.
2. **Senha do utilizador `postgres`** — esta senha será configurada no ficheiro `.env` da aplicação.
3. **Porta** — manter a padrão (5432).
4. **Locale** — manter o padrão ou selecionar `Portuguese, Brazil`.

Após a instalação, será necessário criar o banco de dados da aplicação:
```
psql -U postgres
CREATE DATABASE sistema_encomendas;
\q
```

### 2.2. Docker Desktop (Aplicação)

| Item                | Detalhe                                                      |
|---------------------|--------------------------------------------------------------|
| **O que é**         | Plataforma para executar aplicações em containers isolados   |
| **Download**        | https://www.docker.com/products/docker-desktop/              |
| **Versão**          | Docker Desktop (última versão estável)                       |
| **Instalador**      | Wizard gráfico padrão do Windows                             |
| **Espaço em disco** | ~2–3 GB (instalação) + ~525 MB (imagens da aplicação)        |
| **RAM estimada**    | ~620 MB em uso (medido em testes)                            |
| **Pré-requisito**   | WSL2 (o instalador do Docker configura automaticamente)      |

---

## 3. Containers Docker — Quantidade e Função

Com o banco de dados fora do Docker, a aplicação utiliza apenas **2 (dois) containers**:

| # | Container    | Imagem Base                     | Função                                                                                   |
|---|--------------|---------------------------------|------------------------------------------------------------------------------------------|
| 1 | **backend**  | `eclipse-temurin:21-jre-alpine` | **API REST (Spring Boot / Java 21)** — lógica de negócio, autenticação JWT, WebSocket em tempo real, envio de e-mails. Executa como utilizador não-root por segurança. |
| 2 | **frontend** | `nginx:alpine`                  | **Interface web (Angular + Nginx)** — serve os ficheiros da aplicação web e atua como reverse proxy. Único ponto de acesso pela rede. |

### Diagrama de comunicação:

```
Navegador do utilizador
        │
        ▼ (porta 8090)
  ┌─────────────┐
  │  Frontend   │  (Nginx — serve a interface web)          ── DOCKER
  │  (Angular)  │
  └──────┬──────┘
         │ proxy interno (80 → 8080)
         ▼
  ┌─────────────┐
  │  Backend    │  (Spring Boot — API e WebSocket)          ── DOCKER
  │  (Java 21)  │
  └──────┬──────┘
         │ conexão TCP (porta 5432)
         ▼
  ┌─────────────┐
  │ PostgreSQL  │  (Banco de dados — serviço nativo)        ── WINDOWS
  │    16       │
  └─────────────┘
```

> **Nota**: O backend conecta ao PostgreSQL nativo do servidor via `host.docker.internal:5432` — um endereço especial do Docker que aponta para o sistema operacional do servidor.

---

## 4. Consumo Real de Recursos (Medido em Testes)

> Os valores abaixo foram obtidos através de testes reais executados em 12/03/2026, sob carga simulada (múltiplas requisições simultâneas de autenticação e navegação).

### Memória RAM

| Componente         | Em Repouso (medido) | Sob Carga (medido) |
|--------------------|---------------------|---------------------|
| PostgreSQL (nativo)| **~42 MB**          | **~43 MB**          |
| Backend (Docker)   | **604 MB**          | **609 MB**          |
| Frontend (Docker)  | **6 MB**            | **7 MB**            |
| **Total**          | **~652 MB**         | **~659 MB**         |

**Resumo**: A aplicação consome aproximadamente **660 MB de RAM** no total. O backend Java é o maior consumidor (~610 MB), o que é normal para aplicações Spring Boot — a memória é alocada no arranque e permanece estável. Recomenda-se que o servidor tenha **pelo menos 1 GB de RAM livre**.

### CPU

| Componente         | Em Repouso (medido) | Sob Carga (medido) |
|--------------------|---------------------|---------------------|
| PostgreSQL (nativo)| **0,00%**           | **0,01%**           |
| Backend (Docker)   | **0,28%**           | **2,84%**           |
| Frontend (Docker)  | **0,00%**           | **0,00%**           |

O impacto no processador é **insignificante**. Mesmo sob carga, o consumo máximo foi de **2,84%**.

### Espaço em Disco

| Componente                        | Tamanho                               |
|-----------------------------------|---------------------------------------|
| PostgreSQL 16 (instalação)        | ~250 MB                               |
| Docker Desktop (instalação)       | ~2–3 GB                               |
| Imagem Backend (Spring Boot)      | **428 MB**                            |
| Imagem Frontend (Angular + Nginx) | **96 MB**                             |
| Banco de dados (dados atuais)     | **8,7 MB** (crescimento gradual)      |
| **Total inicial**                 | **~3,8 GB**                           |

> Nota: Sem o container do PostgreSQL no Docker, economiza-se **395 MB** de espaço em imagens.

---

## 5. Portas de Rede Utilizadas

| Porta    | Protocolo | Acessível externamente?       | Utilização                                  |
|----------|-----------|-------------------------------|---------------------------------------------|
| **8090** | HTTP/TCP  | **Sim** (única porta exposta) | Acesso à aplicação web pelo navegador       |
| 8080     | HTTP/TCP  | Não (rede interna Docker)     | API backend (Spring Boot)                   |
| **5432** | TCP       | **Não** (apenas localhost)    | PostgreSQL nativo (banco de dados)          |

### Detalhes:
- **Porta 8090**: Única porta acessível pela rede. Configurável via ficheiro `.env` (variável `APP_PORT`).
- **Porta 8080**: Interna ao Docker, invisível para o servidor e rede local.
- **Porta 5432**: O PostgreSQL nativo escuta apenas em `localhost` por padrão — **não é acessível pela rede local nem pela internet**, apenas pelo próprio servidor. Isso é configurado no ficheiro `pg_hba.conf` e `postgresql.conf` do PostgreSQL.
- **Nenhuma dessas portas conflita com as portas padrão do MySQL (3306)** utilizado pelo sistema da farmácia.

---

## 6. Armazenamento dos Dados

Com o PostgreSQL instalado nativamente, os dados ficam em **pastas comuns do Windows**:

| Dados                | Localização no servidor                             |
|----------------------|-----------------------------------------------------|
| Banco de dados       | Pasta configurada na instalação (ex: `D:\PostgreSQL\data`) |
| Uploads da aplicação | Volume Docker: `enc_uploads` (dentro do Docker)     |

### Vantagens do banco nativo:
- Os dados ficam **diretamente no disco do servidor**, sem camadas de virtualização.
- Acessíveis pelo **Windows Explorer** como qualquer outra pasta.
- Podem ser incluídos em **rotinas de backup existentes** do servidor (ex: backup de disco, cópia para rede).
- **Independem totalmente do Docker** — se o Docker for removido, atualizado ou falhar, os dados do banco permanecem intactos.
- Podem ser administrados diretamente via terminal com o comando `psql` (incluído na instalação do PostgreSQL):
```
psql -U postgres -d sistema_encomendas
```

---

## 7. Estratégia de Backup e Restauração

### 7.1. Backup do Banco de Dados

#### Backup manual (sob demanda):
```bash
pg_dump -U postgres -F c -f "D:\Backups\encomendas_backup_%date:~6,4%%date:~3,2%%date:~0,2%.dump" sistema_encomendas
```
Este comando gera um ficheiro `.dump` comprimido com todo o conteúdo do banco de dados. O formato custom (`-F c`) é o mais eficiente e permite restauração seletiva de tabelas.

#### Backup em formato SQL legível (alternativa):
```bash
pg_dump -U postgres sistema_encomendas > "D:\Backups\encomendas_backup.sql"
```

#### Backup automatizado (recomendado):

Criar um ficheiro `backup_encomendas.bat` na pasta de backups:
```bat
@echo off
set PGPASSWORD=SUA_SENHA_AQUI
set BACKUP_DIR=D:\Backups\Encomendas
set DATA=%date:~6,4%%date:~3,2%%date:~0,2%

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

pg_dump -U postgres -F c -f "%BACKUP_DIR%\encomendas_%DATA%.dump" sistema_encomendas

:: Apagar backups com mais de 30 dias
forfiles /p "%BACKUP_DIR%" /s /m *.dump /d -30 /c "cmd /c del @path" 2>nul

echo Backup concluido: %BACKUP_DIR%\encomendas_%DATA%.dump
```

Depois, agendar no **Task Scheduler do Windows**:
1. Abrir Task Scheduler → Create Basic Task
2. Nome: "Backup Encomendas"
3. Trigger: Diariamente, às 02:00 (ou horário de menor uso)
4. Action: Executar o ficheiro `backup_encomendas.bat`

#### Verificação de integridade do backup:
```bash
pg_restore -l "D:\Backups\Encomendas\encomendas_20260312.dump"
```
Este comando lista o conteúdo do backup sem restaurá-lo, permitindo verificar que o ficheiro está íntegro.

### 7.2. Restauração do Banco de Dados

#### Restauração completa (substitui todos os dados):
```bash
pg_restore -U postgres -d sistema_encomendas --clean --if-exists "D:\Backups\Encomendas\encomendas_20260312.dump"
```

#### Restauração a partir de ficheiro SQL:
```bash
psql -U postgres -d sistema_encomendas < "D:\Backups\encomendas_backup.sql"
```

### 7.3. Backup dos Uploads

Os ficheiros de upload ficam num volume Docker. Para copiar:
```bash
docker cp enc-backend-1:/app/uploads "D:\Backups\encomendas_uploads"
```

---

## 8. Inicialização Automática

Ambos os componentes iniciam automaticamente com o servidor:

| Componente               | Mecanismo de auto-start                                      |
|--------------------------|--------------------------------------------------------------|
| **PostgreSQL**           | Serviço Windows `postgresql-x64-16` — inicia automaticamente com o Windows (configurado na instalação) |
| **Backend + Frontend**   | Docker Desktop inicia com o Windows → containers com `restart: unless-stopped` sobem automaticamente |

### Ordem de arranque:
1. **Windows inicia** → PostgreSQL (serviço Windows) inicia automaticamente
2. **Docker Desktop inicia** → container backend sobe e conecta ao PostgreSQL
3. **Backend fica saudável** (health check) → container frontend sobe

A ordem é garantida: o backend só fica disponível após conectar ao PostgreSQL, e o frontend só inicia após o backend estar saudável.

### Em caso de falha:
- Se o **PostgreSQL** parar, o serviço Windows pode ser configurado para reiniciar automaticamente (opção "Recovery" nas propriedades do serviço).
- Se um **container Docker** parar, a política `restart: unless-stopped` o reinicia automaticamente.

---

## 9. Independência do Sistema da Farmácia

**A aplicação de encomendas é 100% independente do sistema da farmácia.**

| Aspeto                    | Sistema da Farmácia        | Sistema de Encomendas                        |
|---------------------------|----------------------------|----------------------------------------------|
| Banco de dados            | MySQL (existente)          | PostgreSQL 16 (novo, instalação separada)    |
| Porta do banco            | 3306                       | 5432 (apenas localhost, sem conflito)        |
| Porta da aplicação        | Portas próprias            | 8090 (configurável)                          |
| Armazenamento de dados    | Disco do servidor          | Pasta separada no disco (ex: `D:\PostgreSQL`) |
| Processos da aplicação    | Serviços Windows           | Containers Docker isolados                   |
| Rede                      | Rede do servidor           | Rede interna Docker + porta 8090             |

### Garantias de não interferência:
- **Não há comunicação** entre os dois sistemas. O sistema de encomendas não acessa, lê, modifica ou se conecta ao banco MySQL da farmácia em nenhuma circunstância.
- O **PostgreSQL e o MySQL são bancos de dados completamente diferentes**, com portas diferentes (5432 vs 3306), processos diferentes e dados em pastas diferentes.
- **Não há instalação de Java, Node.js ou Nginx** no sistema operacional — ficam apenas dentro dos containers Docker.
- Em caso de problema, basta parar os containers (`docker compose down`) e o serviço do PostgreSQL. O servidor volta a funcionar exactamente como antes. **Não há efeitos colaterais.**

---

## 10. Resumo Executivo

| Item                           | Resposta                                                                      |
|--------------------------------|-------------------------------------------------------------------------------|
| Software a instalar            | **PostgreSQL 16** (banco de dados) + **Docker Desktop** (aplicação)           |
| Containers Docker              | 2 (API backend + frontend web)                                                |
| RAM total medida               | ~660 MB (recomendado 1 GB livre)                                              |
| CPU máxima medida              | 2,84% sob carga (insignificante)                                              |
| Disco total                    | ~3,8 GB iniciais, crescimento gradual                                         |
| Portas expostas                | **8090** (aplicação web) — MySQL 3306 não é afetado                           |
| Dados do banco                 | Pasta nativa do Windows (ex: `D:\PostgreSQL\data`) — acesso direto            |
| Backup                         | `pg_dump` nativo + script `.bat` agendado no Task Scheduler                   |
| Restauração                    | `pg_restore` nativo — comando único                                           |
| Inicialização automática       | Sim — PostgreSQL como serviço Windows + containers Docker com auto-restart    |
| Comunicação com MySQL/farmácia | **Nenhuma** — sistemas completamente independentes                            |
| Risco para o sistema atual     | **Nenhum** — isolamento total por design                                      |

---

*Relatório gerado para avaliação técnica da instalação do Docker e PostgreSQL no ambiente de produção.*
