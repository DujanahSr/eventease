# Production JRE Runtime for Eventease Spring Boot 3 (Glibc/Ubuntu Jammy for 100% stable compatibility)
FROM eclipse-temurin:21-jre-jammy

# Security: Run as non-root user
RUN groupadd -r eventease && useradd -r -g eventease eventease
USER eventease:eventease

WORKDIR /app

# Copy production executable JAR
COPY --chown=eventease:eventease target/eventease-*.jar app.jar

# Expose Spring Boot application port
EXPOSE 8081

# JVM flags optimized for containerized environments
ENTRYPOINT ["java", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75.0", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
