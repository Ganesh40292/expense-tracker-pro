# ═══════════════════════════════════════════════════════════
#  ExpenseTracker Backend — Production Dockerfile
#  Multi-stage: Maven build → JRE Alpine runtime
# ═══════════════════════════════════════════════════════════

# ── Stage 1: Build with Maven ─────────────────────────────
FROM maven:3.9-eclipse-temurin-17-alpine AS build

WORKDIR /app

# Copy POM first for dependency caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and package
COPY src ./src
RUN mvn clean package -DskipTests -B

# ── Stage 2: Lightweight JRE Runtime ─────────────────────
FROM eclipse-temurin:17-jre-alpine AS runtime

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Create uploads directory (will be volume-mounted)
RUN mkdir -p /app/uploads/receipts && chown -R appuser:appgroup /app

# Copy JAR from build stage
COPY --from=build --chown=appuser:appgroup /app/target/app.jar app.jar

# Switch to non-root user
USER appuser

# Expose application port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=15s --timeout=5s --retries=5 --start-period=60s \
    CMD curl -sf http://localhost:8080/api/health || exit 1

# JVM flags optimized for containerized environments
ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-XX:InitialRAMPercentage=50.0", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]
