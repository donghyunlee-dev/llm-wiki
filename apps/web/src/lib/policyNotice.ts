export type PolicyNoticeSource = {
  id: string;
  title: string;
  href: string;
};

export type PolicyNoticeViewModel = {
  isPolicyRelated: boolean;
  message?: string;
  sources?: PolicyNoticeSource[];
};

export const DEFAULT_POLICY_NOTICE_MESSAGE = "이 답변은 내부 정책 기준을 함께 확인해 반영했습니다.";

export function shouldShowPolicyNotice(policyNotice: PolicyNoticeViewModel | null | undefined) {
  if (!policyNotice?.isPolicyRelated) {
    return false;
  }

  return Boolean(policyNotice.message?.trim() || policyNotice.sources?.length);
}

export function getPolicyNoticeMessage(policyNotice: PolicyNoticeViewModel) {
  return policyNotice.message?.trim() || DEFAULT_POLICY_NOTICE_MESSAGE;
}
