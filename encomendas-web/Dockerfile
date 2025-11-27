# Etapa 1: Build do Angular
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: Servidor Nginx
FROM nginx:alpine
# ATENÇÃO: Verifique se o nome no angular.json é "encomendas-web".
# O caminho abaixo depende disso. Normalmente é dist/nome-do-projeto/browser ou apenas dist/nome-do-projeto
COPY --from=build /app/dist/encomendas-web/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
