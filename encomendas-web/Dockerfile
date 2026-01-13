# --- ESTÁGIO 1: BUILD DO ANGULAR ---
FROM node:20-alpine AS build
WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm ci

# Copia código e faz o build de produção
COPY . .
RUN npm run build -- --configuration production

# --- ESTÁGIO 2: SERVIDOR NGINX ---
FROM nginx:alpine

# Copia o build do Angular para a pasta do Nginx
# NOTA: Verifique se o caminho no seu angular.json em "outputPath" é "dist/encomendas-web"
# Se for "dist/encomendas-web/browser" (Angular 17+), use o caminho abaixo:
COPY --from=build /app/dist/encomendas-web/browser /usr/share/nginx/html

# Copia nossa configuração personalizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
