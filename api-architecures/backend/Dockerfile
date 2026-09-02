# Build Stage
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom.xml and download dependencies (cached layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build package
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user for security
#RUN addgroup -S appgroup && adduser -S appuser -G appgroup
#USER appuser

# Copy jar artifact from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port
EXPOSE 8080

# Environment variables
ENV PORT=8080 \
    SPRING_PROFILES_ACTIVE=prod

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/api/v1/health || exit 1

# Entrypoint
ENTRYPOINT ["java", "-jar", "app.jar"]
