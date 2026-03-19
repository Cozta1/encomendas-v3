# Arquitetura AWS — Sistema de Encomendas

Análise baseada no código real do projeto: **Spring Boot 3.5 + Angular 20 + PostgreSQL 16 + WebSocket + Uploads**.

---

## ⚠️ Descoberta Importante: Frontend NÃO pode ir no S3

Seu frontend Angular **não é apenas estático** — o [nginx.conf](
file:///c:/Users/zkozt/Enc/encomendas-web/nginx.conf) faz **reverse proxy** para:
- `/api/*` → backend Spring Boot
- `/ws` → WebSocket (STOMP/SockJS) para chat em tempo real
- `/uploads/*` → arquivos enviados no chat

**Se colocar o frontend no S3**, teria que mudar toda a lógica de conexão do Angular para apontar direto para o backend, configurar CORS, e lidar com WebSocket separadamente. Isso complica e pode quebrar funcionalidade.

---

## Arquitetura Recomendada (Menor Custo)

```
                    ┌─────────────┐
                    │   Route 53  │  DNS ($0.50/mês)
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  CloudFront │  CDN + HTTPS + WAF
                    │  (opcional) │  ($0–5/mês)
                    └──────┬──────┘
                           │
              ┌────────────▼────────────┐
              │     AWS App Runner      │
              │  (Container único:      │
              │   Nginx + Angular +     │
              │   Spring Boot API)      │
              │  0.25 vCPU / 0.5GB RAM  │
              │      ~$5–12/mês         │
              └────────────┬────────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
     ┌──────▼──────┐ ┌────▼────┐  ┌──────▼──────┐
     │  RDS Postgres│ │   S3    │  │  Secrets    │
     │  t4g.micro  │ │ Uploads │  │  Manager    │
     │  Free Tier  │ │ $0.02/GB│  │  $0.40/mês  │
     │  $0→$13/mês │ │         │  │             │
     └─────────────┘ └─────────┘  └─────────────┘
```

---

## Duas Opções Comparadas

### Opção A: Container Único no App Runner ✅ RECOMENDADA

Rodar **backend + nginx/frontend** juntos num único container, como já funciona no Docker Compose (mas combinado).

| Item | Custo/mês |
|---|---|
| App Runner (0.25 vCPU, 0.5GB) | **$2.50–12** |
| RDS PostgreSQL t4g.micro (Free Tier) | **$0** (12 meses) → $13 depois |
| S3 para uploads (1GB) | **$0.02** |
| Secrets Manager (6 secrets) | **$0.40** |
| Route 53 (domínio) | **$0.50** |
| **TOTAL** | **~$3.50–13/mês** ✅ |

**Prós:** Mais barato, simples, sem ALB, HTTPS automático, deploy direto do Docker.
**Contras:** Frontend e backend escalam juntos.

---

### Opção B: Frontend S3 + Backend App Runner (separado)

Requer **mudanças no código Angular** para apontar direto ao backend.

| Item | Custo/mês |
|---|---|
| S3 + CloudFront (frontend) | **$1–5** |
| App Runner (backend apenas) | **$2.50–12** |
| RDS PostgreSQL t4g.micro | **$0** → $13 |
| S3 uploads | **$0.02** |
| Secrets Manager | **$0.40** |
| **TOTAL** | **~$4–30/mês** |

**Prós:** Frontend e backend escalam independentemente.
**Contras:** Mais complexo, requer mudanças no Angular (CORS, WebSocket URL), CloudFront precisa de behavior rules para WebSocket.

---

## Decisão Final: Opção A

> [!IMPORTANT]
> **A Opção A é superior** para seu caso porque:
> 1. 💰 Custo menor (~$3.50–13/mês vs ~$4–30/mês)
> 2. 🔧 Zero mudanças no código — funciona exatamente como no Docker
> 3. 🔌 WebSocket funciona nativamente (sem configuração extra)
> 4. 📁 Uploads funcionam sem mudanças
> 5. 🚀 Deploy mais simples (1 container = 1 deploy)

---

## Mudanças Necessárias no Projeto

### 1. Criar um Dockerfile unificado (novo)
Combinar o Nginx + Angular + Spring Boot num único container multi-estágio.

### 2. Migrar uploads para S3
Atualmente os uploads vão para `/app/uploads` (volume Docker). Na nuvem, devem ir para **S3 Bucket** para persistência e custo baixo.

### 3. Externalizar variáveis sensíveis
Mover de [.env](file:///c:/Users/zkozt/Enc/.env) para **AWS Secrets Manager** (JWT secret, DB password, mail password).

### 4. Configuração do ambiente Angular
Criar `environment.docker-aws.ts` apontando para a URL real.

---

## Segurança Implementada

| Camada | Controle |
|---|---|
| **Rede** | App Runner com HTTPS automático (TLS 1.2+) |
| **Banco** | RDS em subnet privada, sem IP público, encryption at rest (AES-256) |
| **Secrets** | AWS Secrets Manager (não hardcoded no container) |
| **Auth** | JWT já implementado no Spring Security |
| **Uploads** | S3 bucket privado, acesso via signed URLs |
| **CORS** | Configurado no Spring Boot (já existe) |
| **Usuário container** | Roda como `spring` (não-root, já configurado) |

---

## Custo Total por Fase

| Fase | Período | Custo Estimado |
|---|---|---|
| **Início** | Mês 1–12 (Free Tier RDS) | **~$3.50–5/mês** |
| **Após Free Tier** | Mês 13+ | **~$15–25/mês** |
| **Se crescer** | +100 usuários/dia | **~$25–40/mês** |

---

## Backups e Recuperação de Dados

### 1. Banco de Dados (RDS PostgreSQL)

O RDS oferece **backup automático gratuito** (incluso no preço da instância):

| Recurso | Detalhe | Custo Extra |
|---|---|---|
| **Backup automático diário** | Snapshot completo toda noite + logs contínuos | **$0** (até 20GB, igual ao tamanho do DB) |
| **Retenção** | 1–35 dias configurável (recomendo **7 dias**) | **$0** (dentro do limite) |
| **Point-in-Time Recovery** | Restaurar para **qualquer segundo** dos últimos 7 dias | **$0** |
| **Snapshot manual** | Foto do banco sob demanda (antes de deploy, etc.) | **$0.095/GB/mês** se exceder Free Tier |

#### Como funciona o backup automático:
```
         ┌──────────────────────────────────────────┐
  Dia 1  │ ████████ Snapshot completo (automático)  │
         └──────────────────────────────────────────┘
  Dia 2  │ ░░ Transaction logs (contínuo, a cada 5 min)
  Dia 3  │ ░░░░ Transaction logs
  Dia 4  │ ░░░░░░ Transaction logs
         │        ↑
         │  Posso restaurar para QUALQUER ponto aqui
  Dia 7  │ ░░░░░░░░░░░░ Transaction logs
         └──────────────────────────────────────────┘
  Dia 8  │ ████████ Novo snapshot (automático, dia 1 expira)
```

#### Cenário de recuperação — Banco corrompido ou dados apagados:

| Passo | Ação | Tempo |
|---|---|---|
| 1 | No console RDS → "Restore to Point in Time" | 1 min |
| 2 | Escolher data/hora exata (ex: "ontem às 14:30") | — |
| 3 | AWS cria uma **nova instância RDS** com os dados restaurados | ~10–20 min |
| 4 | Apontar App Runner para o novo RDS (trocar endpoint) | 2 min |
| 5 | Deletar instância antiga (opcional) | 1 min |
| **Total** | | **~15–25 min** |

> [!TIP]
> O Point-in-Time Recovery cria uma instância **nova** (não sobrescreve a atual). Isso é uma vantagem: você pode comparar dados antes de trocar.

---

### 2. Arquivos de Upload (S3)

| Recurso | Detalhe | Custo Extra |
|---|---|---|
| **Versionamento S3** | Mantém versões anteriores de cada arquivo | **~$0.01/GB** (versões antigas) |
| **Durabilidade** | 99.999999999% (11 noves) — praticamente impossível perder | Incluso |
| **Cross-Region Replication** | Cópia automática para outra região (opcional) | **$0.02/GB** |

#### Cenário de recuperação — Arquivo deletado acidentalmente:
```bash
# Listar versões de um arquivo deletado
aws s3api list-object-versions --bucket encomendas-uploads --prefix "chat/foto.jpg"

# Restaurar versão anterior
aws s3api get-object --bucket encomendas-uploads --key "chat/foto.jpg" \
    --version-id "versao-anterior-id" foto_restaurada.jpg
```

---

### 3. Container / Código (App Runner)

| Recurso | Detalhe |
|---|---|
| **Imagem Docker** | Armazenada no **ECR** (registry AWS), versionada |
| **Rollback** | App Runner permite reverter para deploy anterior em 1 clique |
| **Código fonte** | Git (GitHub/GitLab) — histórico completo |

---

### 4. Estratégia Recomendada de Backup

| Camada | Automático | Retenção | Ação Manual Recomendada |
|---|---|---|---|
| **Banco (RDS)** | ✅ Diário + logs contínuos | 7 dias | Snapshot manual antes de deploys grandes |
| **Uploads (S3)** | ✅ Versionamento ligado | Indefinido | Nenhuma — S3 é virtualmente indestrutível |
| **Código** | ✅ Git | Indefinido | Tags de release no Git |
| **Secrets** | ✅ Secrets Manager versiona | 30 dias | Nenhuma |

### Custo adicional de backup: **~$0/mês**

> [!NOTE]
> Todos os backups descritos acima estão **inclusos no custo base** da arquitetura. O armazenamento de backup do RDS é gratuito até o tamanho da instância (20GB no t4g.micro). O versionamento do S3 custa centavos para volumes pequenos.

---

### 5. Disaster Recovery — Pior Cenário

Se a **região AWS inteira cair** (evento raro, mas possível):

| Nível | Estratégia | Custo Extra | Tempo de Recuperação |
|---|---|---|---|
| **Básico** (recomendado) | Snapshot RDS + S3 versionado na mesma região | **$0** | ~20–30 min |
| **Intermediário** | Snapshot RDS copiado para outra região + S3 Cross-Region | **~$2–5/mês** | ~15–20 min |
| **Avançado** | RDS Multi-AZ (réplica automática) | **+$13/mês** | ~2–5 min (failover automático) |

**Recomendação:** Comece com o nível **Básico** ($0 extra). Se o sistema for crítico para o negócio, suba para **Intermediário** (~$2–5/mês).

---

## Próximos Passos (aprovado ✅)

1. [x] Criar Dockerfile unificado (backend + frontend) → `Dockerfile.unified`
2. [x] Adaptar código de uploads para usar S3 → `StorageService` + `S3StorageService` + `LocalStorageService`
3. [ ] Criar infraestrutura AWS (Terraform ou manual)
4. [ ] Configurar App Runner + RDS + S3 + Backups
5. [ ] Configurar Secrets Manager
6. [ ] Deploy e testes
7. [ ] Configurar CI/CD com GitHub Actions

---

## Ficheiros Criados / Modificados

### Novos ficheiros de infraestrutura:
| Ficheiro | Descrição |
|---|---|
| `Dockerfile.unified` | Multi-stage: Angular build + Maven build + Runtime (JRE + Nginx) |
| `nginx-unified.conf` | Nginx config para container único (proxy para 127.0.0.1:8080) |
| `entrypoint.sh` | Script que inicia Java + Nginx com health check e graceful shutdown |
| `docker-compose.aws.yml` | Compose para testar container unificado localmente |
| `.dockerignore.unified` | Excludes para build do Dockerfile unificado |

### Backend — Storage abstraction (S3):
| Ficheiro | Descrição |
|---|---|
| `StorageService.java` | Interface de armazenamento (local vs S3) |
| `LocalStorageService.java` | Implementação local (disco). Ativo por padrão |
| `S3StorageService.java` | Implementação AWS S3. Ativo com `SPRING_PROFILES_ACTIVE=aws` |
| `S3Config.java` | Bean do S3Client (usa IAM Role, sem access keys) |
| `FileUploadService.java` | Refatorado: agora usa StorageService (DI) |
| `WebMvcConfig.java` | `@Profile("!aws")` — serve uploads do disco só fora da AWS |
| `application-aws.properties` | Perfil AWS: HikariCP reduzido (5 conn), S3 config |
| `pom.xml` | Adicionado AWS SDK v2 BOM + S3 dependency |

### Docker Compose melhorado:
| Ficheiro | Alteração |
|---|---|
| `docker-compose.yml` | Adicionada isolação de rede (frontend/backend networks) |
| `.env.example` | Adicionadas variáveis AWS (S3 bucket, region) |

### Como usar:

```bash
# --- Local (separado, como antes) ---
docker compose up -d --build

# --- Testar container unificado local ---
docker compose -f docker-compose.aws.yml up -d --build

# --- Build para AWS App Runner ---
docker build -f Dockerfile.unified -t encomendas-app .

# --- Deploy AWS com perfil S3 ---
# Definir no App Runner:
#   SPRING_PROFILES_ACTIVE=aws
#   AWS_S3_BUCKET=encomendas-uploads
#   AWS_REGION=us-east-1
#   (+ todas as vars do .env.example)
```
