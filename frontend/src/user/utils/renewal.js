export const getRenewalDate = (request) =>
  request?.next_renewal_date ||
  request?.nextRenewalDate ||
  request?.renewal_date ||
  request?.renewalDate ||
  null;

export const getGraceDays = (request) =>
  Number(
    request?.renewal_grace_days ??
      request?.grace_days ??
      request?.grace_period_days ??
      request?.gracePeriodDays ??
      0
  );

export const daysUntil = (dateValue) => {
  if (!dateValue) return null;
  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const target = new Date(
    typeof dateValue === "string" && dateValue.length <= 10
      ? `${dateValue}T00:00:00`
      : dateValue
  );
  if (Number.isNaN(target.getTime())) return null;
  const diff = (target - startOfToday) / (1000 * 60 * 60 * 24);
  return Math.ceil(diff);
};

export const isGraceExpired = (request) => {
  const renewalDate = getRenewalDate(request);
  const remaining = daysUntil(renewalDate);
  if (remaining === null) return false;

  const graceDays = getGraceDays(request);

  if (remaining < 0 && (!Number.isFinite(graceDays) || graceDays <= 0)) {
    return true;
  }

  if (remaining < 0 && Number.isFinite(graceDays) && graceDays > 0) {
    return Math.abs(remaining) > graceDays;
  }

  return false;
};

export const isRenewable = (request) => {
  if (!request) return false;
  const status = request?.renewal_status;
  if (status === "expired") return false;
  if (status === "active" || status === "due") {
    return !isGraceExpired(request);
  }
  if (!status) {
    return !isGraceExpired(request);
  }
  return false;
};
