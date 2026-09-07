export const moneyToCents = (amount: string): bigint => {
  const sign = amount.startsWith("-") ? -1n : 1n;
  const [whole, fraction = ""] = amount.replace(/^-/, "").split(".");
  return sign * (BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0")));
};

export const centsToMoney = (amount: bigint): string => {
  const sign = amount < 0n ? "-" : "";
  const absolute = amount < 0n ? -amount : amount;
  return `${sign}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, "0")}`;
};
