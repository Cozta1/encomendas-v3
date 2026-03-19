#!/bin/sh
set -e

# ============================================
# Entrypoint — Container Unificado
# Inicia Spring Boot + Nginx no mesmo container
# ============================================

echo "[entrypoint] Iniciando Spring Boot..."
java $JAVA_OPTS -jar /app/app.jar &
JAVA_PID=$!

# Capturar sinais para desligamento gracioso
cleanup() {
  echo "[entrypoint] Desligando..."
  nginx -s quit 2>/dev/null || true
  kill $JAVA_PID 2>/dev/null || true
  wait $JAVA_PID 2>/dev/null || true
  exit 0
}
trap cleanup SIGTERM SIGINT

# Aguardar backend ficar pronto
echo "[entrypoint] Aguardando backend..."
ATTEMPTS=0
MAX_ATTEMPTS=90
while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
  if wget -qO- http://127.0.0.1:8080/actuator/health 2>/dev/null | grep -q '"UP"'; then
    echo "[entrypoint] Backend pronto!"
    break
  fi
  # Verificar se o processo Java ainda esta rodando
  if ! kill -0 $JAVA_PID 2>/dev/null; then
    echo "[entrypoint] ERRO: Backend falhou ao iniciar!"
    exit 1
  fi
  ATTEMPTS=$((ATTEMPTS + 1))
  sleep 2
done

if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
  echo "[entrypoint] ERRO: Timeout aguardando backend (${MAX_ATTEMPTS}x2s)"
  kill $JAVA_PID 2>/dev/null || true
  exit 1
fi

# Iniciar Nginx
echo "[entrypoint] Iniciando Nginx..."
nginx -g 'daemon off;' &
NGINX_PID=$!

echo "[entrypoint] Sistema pronto na porta 80"

# Aguardar qualquer processo filho terminar
wait $JAVA_PID $NGINX_PID
