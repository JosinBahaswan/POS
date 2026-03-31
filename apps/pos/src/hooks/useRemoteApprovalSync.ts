import { useEffect } from "react";

const APPROVAL_REQUESTS_KEY = "pos_approval_requests";
const LOCAL_SYNC_EVENT = "local-storage-sync";

function scopedApprovalKey(scopeKey: string) {
  return `${APPROVAL_REQUESTS_KEY}:${scopeKey}`;
}

export function useRemoteApprovalSync(storageScope: string, refreshInterval = 5000) {
  useEffect(() => {
    const approvalStorageKey = scopedApprovalKey(storageScope);
    let lastSnapshot = localStorage.getItem(approvalStorageKey) ?? "[]";

    const notifySync = () => {
      window.dispatchEvent(new Event(LOCAL_SYNC_EVENT));
    };

    const onStorage = (event: StorageEvent) => {
      if (event.storageArea !== localStorage || event.key !== approvalStorageKey) {
        return;
      }

      const nextSnapshot = event.newValue ?? "[]";
      if (nextSnapshot === lastSnapshot) return;

      lastSnapshot = nextSnapshot;
      notifySync();
    };

    const interval = window.setInterval(() => {
      const nextSnapshot = localStorage.getItem(approvalStorageKey) ?? "[]";
      if (nextSnapshot === lastSnapshot) return;

      lastSnapshot = nextSnapshot;
      notifySync();
    }, Math.max(1000, refreshInterval));

    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.clearInterval(interval);
    };
  }, [storageScope, refreshInterval]);
}
