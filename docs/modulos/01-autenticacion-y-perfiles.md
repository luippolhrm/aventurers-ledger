# Módulo 01 — Autenticación y perfiles

## Nombre y propósito

Registro, inicio de sesión y gestión del perfil del usuario. Resuelve quién es el
usuario y protege el resto de la aplicación tras la sesión.

## Estado

✅ **Completo** — email+contraseña y OAuth Google funcionan de extremo a extremo.

## Qué hace (perspectiva del usuario)

- Registrarse con nombre visible, email y contraseña (con confirmación), o con
  un clic vía Google.
- Tras registrarse por email, ver una pantalla "revisa tu correo" para verificar
  la cuenta.
- Iniciar sesión con email/contraseña o Google; al entrar se va al dashboard.
- Cerrar sesión desde el sidebar.
- En `/profile`: ver la cuenta, editar el nombre visible y cambiar la contraseña.
  Para cuentas de Google se oculta el cambio de contraseña y se indica
  "Cuenta de Google".
- Cada usuario tiene un `username` único autogenerado en el registro.

## Cómo funciona

### Registro por email
1. El formulario (`app/auth/sign-up/page.tsx`) valida contraseñas iguales y llama
   a `AuthService.signUp`.
2. `AuthService` valida: email con formato estricto (regex + reglas de longitud
   y puntos), nombre no vacío, **contraseña mínimo 6 caracteres** (error
   `WEAK_PASSWORD`). Envía `display_name` como metadata.
3. Al crearse el usuario en Supabase, el trigger de BD `on_auth_user_created`
   (SECURITY DEFINER) crea la fila en `profiles` con el display_name y un
   **username único autogenerado** a partir del email.
4. Redirección a `/auth/sign-up-success` (⚠️ pantalla con texto en inglés,
   fuera del sistema de i18n).

### Login
- Email/contraseña → `AuthService.signIn` → error `INVALID_CREDENTIALS` si falla
  → `/dashboard` si funciona.
- Google → `AuthService.signInWithOAuth("google")` con `redirectTo` al callback →
  `app/auth/callback/route.ts` intercambia el código por sesión
  (`exchangeCodeForSession`) → `/dashboard`. El servicio soporta también
  `github` y `discord`, pero **la UI solo expone Google**.

### Sesión y protección
- `AuthProvider` (`lib/auth-context.tsx`) carga sesión y perfil al montar y
  escucha `onAuthStateChange` (login, logout, refresh de token). Expone
  `{ user, profile, loading }` vía `useAuth()`.
- Middleware `proxy.ts` → `lib/supabase/proxy.ts`: refresca el token en cada
  request (patrón `@supabase/ssr`) y aplica redirecciones (ver
  [02 — Arquitectura §2](../02-arquitectura-funcional.md)).
- `ProtectedRoute` (`components/auth/protected-route.tsx`) protege todo el grupo
  `app/(app)/`.

### Perfil
- `/profile` es un **server component** con guard propio (`getUser()` en servidor;
  sin sesión → login).
- Editar nombre → `ProfileService.updateProfile`; si se cambiara el username, el
  servicio **verifica unicidad** antes de guardar ("Username is already taken").
- Cambio de contraseña → `AuthService.updatePassword` (mínimo 6 caracteres).

### Reglas y validaciones
| Regla | Dónde |
|---|---|
| Contraseña ≥ 6 caracteres (registro y cambio) | `auth-service.ts` |
| Email con formato estricto | `ValidationUtils.validateEmail` |
| Username único (índice parcial en BD + chequeo en servicio) | BD + `profile-service.ts` |
| Perfil se crea siempre por trigger, nunca manualmente | trigger `handle_new_user` |

## Datos que usa

| Lee/Escribe | Tabla | Notas |
|---|---|---|
| Lee/escribe | `auth.users` (Supabase Auth) | gestionado por Supabase |
| Lee/escribe | `profiles` | display_name, username; RLS: cada uno lo suyo + lectura pública de perfiles |

## Interacción con otros módulos

- Todos los módulos dependen de `useAuth()` para obtener `user.id` (el "actor").
- El perfil (display_name) se muestra en miembros de campaña.

## Archivos involucrados

`app/auth/login/page.tsx` · `app/auth/sign-up/page.tsx` ·
`app/auth/sign-up-success/page.tsx` · `app/auth/callback/route.ts` ·
`app/(app)/profile/page.tsx` · `app/(app)/profile/profile-content.tsx` ·
`lib/application/services/auth-service.ts` ·
`lib/application/services/profile-service.ts` · `lib/auth-context.tsx` ·
`components/auth/protected-route.tsx` · `proxy.ts` · `lib/supabase/*` ·
`scripts/015_create_profiles_table.sql` · `scripts/047_add_username_to_profiles.sql`
