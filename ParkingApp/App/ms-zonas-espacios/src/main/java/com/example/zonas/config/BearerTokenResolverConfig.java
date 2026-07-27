package com.example.zonas.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;

@Configuration
public class BearerTokenResolverConfig {

    @Bean
    public BearerTokenResolver bearerTokenResolver() {
        DefaultBearerTokenResolver resolver = new DefaultBearerTokenResolver();

        return new BearerTokenResolver() {
            @Override
            public String resolve(HttpServletRequest request) {
                String token = resolver.resolve(request);
                if (token == null) {
                    token = request.getParameter("token");
                }
                return token;
            }
        };
    }
}
