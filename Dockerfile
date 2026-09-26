# Stage 1: Build JAR using Maven & Temurin JDK 21
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Cache dependencies layer
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build production artifact
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Minimal Production JRE Runtime
FROM eclipse-temurin:21-jre-alpine

# Security: Run as non-root user
RUN addgroup -S eventease && adduser -S eventease -G eventease
USER eventease:eventease

WORKDIR /app

# Copy executable jar from builder
COPY --from=builder --chown=eventease:eventease /app/target/*.jar app.jar

# Expose Spring Boot application port
EXPOSE 8081

# JVM flags optimized for containerized environments
ENTRYPOINT ["java", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75.0", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
