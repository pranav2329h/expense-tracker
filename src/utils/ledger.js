/**
 * Lend & Borrow calculations.
 *
 * Every entry is from your point of view:
 *   gave → you lent money, paid for them, or repaid them   (they owe you more)
 *   got  → they lent you money, paid for you, or repaid you (you owe them more)
 * A person's balance is gave − got: positive means they owe you, negative means you owe them.
 */
import { roundMoney } from './calculations';

const SETTLED_EPSILON = 0.005;

export function getBalanceStatus(balance) {
  if (balance > SETTLED_EPSILON) return 'get';
  if (balance < -SETTLED_EPSILON) return 'give';
  return 'settled';
}

/** One summary per person (including entries whose person was deleted), highest balance first. */
export function getPersonBalances(people, entries) {
  const summaries = new Map(
    people.map((person) => [person.id, { id: person.id, name: person.name, gave: 0, got: 0, count: 0, lastDate: null }]),
  );
  for (const entry of entries) {
    let summary = summaries.get(entry.personId);
    if (!summary) {
      summary = { id: entry.personId, name: entry.personName, gave: 0, got: 0, count: 0, lastDate: null, missing: true };
      summaries.set(entry.personId, summary);
    }
    if (entry.direction === 'gave') summary.gave += entry.amount;
    else summary.got += entry.amount;
    summary.count += 1;
    if (!summary.lastDate || entry.date > summary.lastDate) summary.lastDate = entry.date;
  }

  return [...summaries.values()]
    .map((summary) => {
      const balance = roundMoney(summary.gave - summary.got);
      return {
        ...summary,
        gave: roundMoney(summary.gave),
        got: roundMoney(summary.got),
        balance,
        status: getBalanceStatus(balance),
      };
    })
    .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance) || a.name.localeCompare(b.name));
}

/** Totals across people: what you will get back and what you will give back. */
export function getLedgerTotals(balances) {
  let toGet = 0;
  let toGive = 0;
  let getCount = 0;
  let giveCount = 0;
  for (const person of balances) {
    if (person.status === 'get') {
      toGet += person.balance;
      getCount += 1;
    } else if (person.status === 'give') {
      toGive -= person.balance;
      giveCount += 1;
    }
  }
  return {
    toGet: roundMoney(toGet),
    toGive: roundMoney(toGive),
    net: roundMoney(toGet - toGive),
    getCount,
    giveCount,
    openCount: getCount + giveCount,
  };
}

const createdTime = (entry) => (entry.createdAt instanceof Date ? entry.createdAt.getTime() : 0);

/** Newest first, each entry annotated with the person's balance right after it. */
export function withRunningBalance(entries) {
  const oldestFirst = [...entries].sort(
    (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : createdTime(a) - createdTime(b)),
  );
  let running = 0;
  const annotated = oldestFirst.map((entry) => {
    running += entry.direction === 'gave' ? entry.amount : -entry.amount;
    return { ...entry, balanceAfter: roundMoney(running) };
  });
  return annotated.reverse();
}

/** The entry that brings a balance back to zero. */
export function getSettlement(balance) {
  const status = getBalanceStatus(balance);
  if (status === 'settled') return null;
  return { direction: status === 'get' ? 'got' : 'gave', amount: roundMoney(Math.abs(balance)) };
}
