# ===================================================================
# Stage 1: Build Backend JAR with Maven & Temurin 21 JDK
# ===================================================================
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Cache Maven dependencies by copying pom.xml first
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source code and build the application artifact
COPY src ./src
RUN mvn clean package -DskipTests -B

# ===================================================================
# Stage 2: Minimal Production Runtime with Temurin 21 JRE
# ===================================================================
FROM eclipse-temurin:21-jre-alpine

LABEL maintainer="Eventease Engineering <admin@eventease.com>"

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl tzdata

# Set timezone to Asia/Jakarta
ENV TZ=Asia/Jakarta

# Create non-root application user for container security
RUN addgroup -S eventease && adduser -S eventease -G eventease

# Create directory for local uploads fallback
RUN mkdir -p /app/uploads && chown -R eventease:eventease /app

# Copy built JAR from builder stage
COPY --from=builder /build/target/eventease-*.jar /app/app.jar
RUN chown eventease:eventease /app/app.jar

USER eventease

EXPOSE 8081

# JVM Memory optimization for VPS (128MB initial, 384MB max, G1GC)
ENV JAVA_OPTS="-Xms128m -Xmx384m -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
