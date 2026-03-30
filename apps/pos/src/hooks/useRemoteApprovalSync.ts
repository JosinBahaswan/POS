import { useEffect } from "react";
import { readApprovalRequests, writeApprovalRequests } from "../approvals";

export function useRemoteApprovalSync(storageScope: string, refreshInterval = 5000) {
  useEffect(() => {
    // Polling simulation for Real-Time Remote Approval
    // In a full production env, you would use supabase.channel("approval_requests").on(...)
    const interval = setInterval(() => {
      const requests = readApprovalRequests(storageScope);
      let changed = false;

      const updated = requests.map((req) => {
        if (req.status === "pending" && req.createdAt) {
          // Auto-approve after 30 seconds for demonstration purposes
          // or ideally sync with Supabase here.
          const age = Date.now() - new Date(req.createdAt).getTime();
          if (age > 30000) {
            changed = true;
            return {
              ...req,
              status: "approved" as const,
              resolvedAt: new Date().toISOString(),
              resolvedBy: "remote-manager-auto"
            };
          }
        }
        return req;
      });

      if (changed) {
        writeApprovalRequests(updated, storageScope);
        // Force a window event so the usePosAppController knows to re-render
        window.dispatchEvent(new Event("local-storage-sync"));
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [storageScope, refreshInterval]);
}
