# GAMEVERSE AI

Plataforma creativa para videojuegos, programación y diseño.

## Estado
Base inicial del proyecto. La interfaz HTML está incorporada; faltan integrar los archivos de estilos, lógica del cliente y servidor.

## Próximos módulos
- Chat principal y modos especializados
- Proyectos y biblioteca
- GAMEVERSE STUDIO Professional
- Editor 2D y 3D
- Exportación web y Windows

## Desarrollo
No publiques claves API ni archivos `.env`. Usa variables de entorno locales para cualquier secreto.


## Inicio de sesión (Firebase Authentication)

La pantalla de acceso usa Firebase Authentication (correo/contraseña y Google). Para activarla:

1. En Firebase Console, crea un proyecto propio para GAMEVERSE AI y registra una aplicación web.
2. En **Authentication > Sign-in method**, activa **Email/Password** y **Google**.
3. En **Authentication > Settings > Authorized domains**, agrega `franciscomzr22-web.github.io`.
4. Copia la configuración de la aplicación web en `firebase-config.js` (apiKey, authDomain, projectId y appId).
5. Publica los cambios. No pongas contraseñas, claves privadas ni secretos en ese archivo.

La interfaz muestra una pantalla de configuración hasta completar estos pasos. Firebase Authentication ofrece un nivel sin costo sujeto a sus límites y condiciones.
