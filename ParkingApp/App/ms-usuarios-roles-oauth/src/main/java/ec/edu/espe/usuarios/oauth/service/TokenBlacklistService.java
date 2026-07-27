package ec.edu.espe.usuarios.oauth.service;

import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Blacklist en memoria de tokens revocados.
 * Cuando el usuario hace logout, su token se agrega aquí.
 * Los Resource Servers consultan POST /api/token/validate para saber si un token
 * sigue siendo válido antes de procesar el request.
 *
 * NOTA: en producción esto iría en Redis para persistencia y compartición entre instancias.
 */
@Service
public class TokenBlacklistService {

    // ConcurrentHashMap.newKeySet() es thread-safe
    private final Set<String> revokedTokens = Collections.newSetFromMap(new ConcurrentHashMap<>());

    public void revoke(String token) {
        revokedTokens.add(token);
    }

    public boolean isRevoked(String token) {
        return revokedTokens.contains(token);
    }
}
