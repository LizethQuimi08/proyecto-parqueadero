package ec.edu.espe.usuarios.oauth.config;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Expone las claves públicas RSA para que los Resource Servers validen JWTs.
 * GET http://localhost:9000/oauth2/jwks
 */
@RestController
public class JwksController {

    private final RSAKey rsaKey;

    public JwksController(RSAKey rsaKey) {
        this.rsaKey = rsaKey;
    }

    @GetMapping("/.well-known/jwks.json")
    public Map<String, Object> jwks() throws Exception {
        return new JWKSet(rsaKey.toPublicJWK()).toJSONObject();
    }
}
