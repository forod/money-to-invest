# Guía de Ciberseguridad: OWASP Mobile Top 10

Este documento establece las directrices fundamentales de seguridad de la información que rigen todo el desarrollo, modificación y arquitectura de esta aplicación móvil, basadas en el estándar **OWASP Mobile Top 10**. Toda modificación o adición de código en este repositorio debe respetar estrictamente estos pilares.

---

## 🔐 Pilares Clave de Seguridad (OWASP Mobile Top 10)

### 1. M1: Uso Inadecuado de Credenciales (Improper Credential Usage)
* **Directriz**: Nunca guardes credenciales de usuario, contraseñas, secretos de API o claves privadas directamente en el código fuente (hardcoded).
* **Acción en el código**:
  - Utilizar variables de entorno a través de archivos `.env` (no incluidos en el control de versiones).
  - Usar la autenticación delegada de Supabase y tokens ID validados del lado del servidor.

### 2. M2: Seguridad Inadecuada de la Cadena de Suministro (Inadequate Supply Chain Security)
* **Directriz**: Monitorear y validar constantemente los paquetes y librerías externas de terceros antes de incorporarlos al proyecto.
* **Acción en el código**:
  - Utilizar gestores de paquetes oficiales (`npm`, `expo install`).
  - Ejecutar periódicamente análisis de vulnerabilidades mediante comandos como `npm audit`.

### 3. M3: Almacenamiento Inseguro de Datos (Insecure Data Storage)
* **Directriz**: No almacenar información sensible (tokens de sesión, perfiles de usuario, montos financieros) en almacenamiento plano sin cifrar (como `AsyncStorage` ordinario).
* **Acción en el código**:
  - Utilizar **`expo-secure-store`** para almacenar el token de autenticación del usuario en el llavero cifrado del dispositivo (Keychain en iOS, Keystore en Android).

### 4. M4: Comunicación Insegura (Insecure Communication)
* **Directriz**: Proteger todas las comunicaciones entre la aplicación móvil y el servidor backend contra ataques de interceptación (Man-in-the-Middle).
* **Acción en el código**:
  - Forzar que todas las conexiones con las APIs de Supabase y de Google utilicen protocolos seguros **HTTPS/WSS**.
  - Evitar el envío de parámetros sensibles en la URL como texto plano.

### 5. M5: Validación de Comunicación Inadecuada (Inadequate Communication Security)
* **Directriz**: Asegurar que las comunicaciones cifradas HTTPS sean validadas adecuadamente mediante certificados confiables y configuraciones seguras de TLS.
* **Acción en el código**:
  - No anular ni ignorar las alertas de certificados SSL en los clientes HTTP (por ejemplo, Axios o Fetch).

### 6. M6: Validación Insuficiente de Entradas/Salidas (Insufficient Input/Output Validation)
* **Directriz**: Sanitizar, validar y limitar cada dato introducido por el usuario para prevenir vulnerabilidades de inyección y desbordamientos.
* **Acción en el código**:
  - Utilizar expresiones regulares en los formularios para sanitizar los inputs de texto (ej. retirar caracteres especiales al parsear montos monetarios o numéricos).
  - Validar límites máximos y tipos de datos (como restringir a 8 dígitos el ingreso del usuario para evitar desbordamientos de interfaz y errores de lógica en la base de datos).

### 7. M7: Calidad del Código del Cliente (Client Code Quality)
* **Directriz**: Mantener un código limpio, estructurado y libre de fugas de memoria o errores lógicos que puedan ser aprovechados para desestabilizar la aplicación.
* **Acción en el código**:
  - Usar tipado estático estricto de TypeScript en todo el proyecto.
  - Implementar manejo de excepciones estructurado (`try-catch`) en cada interacción con APIs de red o almacenamiento persistente.

### 8. M8: Manipulación de Código (Code Tampering)
* **Directriz**: Prevenir y detectar modificaciones no autorizadas en el binario de la aplicación una vez compilado.
* **Acción en el código**:
  - Implementar flujos confiables del lado del servidor (Supabase) con validaciones e inyecciones de datos seguras mediante políticas de acceso RLS (Row Level Security), de modo que el cliente no decida las reglas del negocio de manera aislada.

### 9. M9: Protección Binaria Insuficiente (Insufficient Binary Protection)
* **Directriz**: Evitar la facilidad de ingeniería inversa de la aplicación.
* **Acción en el código**:
  - Ofuscar y minificar el código JavaScript en la compilación de producción mediante herramientas estándar de Expo y Metro Bundler.

### 10. M10: Gestión de Sesiones Insuficiente (Insufficient Session Management)
* **Directriz**: Gestionar de forma segura la caducidad y renovación de las sesiones de los usuarios.
* **Acción en el código**:
  - Configurar políticas de renovación automática de tokens de acceso (`autoRefreshToken: true`) controladas y revocables desde el panel de administración de Supabase Auth.
