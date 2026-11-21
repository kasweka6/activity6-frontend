const KEY = "campuscare-maintenance-demo-v1";

const starterRecords = [
  { id: 1, title: "Broken classroom light", category: "Electrical", description: "The light in Room B12 does not switch on.", status: "Pending" },
  { id: 2, title: "Leaking tap near library", category: "Plumbing", description: "The tap outside the library washroom keeps leaking.", status: "In progress" },
  { id: 3, title: "Damaged lecture chair", category: "Furniture", description: "One chair in Lecture Room 4 has a loose leg.", status: "Pending" },
  { id: 4, title: "Blocked drainage channel", category: "Cleaning", description: "The drainage channel beside the student centre needs cleaning.", status: "Completed" },
  { id: 5, title: "Power socket not working", category: "Electrical", description: "The wall socket at the back of Lab 2 has no power.", status: "In progress" },
  { id: 6, title: "Broken office door handle", category: "Furniture", description: "The handle on the department office door is loose.", status: "Pending" },
  { id: 7, title: "Washroom pipe needs repair", category: "Plumbing", description: "A pipe under the sink in the main washroom is leaking.", status: "Completed" },
  { id: 8, title: "Dust in computer laboratory", category: "Cleaning", description: "The computer laboratory floor and desks need cleaning.", status: "Pending" }
];

function readRecords() {
  const saved = localStorage.getItem(KEY);
  if (saved === null) {
    localStorage.setItem(KEY, JSON.stringify(starterRecords));
    return [...starterRecords];
  }
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(KEY, JSON.stringify(records));
}

export const recordService = {
  async list() {
    return readRecords();
  },

  async get(id) {
    const record = readRecords().find(item => item.id === Number(id));
    if (!record) throw new Error("The requested record could not be found.");
    return record;
  },

  async create(record) {
    const records = readRecords();
    const nextId = records.length ? Math.max(...records.map(item => Number(item.id) || 0)) + 1 : 1;
    const newRecord = { id: nextId, ...record };
    records.push(newRecord);
    saveRecords(records);
    return newRecord;
  },

  async update(id, record) {
    const records = readRecords();
    const index = records.findIndex(item => item.id === Number(id));
    if (index === -1) throw new Error("The record could not be found.");
    records[index] = { id: Number(id), ...record };
    saveRecords(records);
    return records[index];
  },

  async remove(id) {
    const records = readRecords();
    const updated = records.filter(item => item.id !== Number(id));
    if (updated.length === records.length) throw new Error("The record could not be found.");
    saveRecords(updated);
    return "Request deleted successfully.";
  }
};
