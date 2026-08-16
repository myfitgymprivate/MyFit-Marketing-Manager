export type CampaignFinancialState = {
  proposedDiscountValue: number | null;
  financialConfirmedAt: Date | null;
  financialConfirmedBy: string | null;
};

export function canActivateCampaign(state: CampaignFinancialState) {
  if (state.proposedDiscountValue === null) {
    return true;
  }

  return Boolean(state.financialConfirmedAt && state.financialConfirmedBy);
}

export function assertCampaignCanActivate(state: CampaignFinancialState) {
  if (!canActivateCampaign(state)) {
    throw new Error("CAMPAIGN_FINANCIAL_CONFIRMATION_REQUIRED");
  }
}
