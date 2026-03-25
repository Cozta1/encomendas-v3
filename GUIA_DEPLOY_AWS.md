# Guia Completo de Deploy na AWS — Sistema de Encomendas

> **Autor:** Guia gerado para o projeto `encomendas-web` + `encomendas-api`
> **Arquitectura:** Container único (Nginx + Angular + Spring Boot) no AWS App Runner
> **Custo estimado:** ~$5–13/mês (primeiro ano com Free Tier)

---

## Índice

1. [Fundamentos AWS — O que precisas saber](#1-fundamentos-aws)
2. [Mapa da Arquitectura](#2-mapa-da-arquitectura)
3. [Pré-requisitos](#3-pré-requisitos)
4. [Passo 1 — Instalar e configurar AWS CLI](#4-passo-1--instalar-e-configurar-aws-cli)
5. [Passo 2 — Criar o banco de dados (RDS PostgreSQL)](#5-passo-2--criar-o-banco-de-dados-rds-postgresql)
6. [Passo 3 — Criar o bucket S3 para uploads](#6-passo-3--criar-o-bucket-s3-para-uploads)
7. [Passo 4 — Criar secrets no Secrets Manager](#7-passo-4--criar-secrets-no-secrets-manager)
8. [Passo 5 — Criar o ECR e fazer push da imagem Docker](#8-passo-5--criar-o-ecr-e-fazer-push-da-imagem-docker)
9. [Passo 6 — Criar o App Runner](#9-passo-6--criar-o-app-runner)
10. [Passo 7 — Primeiro boot e popular o banco](#10-passo-7--primeiro-boot-e-popular-o-banco)
11. [Passo 8 — CI/CD com GitHub Actions](#11-passo-8--cicd-com-github-actions)
12. [Passo 9 — Domínio personalizado (opcional)](#12-passo-9--domínio-personalizado-opcional)
13. [Monitorização e Logs](#13-monitorização-e-logs)
14. [Custos detalhados](#14-custos-detalhados)
15. [Troubleshooting](#15-troubleshooting)
16. [Glossário AWS](#16-glossário-aws)

---

## 1. Fundamentos AWS

### O que é a AWS?

A **Amazon Web Services (AWS)** é a maior plataforma de cloud do mundo. Em vez de comprares
um servidor físico, alugas recursos (computação, banco de dados, armazenamento) e pagas
apenas pelo que usas — como uma conta de luz.

### Conceitos fundamentais que vais usar neste deploy

#### Regiões e Zonas de Disponibilidade

```
AWS Cloud
├── us-east-1 (Virginia)        ← VAMOS USAR ESTA (mais barata, mais serviços)
│   ├── us-east-1a (Datacenter A)
│   ├── us-east-1b (Datacenter B)
│   └── us-east-1c (Datacenter C)
├── eu-west-1 (Irlanda)
├── sa-east-1 (São Paulo)       ← Alternativa se precisares de latência baixa no Brasil
└── ... (30+ regiões no mundo)
```

- **Região** = conjunto de datacenters numa zona geográfica
- **Zona de Disponibilidade (AZ)** = datacenter individual dentro de uma região
- Escolhemos `us-east-1` porque:
  - É a mais barata (muitos serviços têm preço reduzido)
  - Tem todos os serviços disponíveis (algumas regiões novas não têm tudo)
  - Free Tier é igual em qualquer região

> **Nota sobre latência:** Se os teus utilizadores estão maioritariamente em Portugal/Brasil,
> a latência de `us-east-1` será ~100-150ms. Para uma aplicação web normal, isso é
> imperceptível. Se fosse um jogo real-time, aí sim seria relevante usar `eu-west-1` ou `sa-east-1`.

#### O que é o Free Tier?

A AWS oferece **12 meses de recursos gratuitos** para novas contas:

| Serviço | Free Tier | Após 12 meses |
|---------|-----------|----------------|
| RDS (PostgreSQL) | 750h/mês de `db.t4g.micro` | ~$13/mês |
| S3 | 5GB de armazenamento | ~$0.023/GB/mês |
| ECR | 500MB de imagens | ~$0.10/GB/mês |
| CloudWatch | 10 métricas, 5GB de logs | ~$0.50/mês |
| Secrets Manager | NÃO tem free tier | $0.40/mês por secret |
| App Runner | NÃO tem free tier | ~$5-12/mês |

> **Importante:** O Free Tier começa a contar a partir do dia que CRIAS a conta AWS,
> não a partir do dia que crias o recurso. Se a tua conta tem 6 meses, só tens mais 6 meses de Free Tier.

#### IAM — Quem pode fazer o quê

O **IAM (Identity and Access Management)** é o sistema de permissões da AWS.

```
Conta AWS (root)
├── IAM User: "ze-dev"              ← TU (acesso à consola + CLI)
│   ├── Policy: AdministratorAccess  ← Pode tudo (só para dev, nunca em prod)
│   └── Access Key: AKIA...         ← Credencial para o AWS CLI
│
└── IAM Role: "apprunner-role"       ← O TEU APP (permissões automáticas)
    ├── Policy: AmazonS3FullAccess   ← Pode ler/escrever no S3
    └── Policy: AmazonECRReadOnly    ← Pode puxar imagens do ECR
```

**Conceito-chave:** Um **User** é para pessoas. Uma **Role** é para serviços/aplicações.
O teu App Runner vai usar uma Role (não precisa de password — a AWS injeta credenciais automaticamente).

#### VPC — A rede privada

Quando crias uma conta AWS, já vem uma **VPC (Virtual Private Cloud)** padrão.
Pensa nela como a tua rede local, mas na cloud:

```
VPC (10.0.0.0/16) — a tua "rede local" na AWS
├── Subnet pública (10.0.1.0/24) — acessível pela internet
│   └── App Runner vive aqui (recebe tráfego externo)
│
├── Subnet privada (10.0.2.0/24) — SEM acesso direto da internet
│   └── RDS vive aqui (só o App Runner consegue falar com ele)
│
└── Internet Gateway — a "porta de saída" para a internet
```

**Vamos usar a VPC padrão** — não precisas de criar nada. A AWS já configura subnets em
cada AZ automaticamente.

---

## 2. Mapa da Arquitectura

```
          Utilizador (browser)
                │
                │ HTTPS (porta 443)
                ▼
    ┌───────────────────────┐
    │     App Runner         │  ← Container único, HTTPS automático
    │  ┌──────────────────┐ │
    │  │      Nginx        │ │  ← Serve Angular + proxy para Spring Boot
    │  │  (porta 80)       │ │
    │  │   /           → Angular SPA (ficheiros estáticos)
    │  │   /api/*      → proxy_pass → 127.0.0.1:8080
    │  │   /ws         → proxy_pass → 127.0.0.1:8080 (WebSocket)
    │  │   /uploads/*  → proxy_pass → 127.0.0.1:8080
    │  │   /actuator/* → proxy_pass → 127.0.0.1:8080 (health check)
    │  └──────┬───────────┘ │
    │         │             │
    │  ┌──────▼───────────┐ │
    │  │  Spring Boot      │ │  ← API REST + WebSocket + Auth JWT
    │  │  (porta 8080)     │ │
    │  └──────┬───────────┘ │
    │         │             │
    └─────────┼─────────────┘
              │
    ┌─────────┼──────────────────────────┐
    │         │                          │
    ▼         ▼                          ▼
┌────────┐ ┌────────┐           ┌──────────────┐
│  RDS   │ │   S3   │           │   Secrets    │
│Postgres│ │Uploads │           │   Manager    │
│t4g.micro│ │ Bucket │           │  (JWT, DB    │
│        │ │        │           │   password)  │
└────────┘ └────────┘           └──────────────┘
```

### Porque um container único?

O teu `nginx.conf` faz **reverse proxy** — o Angular chama `/api/encomendas` e o Nginx
encaminha para `127.0.0.1:8080` (Spring Boot). Se separasses frontend e backend em
containers diferentes, terias que:

1. Mudar todas as URLs do Angular para apontar para o backend directamente
2. Configurar CORS entre domínios diferentes
3. Configurar WebSocket para funcionar cross-origin (complexo)
4. Pagar por um Load Balancer separado (~$16/mês)

**Container único = zero mudanças no código, funciona exactamente como no Docker local.**

---

## 3. Pré-requisitos

Antes de começar, precisas de:

| Item | Como obter |
|------|------------|
| **Conta AWS** | https://aws.amazon.com/free/ (precisa de cartão de crédito, mas não cobra se ficares no Free Tier) |
| **Docker Desktop** | Já tens instalado ✅ |
| **Git** | Já tens ✅ |
| **AWS CLI v2** | Vamos instalar no Passo 1 |
| **Código commitado** | Já está no GitHub ✅ |

### Criar conta AWS (se ainda não tens)

1. Vai a https://aws.amazon.com/free/
2. Clica "Create a Free Account"
3. Insere email, nome, cartão de crédito
4. A AWS faz uma cobrança de verificação de ~$1 (devolvido)
5. Escolhe o plano **Basic Support** (gratuito)
6. Após criação, **NÃO uses o utilizador root** — cria um IAM User (explicado abaixo)

### Criar IAM User (boas práticas de segurança)

O utilizador **root** é como a conta de administrador do Windows — nunca deve ser usado
no dia-a-dia. Vamos criar um utilizador com permissões administrativas:

1. Acede ao Console AWS → busca "IAM" → Users → "Create User"
2. Nome: `ze-dev` (ou o teu nome)
3. Marcar: "Provide user access to the AWS Management Console"
4. Marcar: "I want to create an IAM user"
5. Permissions: "Attach policies directly" → selecciona `AdministratorAccess`
6. Criar user
7. Na página seguinte, anota:
   - **Console sign-in URL** (ex: `https://123456789012.signin.aws.amazon.com/console`)
   - **Username** e **Password**
8. Vai ao user criado → Security Credentials → Create Access Key
   - Use case: "Command Line Interface (CLI)"
   - Anota o **Access Key ID** e **Secret Access Key** (só aparecem UMA vez!)

> **NUNCA** commits access keys no git. Se fizeres isso por engano, a AWS detecta e bloqueia
> automaticamente em minutos (e envia-te um email assustador).

---

## 4. Passo 1 — Instalar e configurar AWS CLI

### O que é o AWS CLI?

É a ferramenta de linha de comando da AWS. Permite criar e gerir todos os serviços AWS
directamente do terminal, sem precisar abrir o browser. É o equivalente ao `docker` CLI
mas para a cloud.

### Instalação (Windows)

```powershell
# Opção A: Instalador MSI (recomendado)
# Abre PowerShell como ADMINISTRADOR e roda:
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi

# Opção B: Baixar manualmente
# Vai a: https://aws.amazon.com/cli/
# Baixa o instalador .msi e executa
```

Após instalar, **fecha e reabre o terminal** (para o PATH actualizar).

### Verificar instalação

```bash
aws --version
# Esperado: aws-cli/2.x.x Python/3.x.x Windows/10 ...
```

### Configurar credenciais

```bash
aws configure
```

O comando vai pedir 4 coisas:

```
AWS Access Key ID [None]: AKIA3EXAMPLE7ABCDEFG
# ↑ O Access Key ID que anotaste ao criar o IAM User

AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
# ↑ O Secret Access Key (apareceu só uma vez!)

Default region name [None]: us-east-1
# ↑ Região padrão. us-east-1 é a mais barata.

Default output format [None]: json
# ↑ Formato de saída dos comandos. json é o mais legível.
```

### Verificar que funciona

```bash
aws sts get-caller-identity
```

Resposta esperada:
```json
{
    "UserId": "AIDA3EXAMPLEUSERID",
    "Account": "123456789012",         ← ANOTA ESTE NÚMERO (Account ID)
    "Arn": "arn:aws:iam::123456789012:user/ze-dev"
}
```

> **O Account ID (12 dígitos)** vai ser usado em vários comandos. Guarda-o.

### O que aconteceu por trás?

O `aws configure` criou dois ficheiros no teu computador:

```
C:\Users\zkozt\.aws\
├── config          ← região e formato
│   [default]
│   region = us-east-1
│   output = json
│
└── credentials     ← access keys (NUNCA partilhar!)
    [default]
    aws_access_key_id = AKIA3EXAMPLE...
    aws_secret_access_key = wJalrXUtn...
```

Estes ficheiros são como o teu `.env` — contêm segredos. Nunca os partilhes.

---

## 5. Passo 2 — Criar o banco de dados (RDS PostgreSQL)

### O que é o RDS?

**RDS (Relational Database Service)** é o serviço de banco de dados gerido da AWS.
"Gerido" significa que a AWS cuida de:

- Instalação e actualizações do PostgreSQL
- Backups automáticos diários
- Monitorização de saúde
- Failover automático (se ativares Multi-AZ)
- Encriptação dos dados em disco

Tu só te preocupas com: criar tabelas e fazer queries.

### Comparação: RDS vs instalar PostgreSQL num EC2

| | RDS (gerido) | EC2 + PostgreSQL manual |
|---|---|---|
| **Setup** | 1 comando | Instalar OS, PostgreSQL, configurar, etc. |
| **Backups** | Automáticos, gratuitos | Tens de configurar tu com cron + pg_dump |
| **Updates** | 1 clique | SSH, apt update, testar, rezar |
| **Preço** | ~$13/mês (t4g.micro) | ~$8/mês (t3.micro) mas mais trabalho |
| **Recomendação** | ✅ Para 99% dos casos | Só se tiveres experiência de DBA |

### Tipos de instância RDS

| Tipo | vCPU | RAM | Uso | Preço/mês |
|------|------|-----|-----|-----------|
| `db.t4g.micro` | 2 | 1 GB | Dev/small prod | **$0 (Free Tier)** → $13 depois |
| `db.t4g.small` | 2 | 2 GB | Prod médio | ~$26 |
| `db.t4g.medium` | 2 | 4 GB | Prod com carga | ~$52 |

> `t4g` = processador **ARM Graviton** (mais barato e eficiente que Intel/AMD).
> O PostgreSQL funciona exactamente igual no ARM.

### Criar a Security Group para o RDS

Antes de criar o banco, precisamos de uma **Security Group** (firewall) que só permita
tráfego do App Runner:

```bash
# Descobrir a VPC padrão
aws ec2 describe-vpcs \
  --filters "Name=is-default,Values=true" \
  --query "Vpcs[0].VpcId" \
  --output text
# Resultado: vpc-0abc123def456789 (anota este ID)
```

```bash
# Criar security group para o RDS
aws ec2 create-security-group \
  --group-name encomendas-rds-sg \
  --description "Permite PostgreSQL apenas de dentro da VPC" \
  --vpc-id vpc-0abc123def456789
# Resultado: sg-0abc123def (anota este ID)
```

```bash
# Permitir PostgreSQL (porta 5432) de qualquer IP dentro da VPC
# O CIDR 10.0.0.0/8 cobre qualquer subnet privada
aws ec2 authorize-security-group-ingress \
  --group-id sg-0abc123def \
  --protocol tcp \
  --port 5432 \
  --cidr 10.0.0.0/8
```

> **Porque não abrir para 0.0.0.0/0 (toda a internet)?**
> Porque o banco NÃO precisa ser acessível pela internet. Só o App Runner
> (que está na mesma VPC) precisa de falar com ele. Isso é uma camada de segurança fundamental.

### Criar o DB Subnet Group

O RDS precisa de saber em quais subnets pode ser colocado:

```bash
# Listar subnets da VPC padrão
aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=vpc-0abc123def456789" \
  --query "Subnets[].SubnetId" \
  --output text
# Resultado: subnet-aaa111 subnet-bbb222 subnet-ccc333
```

```bash
# Criar subnet group com pelo menos 2 subnets (em AZs diferentes)
aws rds create-db-subnet-group \
  --db-subnet-group-name encomendas-db-subnets \
  --db-subnet-group-description "Subnets para RDS Encomendas" \
  --subnet-ids subnet-aaa111 subnet-bbb222
```

### Criar a instância RDS

```bash
aws rds create-db-instance \
  --db-instance-identifier encomendas-db \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --engine-version 16.4 \
  --master-username postgres \
  --master-user-password "CRIA_UMA_SENHA_FORTE_AQUI" \
  --allocated-storage 20 \
  --storage-type gp3 \
  --no-publicly-accessible \
  --vpc-security-group-ids sg-0abc123def \
  --db-subnet-group-name encomendas-db-subnets \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --db-name sistema_encomendas \
  --storage-encrypted \
  --copy-tags-to-snapshot \
  --tags Key=Project,Value=encomendas Key=Environment,Value=prod
```

**Explicação de cada flag:**

| Flag | O que faz | Porque |
|------|-----------|--------|
| `--db-instance-identifier` | Nome único do banco | Para referenciares nos comandos |
| `--db-instance-class db.t4g.micro` | Tamanho da máquina | Menor disponível, suficiente, Free Tier |
| `--engine postgres` | Tipo de banco | O nosso projecto usa PostgreSQL |
| `--engine-version 16.4` | Versão do PostgreSQL | Compatível com o que usamos no Docker |
| `--master-username postgres` | User admin do banco | Mesmo que no `.env` local |
| `--master-user-password` | Senha do admin | **USA UMA SENHA FORTE** (min 8 chars) |
| `--allocated-storage 20` | Disco em GB | 20GB é o mínimo (Free Tier inclui até 20GB) |
| `--storage-type gp3` | Tipo de disco | gp3 = SSD, mais rápido e mais barato que gp2 |
| `--no-publicly-accessible` | Sem IP público | Segurança: banco só acessível dentro da VPC |
| `--vpc-security-group-ids` | Firewall | A SG que criámos permite só porta 5432 da VPC |
| `--backup-retention-period 7` | Dias de backup | Backup automático dos últimos 7 dias, gratuito |
| `--preferred-backup-window` | Horário do backup | 03:00-04:00 UTC (madrugada, menor impacto) |
| `--db-name` | Nome da database | `sistema_encomendas` (o mesmo que no `.env`) |
| `--storage-encrypted` | Encriptação em disco | AES-256, sem custo extra, boa prática |

### Aguardar o RDS ficar pronto (~5-10 minutos)

```bash
# Verificar status (repete até aparecer "available")
aws rds describe-db-instances \
  --db-instance-identifier encomendas-db \
  --query "DBInstances[0].DBInstanceStatus" \
  --output text
# "creating" → "backing-up" → "available" ✅
```

```bash
# Quando estiver "available", buscar o ENDPOINT:
aws rds describe-db-instances \
  --db-instance-identifier encomendas-db \
  --query "DBInstances[0].Endpoint.Address" \
  --output text
# Resultado: encomendas-db.c9abcdef.us-east-1.rds.amazonaws.com
# ↑ ANOTA ESTE ENDPOINT — vais usar no App Runner
```

> **O que é o endpoint?**
> É o "endereço" do teu banco. Funciona como `localhost:5432` mas na cloud.
> O Spring Boot vai conectar a: `jdbc:postgresql://encomendas-db.c9abcdef.us-east-1.rds.amazonaws.com:5432/sistema_encomendas`

### Como funciona o backup automático

```
Dia 1 ─── Snapshot completo (AWS cria automaticamente às 03:00 UTC)
Dia 2 ─── Transaction logs (a cada 5 min, captura todas as mudanças)
Dia 3 ─── Transaction logs
  ...
Dia 7 ─── Transaction logs
Dia 8 ─── Novo snapshot (o do Dia 1 é apagado)
```

**Point-in-Time Recovery:** Podes restaurar o banco para QUALQUER segundo dos últimos 7 dias.
Se alguém apagar dados acidentalmente às 14:35, podes restaurar para 14:34.

A AWS cria uma **nova instância** com os dados restaurados (não sobrescreve a actual).
Isso permite comparar antes de trocar.

---

## 6. Passo 3 — Criar o bucket S3 para uploads

### O que é o S3?

**S3 (Simple Storage Service)** é o serviço de armazenamento de ficheiros da AWS.
Pensa nele como uma "pen drive infinita" na cloud, com 99.999999999% de durabilidade
(11 noves — é mais fácil ganhares o Euromilhões do que perderes um ficheiro no S3).

### Conceitos do S3

```
S3
├── Bucket: "encomendas-uploads-ze2025"    ← como uma "pasta raiz" (nome globalmente único)
│   ├── chat/                              ← "pasta" (prefix)
│   │   ├── uuid1_foto.jpg                 ← objecto (ficheiro)
│   │   └── uuid2_documento.pdf
│   └── perfil/
│       └── uuid3_avatar.png
```

- **Bucket** = contentor de ficheiros. O nome deve ser **globalmente único** em toda a AWS
  (nenhuma outra pessoa no mundo pode ter o mesmo nome).
- **Object** = ficheiro + metadados (content-type, tamanho, etc.)
- **Key** = caminho do ficheiro dentro do bucket (ex: `chat/uuid1_foto.jpg`)

### Classes de armazenamento S3

| Classe | Uso | Preço/GB/mês |
|--------|-----|--------------|
| **Standard** | Acesso frequente | $0.023 |
| **Infrequent Access** | Acesso raro | $0.0125 |
| **Glacier** | Arquivo/backup | $0.004 |
| **Glacier Deep Archive** | Arquivo longo prazo | $0.00099 |

Vamos usar **Standard** (o default) porque os uploads do chat são acedidos frequentemente.

### Criar o bucket

```bash
# IMPORTANTE: O nome do bucket deve ser globalmente único!
# Adiciona o teu nome/empresa para evitar conflitos
aws s3 mb s3://encomendas-uploads-ZE2025 --region us-east-1
```

> Substitui `ZE2025` por algo único teu. Exemplos:
> `encomendas-uploads-farmbenfica`, `encomendas-uploads-jose123`

**Explicação do comando:**
- `s3 mb` = "S3 make bucket" (criar bucket)
- `s3://nome-do-bucket` = URI do bucket
- `--region` = onde o bucket vai ser criado (mesma região do App Runner)

### Activar versionamento (proteção contra apagamentos acidentais)

```bash
aws s3api put-bucket-versioning \
  --bucket encomendas-uploads-ZE2025 \
  --versioning-configuration Status=Enabled
```

**O que faz:** Se alguém apagar ou sobrescrever um ficheiro, a versão anterior continua guardada.
Podes recuperar qualquer versão anterior a qualquer momento.

### Bloquear acesso público (segurança)

```bash
aws s3api put-public-access-block \
  --bucket encomendas-uploads-ZE2025 \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

**O que faz:** Impede que qualquer pessoa na internet aceda aos ficheiros directamente.
Apenas o teu App Runner (via IAM Role) consegue ler/escrever no bucket.

> **Sem isto**, alguém poderia descobrir o URL do bucket e ver todos os uploads do chat.
> Com isto, mesmo que adivinhem o URL, recebem "Access Denied".

### Custos do S3

Para a escala do teu projecto (< 1GB de uploads), o custo é praticamente zero:

| Operação | Preço | Exemplo |
|----------|-------|---------|
| Armazenamento | $0.023/GB/mês | 1GB = $0.023/mês |
| PUT (upload) | $0.005 por 1000 requests | 100 uploads = $0.0005 |
| GET (download) | $0.0004 por 1000 requests | 1000 downloads = $0.0004 |
| **Total mensal** | | **~$0.02-0.05** |

---

## 7. Passo 4 — Criar secrets no Secrets Manager

### O que é o Secrets Manager?

É o "cofre" da AWS para guardar senhas, chaves de API, e outros segredos.
Em vez de por senhas em variáveis de ambiente (que podem aparecer em logs),
guardas no Secrets Manager e o teu app busca-as de forma segura.

### Porque não usar só variáveis de ambiente?

| Abordagem | Segurança | Conveniência |
|-----------|-----------|--------------|
| **Hardcoded no código** | ❌ Péssimo | ❌ Não |
| **Ficheiro .env** | ⚠️ Médio | ✅ Fácil |
| **Variáveis de ambiente (App Runner)** | ⚠️ Médio (visíveis no console) | ✅ Fácil |
| **Secrets Manager** | ✅ Excelente (encriptado, auditado, rotacionável) | ⚠️ Requer config extra |

Para o teu caso, vamos usar uma **abordagem híbrida**:
- Secrets sensíveis (JWT, DB password, mail password) → **Secrets Manager**
- Config não-sensível (região, nomes de recursos) → **Variáveis de ambiente**

### Criar o secret

```bash
aws secretsmanager create-secret \
  --name encomendas/prod \
  --description "Secrets do Sistema de Encomendas - Producao" \
  --secret-string '{
    "SPRING_DATASOURCE_PASSWORD": "A_MESMA_SENHA_DO_RDS",
    "APP_JWT_SECRET": "vD92OmTliAiYa21aP7gQW94NvvD9HkKU2ATj+8uiXMFZl6nh0cLcTpRppKa2DfvrTbSYUS3rW6CmLg2eIHCs5Q==",
    "APP_REGISTRATION_KEY": "FARMACIA_USER_2025",
    "APP_ADMIN_REGISTRATION_KEY": "FARMACIA_ADMIN_MASTER",
    "SPRING_MAIL_PASSWORD": "cjcc nncz ylhs gvnn"
  }' \
  --tags Key=Project,Value=encomendas
```

**Explicação:**
- `--name encomendas/prod` = caminho lógico (como uma pasta). Poderias ter `encomendas/dev` separado
- `--secret-string` = JSON com todos os secrets. A AWS encripta com AES-256 automaticamente
- O secret é armazenado na mesma região que especificaste no `aws configure`

### Verificar que foi criado

```bash
aws secretsmanager describe-secret --secret-id encomendas/prod
```

### Custos do Secrets Manager

| Item | Preço |
|------|-------|
| Por secret/mês | $0.40 |
| Por 10.000 chamadas de API | $0.05 |
| **Total (1 secret)** | **~$0.40/mês** |

> Guardamos tudo num único secret (JSON com múltiplos campos) em vez de criar um secret
> por variável. Isso mantém o custo em $0.40 total, não $0.40 × 5.

### Nota importante para o App Runner

O App Runner tem integração nativa com Secrets Manager desde 2023. Quando configurarmos
o App Runner, vamos referenciar o secret directamente — o App Runner injeta os valores
como variáveis de ambiente no container automaticamente.

---

## 8. Passo 5 — Criar o ECR e fazer push da imagem Docker

### O que é o ECR?

**ECR (Elastic Container Registry)** é o "Docker Hub" da AWS. É onde guardas as tuas
imagens Docker para que o App Runner possa puxá-las.

```
Docker Hub (público)          ECR (privado, teu)
├── nginx:alpine              ├── encomendas-app:latest
├── postgres:16               ├── encomendas-app:v1.0.0
└── node:20                   └── encomendas-app:v1.0.1
```

### Porque não usar o Docker Hub directamente?

| | Docker Hub | ECR |
|---|---|---|
| **Privacidade** | Público por defeito | Privado por defeito |
| **Integração App Runner** | Precisa de credenciais | Nativa (IAM Role) |
| **Velocidade** | Depende da internet | Mesma rede AWS (muito rápido) |
| **Custo** | Gratuito (com limites) | ~$0.10/GB/mês |

### Criar o repositório ECR

```bash
aws ecr create-repository \
  --repository-name encomendas-app \
  --region us-east-1 \
  --image-scanning-configuration scanOnPush=true \
  --tags Key=Project,Value=encomendas
```

**Flags explicadas:**
- `--repository-name` = nome da imagem (como `nginx` no Docker Hub)
- `--image-scanning-configuration scanOnPush=true` = a AWS faz scan de vulnerabilidades
  automaticamente a cada push (gratuito para scans básicos)

**Resposta esperada (anota o `repositoryUri`):**
```json
{
    "repository": {
        "repositoryUri": "123456789012.dkr.ecr.us-east-1.amazonaws.com/encomendas-app",
        "repositoryName": "encomendas-app"
    }
}
```

### Fazer login no ECR (autenticar Docker)

```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.us-east-1.amazonaws.com
```

**O que acontece aqui:**
1. `aws ecr get-login-password` → gera um token temporário (válido 12 horas)
2. O token é passado via pipe (`|`) para o `docker login`
3. O Docker fica autenticado no teu ECR privado

> Substitui `123456789012` pelo teu Account ID (obtido com `aws sts get-caller-identity`).

### Build da imagem unificada

```bash
cd C:/Users/zkozt/Enc

# Build usando o Dockerfile.unified
# Isto combina Angular (Nginx) + Spring Boot num único container
docker build -f Dockerfile.unified -t encomendas-app .
```

**O que o `Dockerfile.unified` faz (3 estágios):**

```
Estágio 1: frontend-build (node:20-alpine)
├── npm ci                    → instala dependências Angular
├── npm run build --config docker → compila Angular para HTML/CSS/JS estáticos
└── Saída: /app/dist/encomendas-web/browser/

Estágio 2: backend-build (maven:3.9.6-eclipse-temurin-21)
├── mvn dependency:go-offline → baixa dependências Java (cache layer)
├── mvn clean package         → compila Spring Boot para um .jar
└── Saída: /app/target/encomendas-api-0.0.1-SNAPSHOT.jar

Estágio 3: runtime (eclipse-temurin:21-jre-alpine)
├── Instala nginx
├── Copia .jar do Estágio 2
├── Copia HTML/CSS/JS do Estágio 1 → /usr/share/nginx/html/
├── Copia nginx-unified.conf (proxy rules)
├── Copia entrypoint.sh (inicia Java + Nginx)
└── Imagem final: ~200MB (só o runtime, sem código-fonte)
```

> **Multi-stage build** é uma técnica Docker que reduz o tamanho da imagem final.
> O Maven (~800MB) e o Node (~200MB) são usados só durante o build e descartados.

### Tag e push para o ECR

```bash
# Criar tag com o URI do ECR
docker tag encomendas-app:latest \
  123456789012.dkr.ecr.us-east-1.amazonaws.com/encomendas-app:latest

# Fazer push (upload) para o ECR
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/encomendas-app:latest
```

**O que é uma "tag"?**
Uma tag é um alias (apelido) para uma imagem. `latest` é a tag padrão.
Em produção, é boa prática usar tags versionadas:

```bash
# Exemplo com versão semântica
docker tag encomendas-app:latest \
  123456789012.dkr.ecr.us-east-1.amazonaws.com/encomendas-app:v1.0.0
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/encomendas-app:v1.0.0
```

### Verificar que a imagem está no ECR

```bash
aws ecr list-images --repository-name encomendas-app
```

### Custos do ECR

| Item | Preço |
|------|-------|
| Armazenamento | $0.10/GB/mês |
| Transfer (push/pull dentro da mesma região) | Gratuito |
| **Imagem de ~200MB** | **~$0.02/mês** |

---

## 9. Passo 6 — Criar o App Runner

### O que é o App Runner?

**App Runner** é o serviço mais simples da AWS para correr containers. Dás-lhe uma imagem
Docker e ele trata de tudo:

- HTTPS automático (certificado SSL gratuito)
- Scaling automático (0 → N instâncias conforme o tráfego)
- Health checks
- Deploy com zero downtime
- Logs centralizados

### Comparação com outras opções

| Serviço | Complexidade | Custo | Para quem? |
|---------|-------------|-------|------------|
| **App Runner** | ⭐ Muito simples | ~$5-12/mês | Startups, MVPs, apps pequenos ✅ |
| **ECS Fargate** | ⭐⭐⭐ Médio | ~$10-30/mês | Quando precisas de mais controlo |
| **ECS + EC2** | ⭐⭐⭐⭐ Complexo | ~$8-25/mês | Equipas DevOps experientes |
| **EKS (Kubernetes)** | ⭐⭐⭐⭐⭐ Muito complexo | ~$73+/mês (só o cluster) | Empresas grandes |
| **EC2 manual** | ⭐⭐⭐ Médio | ~$8-15/mês | Quem quer controlo total |

### Antes de criar: IAM Roles necessárias

O App Runner precisa de 2 roles:

1. **Access Role** — permite ao App Runner puxar imagens do ECR
2. **Instance Role** — permite ao container aceder ao S3 e Secrets Manager

#### Criar a Access Role (ECR pull)

```bash
# Criar a trust policy (quem pode assumir esta role)
cat > /tmp/apprunner-trust.json << 'ENDOFFILE'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "build.apprunner.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
ENDOFFILE

# Criar a role
aws iam create-role \
  --role-name encomendas-apprunner-ecr-access \
  --assume-role-policy-document file:///tmp/apprunner-trust.json

# Anexar política para ler ECR
aws iam attach-role-policy \
  --role-name encomendas-apprunner-ecr-access \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess
```

#### Criar a Instance Role (S3 + Secrets)

```bash
# Trust policy para o container do App Runner
cat > /tmp/apprunner-instance-trust.json << 'ENDOFFILE'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "tasks.apprunner.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
ENDOFFILE

aws iam create-role \
  --role-name encomendas-apprunner-instance \
  --assume-role-policy-document file:///tmp/apprunner-instance-trust.json
```

```bash
# Política para S3 (ler e escrever no bucket de uploads)
cat > /tmp/s3-policy.json << 'ENDOFFILE'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::encomendas-uploads-ZE2025",
        "arn:aws:s3:::encomendas-uploads-ZE2025/*"
      ]
    }
  ]
}
ENDOFFILE

aws iam put-role-policy \
  --role-name encomendas-apprunner-instance \
  --policy-name S3UploadsAccess \
  --policy-document file:///tmp/s3-policy.json
```

```bash
# Política para Secrets Manager (ler os secrets)
cat > /tmp/secrets-policy.json << 'ENDOFFILE'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:123456789012:secret:encomendas/*"
    }
  ]
}
ENDOFFILE

aws iam put-role-policy \
  --role-name encomendas-apprunner-instance \
  --policy-name SecretsReadAccess \
  --policy-document file:///tmp/secrets-policy.json
```

> **Princípio do Menor Privilégio:** Cada role só tem as permissões MÍNIMAS necessárias.
> A Instance Role pode ler/escrever no S3 do uploads mas NÃO pode criar buckets novos.
> Pode ler secrets mas NÃO pode criar ou apagar secrets.

### Obter os ARNs das roles

```bash
# ARN da access role
aws iam get-role --role-name encomendas-apprunner-ecr-access \
  --query "Role.Arn" --output text
# Resultado: arn:aws:iam::123456789012:role/encomendas-apprunner-ecr-access

# ARN da instance role
aws iam get-role --role-name encomendas-apprunner-instance \
  --query "Role.Arn" --output text
# Resultado: arn:aws:iam::123456789012:role/encomendas-apprunner-instance
```

### Configurar VPC Connector (para o App Runner falar com o RDS)

O App Runner por defeito corre numa rede gerida pela AWS (sem acesso à tua VPC).
Para falar com o RDS (que está na tua VPC), precisas de um **VPC Connector**:

```bash
# Listar subnets da VPC padrão
aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=vpc-0abc123def456789" \
  --query "Subnets[].SubnetId" \
  --output text

# Criar VPC Connector
aws apprunner create-vpc-connector \
  --vpc-connector-name encomendas-vpc-connector \
  --subnets subnet-aaa111 subnet-bbb222 \
  --security-groups sg-0abc123def
```

> Anota o `VpcConnectorArn` da resposta.

### Criar o serviço App Runner

```bash
cat > /tmp/apprunner-config.json << 'ENDOFFILE'
{
  "ServiceName": "encomendas-app",
  "SourceConfiguration": {
    "AuthenticationConfiguration": {
      "AccessRoleArn": "arn:aws:iam::123456789012:role/encomendas-apprunner-ecr-access"
    },
    "ImageRepository": {
      "ImageIdentifier": "123456789012.dkr.ecr.us-east-1.amazonaws.com/encomendas-app:latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "80",
        "RuntimeEnvironmentVariables": {
          "SPRING_DATASOURCE_URL": "jdbc:postgresql://encomendas-db.XXXXX.us-east-1.rds.amazonaws.com:5432/sistema_encomendas",
          "SPRING_DATASOURCE_USERNAME": "postgres",
          "SPRING_PROFILES_ACTIVE": "aws",
          "SPRING_MAIL_USERNAME": "sistemafarmbenfica@gmail.com",
          "APP_SUPPORT_DEV_EMAIL": "sistemafarmbenfica@gmail.com",
          "AWS_S3_BUCKET": "encomendas-uploads-ZE2025",
          "AWS_REGION": "us-east-1",
          "CORS_ALLOWED_ORIGIN": "*"
        },
        "RuntimeEnvironmentSecrets": {
          "SPRING_DATASOURCE_PASSWORD": "arn:aws:secretsmanager:us-east-1:123456789012:secret:encomendas/prod:SPRING_DATASOURCE_PASSWORD::",
          "APP_JWT_SECRET": "arn:aws:secretsmanager:us-east-1:123456789012:secret:encomendas/prod:APP_JWT_SECRET::",
          "APP_REGISTRATION_KEY": "arn:aws:secretsmanager:us-east-1:123456789012:secret:encomendas/prod:APP_REGISTRATION_KEY::",
          "APP_ADMIN_REGISTRATION_KEY": "arn:aws:secretsmanager:us-east-1:123456789012:secret:encomendas/prod:APP_ADMIN_REGISTRATION_KEY::",
          "SPRING_MAIL_PASSWORD": "arn:aws:secretsmanager:us-east-1:123456789012:secret:encomendas/prod:SPRING_MAIL_PASSWORD::"
        }
      }
    }
  },
  "InstanceConfiguration": {
    "Cpu": "0.25 vCPU",
    "Memory": "0.5 GB",
    "InstanceRoleArn": "arn:aws:iam::123456789012:role/encomendas-apprunner-instance"
  },
  "HealthCheckConfiguration": {
    "Protocol": "HTTP",
    "Path": "/actuator/health",
    "Interval": 20,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 5
  },
  "NetworkConfiguration": {
    "EgressConfiguration": {
      "EgressType": "VPC",
      "VpcConnectorArn": "arn:aws:apprunner:us-east-1:123456789012:vpcconnector/encomendas-vpc-connector/1/XXXXXXX"
    }
  }
}
ENDOFFILE

aws apprunner create-service --cli-input-json file:///tmp/apprunner-config.json
```

**Explicação dos campos importantes:**

| Campo | Descrição |
|-------|-----------|
| `Port: "80"` | O Nginx escuta na porta 80 dentro do container |
| `Cpu: "0.25 vCPU"` | O mínimo — suficiente para ~50 utilizadores simultâneos |
| `Memory: "0.5 GB"` | 384MB para Java + ~100MB para Nginx |
| `RuntimeEnvironmentVariables` | Config não-sensível (injectada como env vars) |
| `RuntimeEnvironmentSecrets` | Config sensível (lida do Secrets Manager) |
| `HealthCheckConfiguration` | App Runner pinga `/actuator/health` a cada 20s |
| `EgressConfiguration.VPC` | Permite o container falar com o RDS na VPC |

### Aguardar o deploy (~5-10 minutos)

```bash
aws apprunner describe-service \
  --service-arn arn:aws:apprunner:us-east-1:123456789012:service/encomendas-app/XXXXX \
  --query "Service.Status" \
  --output text
# "OPERATION_IN_PROGRESS" → "RUNNING" ✅
```

### Obter a URL do serviço

```bash
aws apprunner describe-service \
  --service-arn arn:aws:apprunner:us-east-1:123456789012:service/encomendas-app/XXXXX \
  --query "Service.ServiceUrl" \
  --output text
# Resultado: xxxxxxxxxx.us-east-1.awsapprunner.com
```

Acede a: `https://xxxxxxxxxx.us-east-1.awsapprunner.com` e o sistema deve estar no ar!

### Como funciona o scaling do App Runner

```
Tráfego baixo (0-5 req/min)
└── 1 instância activa (custo mínimo)

Tráfego médio (50 req/min)
└── App Runner cria 2-3 instâncias automaticamente

Tráfego zero (ninguém a usar)
└── "Paused" — container pausado, custo reduzido (~$0.007/hora vs $0.016/hora)
    └── Primeiro request após pausa demora ~3-10 segundos (cold start)
```

### Custos do App Runner

| Estado | Preço/hora | Preço/mês (estimado) |
|--------|-----------|---------------------|
| **Active** (a processar requests) | $0.016 | ~$12 (24/7) |
| **Provisioned** (a aguardar, mas pronto) | $0.007 | ~$5 (24/7) |
| **Média** (app com uso intermitente) | — | **~$5-8** |

---

## 10. Passo 7 — Primeiro boot e popular o banco

### O problema

O perfil `aws` usa `spring.jpa.hibernate.ddl-auto=validate`, que significa:
"verifica que as tabelas existem mas NÃO as cria". Isso é seguro para produção
mas o banco está vazio no primeiro deploy.

### Solução: Usar o perfil `prod` no primeiro boot

O perfil `prod` usa `ddl-auto=validate` também... mas o perfil base (`application.properties`)
usa `ddl-auto=update` que cria tabelas automaticamente.

**Estratégia para o primeiro boot:**

1. **Temporariamente** muda a variável `SPRING_PROFILES_ACTIVE` para apenas `dev` (se existir
   um perfil dev que usa `ddl-auto=update`) ou remove o override do `ddl-auto` para o primeiro boot.

2. Forma mais segura — conectar ao RDS e criar o schema manualmente:

```bash
# Instalar psql localmente (se não tiveres)
# Opção: usar um EC2 temporário ou Cloud Shell

# Opção mais simples: mudar temporariamente no App Runner
# No console AWS → App Runner → encomendas-app → Configuration → Update
# Mudar SPRING_PROFILES_ACTIVE para: (vazio ou "default")
# Isso usa application.properties com ddl-auto=update
# O Hibernate cria todas as tabelas automaticamente
# O DataSeeder popula dados iniciais

# Após confirmar que funciona, volta para:
# SPRING_PROFILES_ACTIVE=aws
```

### Verificar que o sistema está funcional

```bash
# Health check
curl https://xxxxxxxxxx.us-east-1.awsapprunner.com/actuator/health
# Esperado: {"status":"UP"}

# Testar API de login (exemplo)
curl https://xxxxxxxxxx.us-east-1.awsapprunner.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "1234"}'
```

---

## 11. Passo 8 — CI/CD com GitHub Actions

### O que é CI/CD?

- **CI (Continuous Integration)** = a cada push no git, o código é compilado e testado automaticamente
- **CD (Continuous Deployment)** = se o CI passar, o deploy é feito automaticamente

```
Tu fazes git push
    │
    ▼
GitHub Actions detecta o push
    │
    ├── Build da imagem Docker (Dockerfile.unified)
    ├── Push para o ECR
    └── Trigger de novo deploy no App Runner
            │
            ▼
    App Runner faz o deploy com zero downtime
    (mantém a versão antiga a correr enquanto a nova arranca)
```

### Configurar segredos no GitHub

Vai ao teu repositório no GitHub → Settings → Secrets and variables → Actions → New repository secret:

| Secret Name | Valor |
|-------------|-------|
| `AWS_ACCESS_KEY_ID` | O teu access key |
| `AWS_SECRET_ACCESS_KEY` | O teu secret key |
| `AWS_ACCOUNT_ID` | O teu account ID (12 dígitos) |
| `APPRUNNER_SERVICE_ARN` | O ARN do serviço App Runner |

### Criar o workflow

O ficheiro vai em `.github/workflows/deploy.yml` no teu repositório:

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

# Quando executar
on:
  push:
    branches: [master]     # Só na branch master (deploy de produção)
  workflow_dispatch:        # Permite trigger manual pelo GitHub UI

# Variáveis de ambiente globais
env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: encomendas-app
  IMAGE_TAG: ${{ github.sha }}   # Usa o hash do commit como tag (único e rastreável)

jobs:
  deploy:
    name: Build & Deploy
    runs-on: ubuntu-latest        # Máquina virtual Linux na cloud do GitHub (gratuita)

    steps:
      # 1. Checkout — baixa o código do repositório
      - name: Checkout code
        uses: actions/checkout@v4

      # 2. Login na AWS
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      # 3. Login no ECR
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      # 4. Build da imagem Docker
      - name: Build Docker image
        run: |
          docker build \
            -f Dockerfile.unified \
            -t ${{ env.ECR_REPOSITORY }}:${{ env.IMAGE_TAG }} \
            -t ${{ env.ECR_REPOSITORY }}:latest \
            .

      # 5. Push para o ECR
      - name: Push to ECR
        run: |
          ECR_URI=${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.${{ env.AWS_REGION }}.amazonaws.com
          docker tag ${{ env.ECR_REPOSITORY }}:${{ env.IMAGE_TAG }} $ECR_URI/${{ env.ECR_REPOSITORY }}:${{ env.IMAGE_TAG }}
          docker tag ${{ env.ECR_REPOSITORY }}:latest $ECR_URI/${{ env.ECR_REPOSITORY }}:latest
          docker push $ECR_URI/${{ env.ECR_REPOSITORY }}:${{ env.IMAGE_TAG }}
          docker push $ECR_URI/${{ env.ECR_REPOSITORY }}:latest

      # 6. Trigger de novo deploy no App Runner
      - name: Deploy to App Runner
        run: |
          aws apprunner start-deployment \
            --service-arn ${{ secrets.APPRUNNER_SERVICE_ARN }}

      # 7. Aguardar o deploy completar
      - name: Wait for deployment
        run: |
          echo "Deploy iniciado. Aguardando..."
          while true; do
            STATUS=$(aws apprunner describe-service \
              --service-arn ${{ secrets.APPRUNNER_SERVICE_ARN }} \
              --query "Service.Status" --output text)
            echo "Status: $STATUS"
            if [ "$STATUS" = "RUNNING" ]; then
              echo "Deploy concluido com sucesso!"
              break
            elif [ "$STATUS" = "CREATE_FAILED" ] || [ "$STATUS" = "DELETE_FAILED" ]; then
              echo "Deploy falhou!"
              exit 1
            fi
            sleep 15
          done
```

### Como funciona na prática

```bash
# Tu fazes uma mudança e push:
git add .
git commit -m "feat: nova funcionalidade"
git push origin master

# O GitHub Actions arranca automaticamente:
# ✅ Build Docker (~3-5 min)
# ✅ Push ECR (~1-2 min)
# ✅ App Runner deploy (~3-5 min)
# Total: ~7-12 min do push até estar em produção
```

No separador "Actions" do teu repositório GitHub, consegues ver o progresso em tempo real.

---

## 12. Passo 9 — Domínio personalizado (opcional)

### Usar o domínio do App Runner (gratuito)

O App Runner dá-te automaticamente um domínio tipo:
`https://xxxxxxxxxx.us-east-1.awsapprunner.com`

- ✅ HTTPS automático
- ✅ Funciona imediatamente
- ❌ URL não é bonita

### Usar o teu domínio (ex: `encomendas.tuaempresa.pt`)

Se quiseres um domínio personalizado:

1. **Comprar domínio** (Route 53 ou outro registrador):
   ```bash
   # Via Route 53 (~$12/ano para .com, ~$10/ano para .pt)
   # É mais fácil pelo Console AWS → Route 53 → Register Domain
   ```

2. **Configurar no App Runner:**
   ```bash
   aws apprunner associate-custom-domain \
     --service-arn arn:aws:apprunner:... \
     --domain-name encomendas.tuaempresa.pt
   ```

3. **A AWS diz-te quais registros DNS criar:**
   - Um registro CNAME para validação
   - Um registro CNAME apontando para o App Runner
   - Certificado SSL é criado automaticamente (gratuito)

---

## 13. Monitorização e Logs

### Ver logs do App Runner

```bash
# Logs recentes
aws apprunner list-operations \
  --service-arn arn:aws:apprunner:...

# Para logs detalhados, usa o Console AWS:
# App Runner → encomendas-app → Logs → Application logs
```

Os logs do Spring Boot (INFO, WARN, ERROR) e do Nginx aparecem aqui automaticamente.

### Alarmes (ser notificado quando algo falha)

```bash
# Criar alarme para quando o health check falhar
aws cloudwatch put-metric-alarm \
  --alarm-name encomendas-unhealthy \
  --namespace AWS/AppRunner \
  --metric-name UnhealthyInstanceCount \
  --statistic Maximum \
  --period 300 \
  --threshold 1 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:123456789012:encomendas-alerts
```

> Isto envia um email quando o sistema está em baixo há mais de 10 minutos.

---

## 14. Custos detalhados

### Mês 1-12 (com Free Tier)

| Serviço | Recurso | Custo/mês |
|---------|---------|-----------|
| **App Runner** | 0.25 vCPU / 0.5 GB | $5-12 |
| **RDS PostgreSQL** | db.t4g.micro (Free Tier) | **$0** |
| **S3** | < 1 GB uploads | ~$0.02 |
| **ECR** | ~200 MB imagem | ~$0.02 |
| **Secrets Manager** | 1 secret | $0.40 |
| **CloudWatch** | Logs básicos | **$0** (Free Tier) |
| **Data Transfer** | < 1 GB/mês | **$0** (Free Tier) |
| | **TOTAL** | **~$5.50-12.50/mês** |

### Mês 13+ (sem Free Tier)

| Serviço | Custo/mês |
|---------|-----------|
| App Runner | $5-12 |
| RDS t4g.micro | **$13** |
| S3 + ECR | ~$0.05 |
| Secrets Manager | $0.40 |
| **TOTAL** | **~$18.50-25.50/mês** |

### Como reduzir custos depois do Free Tier

| Estratégia | Economia |
|-----------|----------|
| **RDS Reserved Instance** (1 ano) | ~30% off ($13 → ~$9) |
| **Desligar App Runner à noite** (se ninguém usa) | ~50% off |
| **Usar Lightsail** em vez de RDS (mais simples) | $15/mês tudo incluído |

---

## 15. Troubleshooting

### "App Runner: Service creation failed"

**Causa provável:** A Instance Role não tem permissão para aceder ao Secrets Manager.

```bash
# Verificar se a role tem as políticas correctas
aws iam list-role-policies --role-name encomendas-apprunner-instance
```

### "Backend falhou ao iniciar" (health check timeout)

**Causa provável:** Spring Boot não consegue conectar ao RDS.

```bash
# Verificar logs
# Console AWS → App Runner → Logs → Application logs
# Procurar por: "Connection refused" ou "timeout"

# Possíveis causas:
# 1. Security Group do RDS não permite tráfego da subnet do App Runner
# 2. VPC Connector não está configurado
# 3. Endpoint do RDS está errado na variável SPRING_DATASOURCE_URL
```

### "Hibernate: Schema validation failed"

**Causa:** O banco está vazio e o perfil `aws` usa `ddl-auto=validate`.

**Solução:** Muda temporariamente `SPRING_PROFILES_ACTIVE` para que o Hibernate
crie as tabelas (ver Passo 7).

### "S3: Access Denied"

**Causa:** A Instance Role não tem permissão para o bucket, ou o nome do bucket está errado.

```bash
# Verificar permissões
aws iam get-role-policy \
  --role-name encomendas-apprunner-instance \
  --policy-name S3UploadsAccess

# Verificar se o bucket existe
aws s3 ls s3://encomendas-uploads-ZE2025/
```

### "Cold start muito lento" (20+ segundos)

**Causa:** O App Runner pausou o container e está a reiniciar.

O container unificado (Java + Nginx) demora ~15-30 segundos para arrancar porque:
1. JVM inicia (~5s)
2. Spring Boot carrega contexto (~10-15s)
3. Nginx inicia (~1s)

**Mitigação:**
- Aumentar para 0.5 vCPU acelera o cold start
- O entrypoint.sh aguarda até 90 tentativas (180s) pelo backend ficar pronto

---

## 16. Glossário AWS

| Termo | Significado |
|-------|------------|
| **ARN** | Amazon Resource Name — identificador único de qualquer recurso AWS. Ex: `arn:aws:s3:::meu-bucket` |
| **IAM** | Identity and Access Management — sistema de permissões |
| **VPC** | Virtual Private Cloud — a tua rede privada na AWS |
| **Subnet** | Sub-rede dentro da VPC (pode ser pública ou privada) |
| **Security Group** | Firewall virtual — regras de tráfego (inbound/outbound) |
| **Region** | Localização geográfica dos datacenters (ex: us-east-1 = Virginia) |
| **AZ** | Availability Zone — datacenter individual dentro de uma região |
| **ECR** | Elastic Container Registry — onde guardas imagens Docker |
| **RDS** | Relational Database Service — banco de dados gerido |
| **S3** | Simple Storage Service — armazenamento de ficheiros |
| **App Runner** | Serviço para correr containers de forma simples |
| **Free Tier** | 12 meses de recursos gratuitos para novas contas |
| **IAM Role** | Permissões para serviços (sem password, credenciais automáticas) |
| **IAM User** | Permissões para pessoas (com password e access keys) |
| **Secrets Manager** | Cofre encriptado para guardar senhas e chaves |
| **CloudWatch** | Serviço de monitorização e logs |
| **Route 53** | Serviço de DNS (gestão de domínios) |
| **Cold Start** | Tempo de arranque quando um container parado recebe o primeiro pedido |
| **gp3** | Tipo de disco SSD na AWS (mais rápido que gp2, mesmo preço) |
| **t4g** | Família de instâncias ARM (Graviton) — melhor relação preço/performance |
| **Multi-AZ** | Réplica automática do banco em outro datacenter (alta disponibilidade) |

---

## Resumo — Ordem de Execução

```
[ ] 1. Criar conta AWS + IAM User
[ ] 2. Instalar e configurar AWS CLI (aws configure)
[ ] 3. Criar Security Group para o RDS
[ ] 4. Criar DB Subnet Group
[ ] 5. Criar RDS PostgreSQL (aguardar ~10 min)
[ ] 6. Criar S3 Bucket + versionamento + bloquear acesso público
[ ] 7. Criar secret no Secrets Manager
[ ] 8. Criar repositório ECR
[ ] 9. Build da imagem Docker (Dockerfile.unified)
[ ] 10. Push da imagem para o ECR
[ ] 11. Criar IAM Roles (access + instance)
[ ] 12. Criar VPC Connector
[ ] 13. Criar serviço App Runner
[ ] 14. Primeiro boot (popular banco)
[ ] 15. Testar tudo (browser + API)
[ ] 16. Configurar GitHub Actions (CI/CD)
[ ] 17. Configurar domínio personalizado (opcional)
```

**Tempo estimado total: ~1-2 horas** (incluindo espera pela criação dos recursos).

---

> **Dica final:** Se em qualquer passo algo falhar, os logs são os teus melhores amigos.
> Usa `aws apprunner` + Console AWS → CloudWatch Logs para ver exactamente o que aconteceu.
> A grande maioria dos problemas de primeiro deploy são: security groups, permissões IAM,
> ou variáveis de ambiente com valores errados.
