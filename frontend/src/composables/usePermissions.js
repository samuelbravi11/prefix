// src/composables/usePermissions.js
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth.store";

/**
 * usePermissions (allineato al tuo auth.store.js)
 * - Permessi primari: authStore.permissions (ritornati da /users/me)
 * - Fallback: cerca anche dentro authStore.user.* nel caso cambi formato
 * - Superuser: se utente admin-like => tutto true
 * - inheritAllBuildings: è una "property" (non un permission key), ma la esponiamo
 */
export function usePermissions() {
  const authStore = useAuthStore();

  const isSuperUser = computed(() => {
    const u = authStore.user || {};
    // Se nel backend hai un flag admin o un ruolo admin
    return Boolean(
      u.isAdmin ||
        u.isSuperAdmin ||
        u.role?.isAdmin ||
        u.role?.name === "admin" ||
        u.role?.key === "admin" ||
        u.roles?.some?.((r) => (typeof r === "string" ? r === "admin" : r?.roleName === "admin"))
    );
  });

  const inheritAllBuildings = computed(() => Boolean(authStore.inheritAllBuildings));

  const permissionSet = computed(() => {
    // fonte primaria (corretta nel tuo progetto)
    const primary = Array.isArray(authStore.permissions) ? authStore.permissions : [];

    // fallback: nel caso il backend cambi payload in futuro
    const u = authStore.user || {};
    const fallback =
      u.permissions ||
      u.role?.permissions ||
      u.role?.permissionKeys ||
      u.role?.allowedPermissions ||
      [];

    const merged = [
      ...primary,
      ...(Array.isArray(fallback) ? fallback : []),
    ];

    return new Set(merged.map((p) => String(p)));
  });

  function hasPermission(permissionKey) {
    if (!permissionKey) return false;
    if (isSuperUser.value) return true;
    return permissionSet.value.has(String(permissionKey));
  }

  function hasAny(permissionKeys = []) {
    if (isSuperUser.value) return true;
    if (!Array.isArray(permissionKeys) || permissionKeys.length === 0) return false;
    return permissionKeys.some((p) => permissionSet.value.has(String(p)));
  }

  return {
    hasPermission,
    hasAny,
    isSuperUser,
    permissionSet,
    inheritAllBuildings,
  };
}
