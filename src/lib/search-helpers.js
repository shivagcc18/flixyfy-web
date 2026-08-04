const currentYear = 2026;

export function getYearOptions(domain) {
  const years = domain === "historical"
    ? Array.from({ length: 1999 - 1959 }, (_, index) => String(1999 - index))
    : Array.from({ length: currentYear - 1999 }, (_, index) => String(currentYear - index));

  return [
    { value: "", label: "Any year" },
    ...years.map((year) => ({ value: year, label: year })),
  ];
}

export function isYearValidForDomain(year, domain) {
  const value = String(year ?? "").trim();
  if (!/^[0-9]{4}$/.test(value)) return false;
  const numeric = Number(value);
  return domain === "historical"
    ? numeric >= 1960 && numeric <= 1999
    : numeric >= 2000 && numeric <= currentYear;
}

export function getYearRange(domain) {
  return domain === "historical"
    ? { min: 1960, max: 1999 }
    : { min: 2000, max: currentYear };
}
