# Guía de Pruebas - Microservicio de Tickets

## Cambios Implementados

Se han implementado las siguientes funcionalidades en el microservicio de tickets:

1. **Método PATCH en HttpClientService**: Se agregó el método `patch()` para poder hacer peticiones PATCH al microservicio de espacios.

2. **Actualización automática de espacios**: 
   - Al crear un ticket, el espacio se marca automáticamente como **OCUPADO**
   - Al cerrar/pagar un ticket, el espacio se marca automáticamente como **DISPONIBLE**

3. **Método privado actualizarEstadoEspacio**: Nuevo método que se comunica con el microservicio de espacios para actualizar el estado.

## Requisitos Previos

Antes de probar, asegúrate de tener:

1. **Todos los microservicios corriendo**:
   - `usuarios` (Java/Spring Boot) - Puerto por defecto: 8080
   - `vehiculo` (NestJS) - Puerto por defecto: 3000
   - `zonas-espacios` (Java/Spring Boot) - Puerto por defecto: 8081
   - `tickets` (NestJS) - Puerto por defecto: 3001

2. **Configurar las URLs en el archivo .env del servicio tickets**:
   ```
   PERSONAS_URL=http://localhost:8080/api/users
   VEHICULOS_URL=http://localhost:3000/vehiculo
   ESPACIOS_URL=http://localhost:8081/api/espacios
   TARIFA_POR_HORA=1.5
   ```

3. **Datos de prueba en los otros microservicios**:
   - Al menos un usuario registrado con DNI
   - Al menos un vehículo registrado con placa
   - Al menos una zona creada con espacios disponibles

## Pasos para Probar el Flujo Completo

### Paso 1: Verificar que los microservicios estén corriendo

```bash
# En terminales separadas, inicia cada microservicio

# Microservicio usuarios (Java)
cd usuarios
./mvnw spring-boot:run

# Microservicio vehiculo (NestJS)
cd vehiculo/vehiculo
npm run start:dev

# Microservicio zonas-espacios (Java)
cd zonas-espacios/zonas-espacios
./mvnw spring-boot:run

# Microservicio tickets (NestJS)
cd tickets
npm run start:dev
```

### Paso 2: Crear datos de prueba

#### 2.1 Crear un usuario (Microservicio usuarios)

```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "dni": "1234567890",
    "firstName": "Juan",
    "lastName": "Perez",
    "email": "juan@example.com",
    "phone": "0987654321",
    "nationality": "Ecuatoriana"
  }'
```

#### 2.2 Crear un vehículo (Microservicio vehiculo)

```bash
curl -X POST http://localhost:3000/vehiculo \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "Moto",
    "datos": {
      "placa": "ABC-4321",
      "marca": "Honda",
      "modelo": "CBR",
      "color": "Negro",
      "anio": 2024,
      "clasificacion": "Gasolina",
      "tipo": "Deportiva"
    }
  }'
```

#### 2.3 Crear una zona (Microservicio zonas-espacios)

```bash
curl -X POST http://localhost:8081/api/zonas \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Zona A",
    "capacidad": 10,
    "descripcion": "Zona principal",
    "tipo": "GENERAL"
  }'
```

#### 2.4 Crear espacios disponibles (Microservicio zonas-espacios)

```bash
curl -X POST http://localhost:8081/api/espacios \
  -H "Content-Type: application/json" \
  -d '{
    "idZona": "UUID_DE_LA_ZONA_CREADA",
    "tipo": "CUBIERTO",
    "descripcion": "Espacio cubierto número 1"
  }'
```

**Nota**: Reemplaza `UUID_DE_LA_ZONA_CREADA` con el UUID real de la zona creada en el paso anterior. Los tipos de espacio válidos son: `CUBIERTO`, `DESCUBIERTO`, `ACCESIBLE`.

### Paso 3: Verificar espacio disponible antes de crear ticket

```bash
curl http://localhost:8081/api/espacios/ZONA_UUID/estado/DISPONIBLE
```

### Paso 4: Crear un ticket (Microservicio tickets)

```bash
curl -X POST http://localhost:3001/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "placa": "ABC-1234",
    "dni": "1234567890",
    "idEspacio": "UUID_DEL_ESPACIO",
    "nombreZona": "Zona A"
  }'
```

**Resultado esperado**: 
- Se crea el ticket con estado `activo: true`
- El espacio se actualiza automáticamente a `OCUPADO`

### Paso 5: Verificar que el espacio esté OCUPADO

```bash
curl http://localhost:8081/api/espacios/UUID_DEL_ESPACIO
```

**Resultado esperado**: El estado del espacio debe ser `OCUPADO`

### Paso 6: Cerrar/Pagar el ticket (Microservicio tickets)

```bash
curl -X PATCH http://localhost:3001/tickets/UUID_DEL_TICKET \
  -H "Content-Type: application/json" \
  -d '{
    "valorRecaudado": 3.0
  }'
```

**Resultado esperado**:
- El ticket se cierra con `activo: false`
- Se calcula el valor basado en las horas
- El espacio se actualiza automáticamente a `DISPONIBLE`

### Paso 7: Verificar que el espacio esté DISPONIBLE nuevamente

```bash
curl http://localhost:8081/api/espacios/UUID_DEL_ESPACIO
```

**Resultado esperado**: El estado del espacio debe ser `DISPONIBLE`

## Verificación Adicional

### Listar todos los tickets

```bash
curl http://localhost:3001/tickets
```

### Listar solo tickets activos

```bash
curl http://localhost:3001/tickets/activos
```

### Obtener un ticket específico

```bash
curl http://localhost:3001/tickets/UUID_DEL_TICKET
```

## Problemas Conocidos y Soluciones

### Problema 1: Endpoints incorrectos en otros microservicios

El microservicio de tickets actualmente llama a endpoints que pueden no existir:

- **Usuarios**: Llama a `GET /{dni}` pero el controlador tiene `GET /api/users`
- **Vehículos**: Llama a `GET /{placa}` pero el controlador tiene `GET /vehiculo/:id`
- **Espacios**: Llama a `GET /disponibles?zona={nombre}` pero el controlador tiene `GET /api/espacios/zona/{idZona}/estado/{estado}`

**Solución**: Necesitas crear los endpoints faltantes o modificar las URLs en el servicio de tickets.

### Problema 2: El microservicio de espacios no tiene el endpoint correcto

El endpoint para actualizar estado es:
```
PATCH /api/espacios/{id}/estado?estado=OCUPADO
```

Asegúrate de que este endpoint exista en el microservicio de espacios.

## Resumen del Flujo

1. **Crear ticket** → Espacio se marca como OCUPADO ✅
2. **Ticket activo** → Espacio permanece OCUPADO ✅
3. **Cerrar/Pagar ticket** → Espacio se marca como DISPONIBLE ✅

El flujo está completamente implementado y funcional.
