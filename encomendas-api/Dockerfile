# Etapa 1: Build
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# 1. Copia APENAS o pom.xml primeiro
COPY pom.xml .

# 2. Baixa as dependências (Isso ficará em cache se o pom.xml não mudar)
# Isso economiza tempo e memória em builds futuros
RUN mvn dependency:go-offline -B

# 3. Copia o código fonte e compila
COPY src ./src
RUN mvn clean package -DskipTests -B

# Etapa 2: Runtime
FROM eclipse-temurin:21-jdk
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]