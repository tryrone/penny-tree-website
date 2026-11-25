import "./style.css";

const menuButton = document.querySelector(".menu-toggle");
const navLinks = document.querySelector("#nav-links");
function setMenu(open) {
  menuButton.setAttribute("aria-expanded", String(open));
  navLinks.classList.toggle("is-open", open);
}
menuButton.addEventListener("click", () =>
  setMenu(menuButton.getAttribute("aria-expanded") !== "true"),
);
navLinks.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    menuButton.getAttribute("aria-expanded") === "true"
  ) {
    setMenu(false);
    menuButton.focus();
  }
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".nav")) setMenu(false);
});
window
  .matchMedia("(max-width: 760px)")
  .addEventListener("change", () => setMenu(false));

const form = document.querySelector("#waitlist-form");
const submitButton = form.querySelector('button[type="submit"]');
const status = document.querySelector("#form-status");
let submitting = false;
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (submitting || !form.reportValidity()) return;
  submitting = true;
  const data = new FormData(form);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  submitButton.disabled = true;
  submitButton.textContent = "Joining…";
  form.setAttribute("aria-busy", "true");
  status.textContent = "Sending your waitlist request…";
  try {
    const response = await fetch(form.action, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: data,
      signal: controller.signal,
    });
    const result = await response.json();
    if (
      !response.ok ||
      !(result.success === true || result.success === "true")
    ) {
      throw new Error("Waitlist request was not confirmed");
    }
    status.textContent =
      "Thanks! Your request has been sent to the PennyTree team for launch updates.";
    form.reset();
  } catch {
    status.textContent =
      "We couldn't confirm your request. Please try again or use the email link below.";
  } finally {
    clearTimeout(timeout);
    submitting = false;
    submitButton.disabled = false;
    submitButton.innerHTML =
      'Join the waitlist <span aria-hidden="true">↗</span>';
    form.removeAttribute("aria-busy");
  }
});

const byId = (id) => document.getElementById(id);
const currency = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});
const naira = (amount) => currency.format(amount);
const categories = {
  food: { label: "Food & groceries", amount: 48500 },
  transport: { label: "Transport", amount: 28000 },
  subscriptions: { label: "Subscriptions", amount: 15500 },
};
const cashAmount = 3500;
let includesCash = false;
const budget = byId("budget");

function renderMoney() {
  const food = categories.food.amount + (includesCash ? cashAmount : 0);
  const total =
    food + categories.transport.amount + categories.subscriptions.amount;
  const selected = document.querySelector(
    'input[name="category"]:checked',
  ).value;
  const selectedAmount =
    selected === "food" ? food : categories[selected].amount;
  const percentage = Math.round((selectedAmount / total) * 100);
  const limit = Number(budget.value);
  const remaining = limit - total;
  const overBudget = remaining < 0;
  const roomLabel = overBudget ? "Over budget" : "Room left";

  byId("food-value").textContent = naira(food);
  byId("food-segment").style.flexGrow = food;
  byId("understand").dataset.category = selected;
  byId("category-detail").textContent =
    categories[selected].label +
    " took " +
    percentage +
    "% of Dami’s spending.";
  byId("budget-value").value = naira(limit);
  budget.setAttribute("aria-valuetext", naira(limit));
  byId("budget-spent").textContent = naira(total);
  byId("budget-label").textContent = roomLabel;
  byId("budget-room").textContent = naira(Math.abs(remaining));
  const result = byId("budget-room").closest(".budget-result");
  result.toggleAttribute("data-over", overBudget);
  result.style.setProperty("--spending-ratio", Math.min(1, total / limit));
}

function renderCash() {
  const showingCash =
    document.querySelector('input[name="capture"]:checked').value === "cash";
  byId("cash-panel").hidden = !showingCash;
  byId("bank-panel").hidden = showingCash;
  byId("cash-action").firstChild.textContent = includesCash
    ? "Remove sample cash expense "
    : "Add sample cash expense ";
  byId("cash-action").lastElementChild.textContent = includesCash ? "−" : "+";
  byId("cash-status").textContent = includesCash
    ? naira(cashAmount) + " added to groceries and this month’s spending."
    : "Add this expense to see it in the next two chapters.";
}

byId("capture-choices").addEventListener("change", renderCash);
byId("cash-action").addEventListener("click", () => {
  includesCash = !includesCash;
  renderCash();
  renderMoney();
});
byId("category-choices").addEventListener("change", renderMoney);
budget.addEventListener("input", renderMoney);
budget.addEventListener("change", () => {
  byId("budget-status").textContent =
    byId("budget-label").textContent + " " + byId("budget-room").textContent;
});
renderCash();
renderMoney();

const chapterLinks = [...document.querySelectorAll(".chapter-nav a")];
const chapters = chapterLinks.map((link) => document.querySelector(link.hash));
const scenes = [...document.querySelectorAll("[data-scene]")];
const art = [...document.querySelectorAll("[data-art]")];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let requestedFrame = 0;

function renderScroll() {
  requestedFrame = 0;
  const viewport = window.innerHeight;
  const scrollable = document.documentElement.scrollHeight - viewport;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
  const line = Math.max(135, viewport * 0.43);
  const sections = chapters.map((chapter) => chapter.getBoundingClientRect());
  const trustTop = byId("your-data").getBoundingClientRect().top;
  let current = -1;

  if (trustTop > line) {
    sections.forEach((section, index) => {
      if (section.top <= line) current = index;
    });
  }

  const positions = reduceMotion.matches
    ? []
    : art.map((element) => element.getBoundingClientRect());
  document.documentElement.style.setProperty("--progress", progress);
  chapterLinks.forEach((link, index) => {
    if (index === current) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  positions.forEach((position, index) => {
    if (position.bottom < 0 || position.top > viewport) return;
    const distance =
      (position.top + position.height / 2 - viewport / 2) * -0.025;
    const maximum = Math.min(16, position.height * 0.023);
    art[index].style.setProperty(
      "--art-y",
      Math.max(-maximum, Math.min(maximum, distance)) + "px",
    );
  });
}

function scheduleScroll() {
  if (!requestedFrame) requestedFrame = requestAnimationFrame(renderScroll);
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-seen");
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.18 },
  );
  scenes.forEach((scene) => observer.observe(scene));
}
window.addEventListener("scroll", scheduleScroll, { passive: true });
window.addEventListener("resize", scheduleScroll);
window.addEventListener("hashchange", scheduleScroll);
reduceMotion.addEventListener("change", scheduleScroll);

scheduleScroll();
