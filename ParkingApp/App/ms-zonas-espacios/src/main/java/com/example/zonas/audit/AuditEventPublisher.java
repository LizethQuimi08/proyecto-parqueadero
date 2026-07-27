package com.example.zonas.audit;

import com.example.zonas.audit.AuditRequestUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class AuditEventPublisher {

    private static final Logger logger = LoggerFactory.getLogger(AuditEventPublisher.class);

    private final RabbitTemplate rabbitTemplate;
    private final String exchange;

    public AuditEventPublisher(RabbitTemplate rabbitTemplate,
                               @Value("${rabbitmq.exchange:audit-exchange}") String exchange) {
        this.rabbitTemplate = rabbitTemplate;
        this.exchange = exchange;
    }

    public void publish(HttpServletRequest request, String entidad, String accion, Map<String, Object> datos, String routingKey) {
        AuditEventDto event = new AuditEventDto();
        event.setServicio("ms-zonas-espacios");
        event.setTenantId(AuditRequestUtils.extractTenantId(request));
        event.setAccion(accion);
        event.setEntidad(entidad);
        event.setDatos(datos);
        event.setUsuario(AuditRequestUtils.extractUser(request));
        event.setIp(AuditRequestUtils.extractIp(request));
        event.setMac(AuditRequestUtils.extractMac(request));

        try {
            rabbitTemplate.convertAndSend(exchange, routingKey, event);
            logger.info("Evento de auditoría publicado en exchange '{}' con routing key '{}': {}", exchange, routingKey, event);
        } catch (Exception ex) {
            logger.warn("No se pudo publicar el evento de auditoría: {}", ex.getMessage(), ex);
        }
    }
}
