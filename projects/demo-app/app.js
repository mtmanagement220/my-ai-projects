"use strict";

const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const list = document.querySelector("#task-list");
const count = document.querySelector("#task-count");
const clearButton = document.querySelector("#clear-completed");

const tasks = [];

function renderTasks() {
  list.replaceChildren();

  for (const task of tasks) {
    const item = document.createElement("li");
    if (task.done) item.classList.add("done");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", task.done ? "কাজটি অসম্পন্ন করো" : "কাজটি সম্পন্ন করো");
    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      renderTasks();
    });

    const label = document.createElement("span");
    label.textContent = task.text;

    item.append(checkbox, label);
    list.append(item);
  }

  const remaining = tasks.filter((task) => !task.done).length;
  count.textContent = tasks.length === 0
    ? "এখনো কোনো কাজ নেই"
    : `মোট ${tasks.length}টি কাজ · বাকি ${remaining}টি`;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }

  tasks.push({ id: Date.now(), text, done: false });
  input.value = "";
  renderTasks();
  input.focus();
});

clearButton.addEventListener("click", () => {
  for (let index = tasks.length - 1; index >= 0; index -= 1) {
    if (tasks[index].done) tasks.splice(index, 1);
  }
  renderTasks();
});

renderTasks();
