package com.example.oauth_server.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "OAuth Server - Sistema Parqueadero",
                version = "1.0",
                description = "Servidor de autorización JWT — emite y revoca tokens RSA firmados"
        )
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        in = SecuritySchemeIn.HEADER
)
public class SwaggerConfig {
    // Todos los endpoints del OAuth server son públicos; no se aplica
    // @SecurityRequirement global. La SecurityFilterChain ya hace permitAll()
    // sobre /api/token/**, /oauth2/jwks, /swagger-ui/** y /v3/api-docs/**.
}
