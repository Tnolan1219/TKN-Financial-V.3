/**
 * MilFi Entitlements System v1
 * LocalStorage key: "milfi_state_v1"
 * Supports multiple users, Free/Pro plans, usage tracking per calculator, monthly reset.
 * Dispatches "milfi:planChanged" and "milfi:usageUpdated" CustomEvents.
 */

// --- Utility ---
function safeParse(json, fallback) {
  try { return JSON.parse(json); } catch { return fallback; }
}
function formatMonthKey(date = new Date()) {
  return date.toLocaleString('en-CA', { year: 'numeric', month: '2-digit' }).slice(0, 7);
}

// --- State ---
const LS_KEY = "milfi_state_v1";
function getState() {
  return safeParse(localStorage.getItem(LS_KEY), {
    activeUserId: "default",
    users: {}
  });
}
function setState(state) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

// --- API ---
export function initState() {
  let state = getState();
  if (!state.activeUserId) state.activeUserId = "default";
  if (!state.users[state.activeUserId]) {
    state.users[state.activeUserId] = {
      plan: "free",
      usage: { month: formatMonthKey(), total: 0, byCalc: {} }
    };
  }
  // Monthly rollover
  const nowMonth = formatMonthKey();
  let usage = state.users[state.activeUserId].usage;
  if (usage.month !== nowMonth) {
    usage = { month: nowMonth, total: 0, byCalc: {} };
    state.users[state.activeUserId].usage = usage;
    setState(state);
  }
}

export function getActiveUserId() {
  return getState().activeUserId || "default";
}
export function setActiveUserId(id) {
  let state = getState();
  if (!id) id = "default";
  state.activeUserId = id;
  if (!state.users[id]) {
    state.users[id] = {
      plan: "free",
      usage: { month: formatMonthKey(), total: 0, byCalc: {} }
    };
  }
  setState(state);
  initState();
}

export function getPlan() {
  let state = getState();
  let user = state.users[state.activeUserId];
  return user ? user.plan : "free";
}
export function setPlan(plan) {
  let state = getState();
  let user = state.users[state.activeUserId];
  if (!user) return;
  user.plan = (plan === "pro" ? "pro" : "free");
  setState(state);
  window.dispatchEvent(new CustomEvent("milfi:planChanged", { detail: { plan: user.plan } }));
}

// Plan status is managed here and dispatched via milfi:planChanged event.

export function getUsage(calcId) {
  let state = getState();
  let user = state.users[state.activeUserId];
  if (!user) return { month: formatMonthKey(), total: 0, byCalc: {}, thisCalc: 0 };
  let usage = user.usage;
  let thisCalc = usage.byCalc[calcId] || 0;
  return { month: usage.month, total: usage.total, byCalc: usage.byCalc, thisCalc };
}

export function incrementUsage(calcId, inc = 1) {
  let state = getState();
  let user = state.users[state.activeUserId];
  if (!user) return;
  let usage = user.usage;
  usage.total += inc;
  usage.byCalc[calcId] = (usage.byCalc[calcId] || 0) + inc;
  setState(state);
  window.dispatchEvent(new CustomEvent("milfi:usageUpdated", { detail: { calcId, total: usage.total } }));
}

export function canRunFree(limit = 50) {
  const plan = getPlan();
  if (plan === "pro") return { allowed: true, remaining: Infinity };
  const usage = getUsage("_global");
  const remaining = Math.max(0, limit - usage.total);
  return { allowed: remaining > 0, remaining };
}

/**
 * Wrap calculator run logic with entitlements check.
 * @param {string} calcId
 * @param {Function} runner
 * @param {Object} opts {limit, onBlocked}
 */
export function guardedRun(calcId, runner, { limit = 50, onBlocked } = {}) {
  initState();
  const { allowed, remaining } = canRunFree(limit);
  if (!allowed) {
    if (typeof onBlocked === "function") onBlocked();
    else alert("Free limit reached, upgrade to Pro?");
    return;
  }
  runner();
  incrementUsage(calcId, 1);
}

export { formatMonthKey };
