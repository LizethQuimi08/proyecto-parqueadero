package ec.edu.espe.usuarios.audit;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuditEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${rabbitmq.exchange:audit-exchange}")
    private String exchange;

    public void publish(HttpServletRequest request,
                        String entidad,
                        String accion,
                        Map<String, Object> datos,
                        String routingKey) {

        try {
            Map<String, Object> event = Map.of(
                    "servicio", "ms_usuarios_roles_oauth",
                    "accion", accion,
                    "entidad", entidad,
                    "datos", datos,
                    "usuario", getUsuario(request),
                    "ip", getClientIp(request),
                    "mac", getServerMac(),
                    "fecha", LocalDateTime.now().toString()
            );

            rabbitTemplate.convertAndSend(exchange, routingKey, event);

            log.info("Evento de auditoría publicado en exchange '{}' con routing key '{}': {}",
                    exchange, routingKey, event);

        } catch (Exception e) {
            log.error("Error publicando evento de auditoría: {}", e.getMessage());
        }
    }

    private String getUsuario(HttpServletRequest request) {
        if (request == null || request.getUserPrincipal() == null) {
            return "anonymous";
        }
        return request.getUserPrincipal().getName();
    }

    private String getClientIp(HttpServletRequest request) {
        if (request == null) {
            return "127.0.0.1";
        }

        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }

        String ip = request.getRemoteAddr();

        if ("0:0:0:0:0:0:0:1".equals(ip)) {
            return "127.0.0.1";
        }

        return ip;
    }

    private String getServerMac() {
        try {
            InetAddress localHost = InetAddress.getLocalHost();
            NetworkInterface network = NetworkInterface.getByInetAddress(localHost);

            if (network == null || network.getHardwareAddress() == null) {
                return "00:00:00:00:00:00";
            }

            byte[] mac = network.getHardwareAddress();
            StringBuilder sb = new StringBuilder();

            for (int i = 0; i < mac.length; i++) {
                sb.append(String.format("%02X%s", mac[i], i < mac.length - 1 ? ":" : ""));
            }

            return sb.toString();

        } catch (Exception e) {
            return "00:00:00:00:00:00";
        }
    }
}