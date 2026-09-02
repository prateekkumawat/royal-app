package com.example.api.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Spring Boot REST API Architecture")
                        .version("1.0.0")
                        .description("Production-ready REST API documentation powered by OpenAPI 3 and Swagger UI. Configured with CORS, PostgreSQL database integration, and React Frontend.")
                        .contact(new Contact()
                                .name("Architecture Team")
                                .email("dev@example.com")
                                .url("https://github.com/example/api-architecture"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local Development Server"),
                        new Server().url("http://localhost:3000/api").description("Nginx Gateway Server")
                ));
    }
}
