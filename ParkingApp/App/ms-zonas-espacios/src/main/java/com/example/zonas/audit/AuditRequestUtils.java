package com.example.zonas.audit;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

public class AuditRequestUtils {
    public static final String GLOBAL_SCOPE = "__all__";

    public static String extractUser(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            Object username = jwt.getClaims().get("preferred_username");
            if (username instanceof String usernameStr && !usernameStr.isBlank()) {
                return usernameStr;
            }
            Object email = jwt.getClaims().get("email");
            if (email instanceof String emailStr && !emailStr.isBlank()) {
                return emailStr;
            }
            Object sub = jwt.getClaims().get("sub");
            if (sub instanceof String subStr && !subStr.isBlank()) {
                return subStr;
            }
        }
        return "anonymous";
    }

    public static String extractIp(HttpServletRequest request) {
        String forwarded = request.getHeader("x-forwarded-for");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    public static String extractMac(HttpServletRequest request) {
        String mac = request.getHeader("x-client-mac");
        if (mac == null || mac.isBlank()) {
            mac = request.getHeader("x-mac-address");
        }
        return (mac == null || mac.isBlank()) ? "00:00:00:00:00:00" : mac;
    }

    public static String extractTenantId(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            Object tenantId = jwt.getClaims().get("tenantId");
            if (tenantId instanceof String tenantIdStr && !tenantIdStr.isBlank()) {
                return tenantIdStr;
            }
        }
        return "default";
    }

    public static String extractTenantScope(HttpServletRequest request) {
        return isSuperAdmin() ? GLOBAL_SCOPE : extractTenantId(request);
    }

    public static String extractWritableTenantId(HttpServletRequest request) {
        if (isSuperAdmin()) {
            String headerTenant = request.getHeader("X-Tenant-ID");
            if (headerTenant != null && !headerTenant.isBlank() && !"global".equalsIgnoreCase(headerTenant)) {
                return headerTenant.trim();
            }
        }
        return extractTenantId(request);
    }

    public static boolean isSuperAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt) {
            Object roles = jwt.getClaims().get("roles");
            if (roles instanceof java.util.Collection<?> roleCollection) {
                return roleCollection.stream().anyMatch(role -> "ROLE_SUPER_ADMIN".equals(String.valueOf(role)));
            }
        }
        return false;
    }
}
