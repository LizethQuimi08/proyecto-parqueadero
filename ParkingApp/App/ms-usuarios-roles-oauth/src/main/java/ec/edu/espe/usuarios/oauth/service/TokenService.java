package ec.edu.espe.usuarios.oauth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class TokenService {

    private final JwtEncoder jwtEncoder;
    private static final long EXPIRY_HOURS = 1;

    @Value("${oauth.server.url:http://localhost:8082}")
    private String issuerUrl;

    public TokenService(JwtEncoder jwtEncoder) {
        this.jwtEncoder = jwtEncoder;
    }

    /**
     * Genera un JWT firmado RSA-256 con los roles del usuario.
     * El claim "roles" es leído por todos los Resource Servers para autorizar.
     */
    public String generate(String username, String tenantId, List<String> roles) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuerUrl)
                .issuedAt(now)
                .expiresAt(now.plus(EXPIRY_HOURS, ChronoUnit.HOURS))
                .subject(username)
                .claim("tenantId", normalizeTenantId(tenantId))
                .claim("roles", roles)
                .build();
        return jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }

    private String normalizeTenantId(String tenantId) {
        return tenantId == null || tenantId.isBlank() ? "default" : tenantId.trim();
    }

    public long getExpirySeconds() {
        return EXPIRY_HOURS * 3600;
    }
}
