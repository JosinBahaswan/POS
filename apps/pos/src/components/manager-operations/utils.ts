import type { ApprovalRequest } from "../../approvals";

export function approvalLabel(type: ApprovalRequest["type"]) {
  switch (type) {
    case "large-discount":
      return "Diskon Besar";
    case "loss-risk":
      return "Risiko Margin";
    case "refund":
      return "Refund";
    default:
      return "Void";
  }
}

export function approvalAgeMinutes(createdAt: string) {
  return approvalAgeMinutesAt(createdAt, Date.now());
}

export function approvalAgeMinutesAt(createdAt: string, nowTs: number) {
  return Math.max(0, Math.round((nowTs - new Date(createdAt).getTime()) / (60 * 1000)));
}

export function approvalTypePriority(type: ApprovalRequest["type"]) {
  switch (type) {
    case "loss-risk":
      return 4;
    case "refund":
      return 3;
    case "void":
      return 2;
    default:
      return 1;
  }
}
