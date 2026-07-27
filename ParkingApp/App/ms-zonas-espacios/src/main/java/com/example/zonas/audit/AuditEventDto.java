package com.example.zonas.audit;

import java.util.Map;

public class AuditEventDto {

    private String servicio;
    private String tenantId;
    private String accion;
    private String entidad;
    private Map<String, Object> datos;
    private String usuario;
    private String ip;
    private String mac;

    public AuditEventDto() {
    }

    public AuditEventDto(String servicio, String tenantId, String accion, String entidad, Map<String, Object> datos, String usuario, String ip, String mac) {
        this.servicio = servicio;
        this.tenantId = tenantId;
        this.accion = accion;
        this.entidad = entidad;
        this.datos = datos;
        this.usuario = usuario;
        this.ip = ip;
        this.mac = mac;
    }

    public String getServicio() {
        return servicio;
    }

    public void setServicio(String servicio) {
        this.servicio = servicio;
    }

    public String getTenantId() {
        return tenantId;
    }

    public void setTenantId(String tenantId) {
        this.tenantId = tenantId;
    }

    public String getAccion() {
        return accion;
    }

    public void setAccion(String accion) {
        this.accion = accion;
    }

    public String getEntidad() {
        return entidad;
    }

    public void setEntidad(String entidad) {
        this.entidad = entidad;
    }

    public Map<String, Object> getDatos() {
        return datos;
    }

    public void setDatos(Map<String, Object> datos) {
        this.datos = datos;
    }

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }

    public String getMac() {
        return mac;
    }

    public void setMac(String mac) {
        this.mac = mac;
    }
}
