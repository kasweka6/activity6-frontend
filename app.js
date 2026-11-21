import { recordService } from "./data.js";

const form = document.querySelector("#record-form");
const idInput = document.querySelector("#record-id");
const titleInput = document.querySelector("#title");
const categoryInput = document.querySelector("#category");
const descriptionInput = document.querySelector("#description");
const statusInput = document.querySelector("#status");
const body = document.querySelector("#records-body");
const messageBox = document.querySelector("#message");
const searchInput = document.querySelector("#search");
const statusFilter = document.querySelector("#status-filter");
const cancelEditButton = document.querySelector("#cancel-edit");
const saveButton = document.querySelector("#save-button");
const dialog = document.querySelector("#view-dialog");

let records = [];

function showMessage(message, type = "success") {
  messageBox.textContent = message;
  messageBox.className = `message ${type}`;
  messageBox.hidden = false;
  window.clearTimeout(showMessage.timeout);
  showMessage.timeout = window.setTimeout(() => { messageBox.hidden = true; }, 4500);
}

function statusClass(status) {
  if (status === "Completed") return "status-completed";
  if (status === "In progress") return "status-progress";
  return "status-pending";
}

function updateStats() {
  document.querySelector("#total-stat").textContent = records.length;
  document.querySelector("#pending-stat").textContent = records.filter(r => r.status === "Pending").length;
  document.querySelector("#progress-stat").textContent = records.filter(r => r.status === "In progress").length;
  document.querySelector("#completed-stat").textContent = records.filter(r => r.status === "Completed").length;
}

function makeCellText(tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  return element;
}

function renderRecords() {
  const query = searchInput.value.trim().toLowerCase();
  const filter = statusFilter.value;
  const visible = records.filter(record =>
    record.title.toLowerCase().includes(query) &&
    (filter === "All" || record.status === filter)
  );

  body.replaceChildren();
  if (visible.length === 0) {
    const row = document.createElement("tr");
    const cell = makeCellText("td", "No requests match your search. Add a request or change the filters.", "empty-row");
    cell.colSpan = 4;
    row.append(cell);
    body.append(row);
  } else {
    visible.forEach(record => {
      const row = document.createElement("tr");
      row.append(makeCellText("td", `#${record.id}`));

      const requestCell = document.createElement("td");
      requestCell.append(makeCellText("span", record.title, "request-name"));
      requestCell.append(makeCellText("span", record.category, "request-category"));
      row.append(requestCell);

      const statusCell = document.createElement("td");
      statusCell.append(makeCellText("span", record.status, `status ${statusClass(record.status)}`));
      row.append(statusCell);

      const actionCell = document.createElement("td");
      const actions = document.createElement("div");
      actions.className = "actions";
      [["View", "view"], ["Edit", "edit"], ["Delete", "delete"]].forEach(([label, action]) => {
        const button = makeCellText("button", label, `action-btn ${action}`);
        button.type = "button";
        button.dataset.action = action;
        button.dataset.id = record.id;
        actions.append(button);
      });
      actionCell.append(actions);
      row.append(actionCell);
      body.append(row);
    });
  }

  document.querySelector("#record-count").textContent = `${visible.length} ${visible.length === 1 ? "record" : "records"}`;
  document.querySelector("#results-summary").textContent = `Showing ${visible.length} of ${records.length} records`;
  updateStats();
}

function validateRecord() {
  const record = {
    title: titleInput.value.trim(),
    category: categoryInput.value.trim(),
    description: descriptionInput.value.trim(),
    status: statusInput.value
  };
  if (record.title.length < 3 || record.title.length > 80) {
    showMessage("Title must contain between 3 and 80 characters.", "error");
    titleInput.focus(); return null;
  }
  if (record.category.length < 2 || record.category.length > 40) {
    showMessage("Category must contain between 2 and 40 characters.", "error");
    categoryInput.focus(); return null;
  }
  if (record.description.length < 5 || record.description.length > 300) {
    showMessage("Description must contain between 5 and 300 characters.", "error");
    descriptionInput.focus(); return null;
  }
  if (!["Pending", "In progress", "Completed"].includes(record.status)) {
    showMessage("Choose a valid status.", "error");
    statusInput.focus(); return null;
  }
  return record;
}

function resetForm() {
  form.reset();
  idInput.value = "";
  statusInput.value = "Pending";
  document.querySelector("#form-heading").textContent = "Create a request";
  saveButton.innerHTML = 'Save request <span>→</span>';
  cancelEditButton.hidden = true;
}

async function refresh() {
  records = await recordService.list();
  renderRecords();
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const record = validateRecord();
  if (!record) return;
  try {
    if (idInput.value) {
      await recordService.update(Number(idInput.value), record);
      showMessage("Request updated successfully.");
    } else {
      await recordService.create(record);
      showMessage("New request added successfully.");
    }
    resetForm();
    await refresh();
  } catch (error) {
    showMessage(error.message || "Something went wrong.", "error");
  }
});

cancelEditButton.addEventListener("click", () => {
  resetForm();
  showMessage("Edit cancelled. No changes were saved.", "info");
});

body.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id);
  const action = button.dataset.action;
  try {
    if (action === "view") {
      const record = await recordService.get(id);
      document.querySelector("#view-title").textContent = record.title;
      const details = document.querySelector("#view-details");
      details.replaceChildren();
      [["ID", record.id], ["Category", record.category], ["Description", record.description], ["Status", record.status]].forEach(([label, value]) => {
        details.append(makeCellText("dt", label), makeCellText("dd", String(value)));
      });
      dialog.showModal();
    } else if (action === "edit") {
      const record = await recordService.get(id);
      idInput.value = record.id;
      titleInput.value = record.title;
      categoryInput.value = record.category;
      descriptionInput.value = record.description;
      statusInput.value = record.status;
      document.querySelector("#form-heading").textContent = `Edit request #${record.id}`;
      saveButton.innerHTML = 'Update request <span>→</span>';
      cancelEditButton.hidden = false;
      form.scrollIntoView({ behavior: "smooth", block: "start" });
      titleInput.focus({ preventScroll: true });
    } else if (action === "delete") {
      const confirmed = window.confirm(`Are you sure you want to delete "${records.find(r => r.id === id)?.title ?? "this request"}"?`);
      if (!confirmed) {
        showMessage("Deletion cancelled. The request is still saved.", "info");
        return;
      }
      await recordService.remove(id);
      if (Number(idInput.value) === id) resetForm();
      showMessage("Request deleted successfully.");
      await refresh();
    }
  } catch (error) {
    showMessage(error.message || "Unable to complete that action.", "error");
  }
});

searchInput.addEventListener("input", renderRecords);
statusFilter.addEventListener("change", renderRecords);
document.querySelector("#close-dialog").addEventListener("click", () => dialog.close());
document.querySelector("#dialog-done").addEventListener("click", () => dialog.close());

const menuToggle = document.querySelector("#menu-toggle");
const nav = document.querySelector("#main-nav");
menuToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});
nav.addEventListener("click", event => {
  if (event.target.closest("a")) {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});

document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach(item => item.classList.remove("active"));
    link.classList.add("active");
  });
});

await refresh();
