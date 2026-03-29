import { useCallback, useEffect, useState } from "react";
import {
  createManagedUser as createManagedUserRecord,
  listManagedUsers,
  updateManagedUser as updateManagedUserRecord,
  type ManagedUser,
  type ManagedUserRole
} from "../auth";

type UseManagedUsersParams = {
  enabled: boolean;
  tenantDependency?: string;
  writeAudit: (action: string, targetType: string, targetId?: string, detail?: string) => void;
};

export function useManagedUsers({ enabled, tenantDependency, writeAudit }: UseManagedUsersParams) {
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  useEffect(() => {
    if (!enabled) {
      setManagedUsers([]);
      setUsersError("");
      return;
    }

    let cancelled = false;

    void (async () => {
      setUsersLoading(true);
      setUsersError("");

      try {
        const users = await listManagedUsers();
        if (!cancelled) {
          setManagedUsers(users);
        }
      } catch (err) {
        if (!cancelled) {
          setUsersError(err instanceof Error ? err.message : "Gagal memuat akun staf.");
        }
      } finally {
        if (!cancelled) {
          setUsersLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, tenantDependency]);

  const refreshManagedUsers = useCallback(async () => {
    if (!enabled) return;

    setUsersLoading(true);
    setUsersError("");
    try {
      const users = await listManagedUsers();
      setManagedUsers(users);
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : "Gagal memuat akun staf.");
    } finally {
      setUsersLoading(false);
    }
  }, [enabled]);

  const createManagedUser = useCallback(
    async (input: {
      email: string;
      password: string;
      fullName: string;
      role: ManagedUserRole;
    }) => {
      const created = await createManagedUserRecord(input);
      writeAudit("staff_user_created", "user", created.id, `${created.fullName} (${created.role})`);
      await refreshManagedUsers();
    },
    [refreshManagedUsers, writeAudit]
  );

  const updateManagedUser = useCallback(
    async (input: {
      userId: string;
      role?: ManagedUserRole;
      isActive?: boolean;
      fullName?: string;
    }) => {
      await updateManagedUserRecord(input);
      writeAudit(
        "staff_user_updated",
        "user",
        input.userId,
        `${input.role ? `role ${input.role}` : ""}${input.isActive !== undefined ? ` status ${input.isActive ? "aktif" : "nonaktif"}` : ""}`.trim()
      );
      await refreshManagedUsers();
    },
    [refreshManagedUsers, writeAudit]
  );

  return {
    managedUsers,
    usersLoading,
    usersError,
    refreshManagedUsers,
    createManagedUser,
    updateManagedUser
  };
}
