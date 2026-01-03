if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').then(reg => {
            // Check for updates every time the page is opened
            reg.update();
        });
    });
}
// 1. Keep your original data as the default
const defaultTimetable = {
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
    Sunday: []
};

// 2. State variables
let currentDay = "Monday";
let isEditMode = false;
let timetable = JSON.parse(localStorage.getItem("userTimetable")) || defaultTimetable;
let userName = localStorage.getItem("userName") || "Arush Gaur";

window.onload = () => {
    document.getElementById("userName").innerText = userName;
    setCurrentDay();
};

function setupEditButton() {
    const container = document.querySelector(".container");
    const editBtn = document.createElement("button");
    editBtn.id = "editBtn";
    editBtn.innerText = "✏️";
    editBtn.style = "position: fixed; top: 10px; right: 10px; z-index: 1001; padding: 8px 15px; border-radius: 20px; border: none; background: #1e88e5; color: white; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2); cursor: pointer;";
    editBtn.onclick = toggleEditMode;
    document.body.appendChild(editBtn);
}

function toggleEditMode() {
    isEditMode = !isEditMode;
    const btn = document.getElementById("editBtn");
    const nameHeader = document.getElementById("userName");

    if (isEditMode) {
        btn.innerText = "✅";
        btn.style.background = "#2e7d32";
        // Turn the name into an input field
        nameHeader.innerHTML = `<input type="text" id="nameInput" value="${userName}" style="color:black; font-size: 1.2rem; text-align: center; border-radius: 5px; border: none; padding: 5px;">`;
    } else {
        btn.innerText = "✏️";
        btn.style.background = "#1e88e5";

        // Save the new name
        const nameInput = document.getElementById("nameInput");
        if (nameInput) {
            userName = nameInput.value;
            localStorage.setItem("userName", userName);
            nameHeader.innerText = userName;
        }

        // Save the timetable
        localStorage.setItem("userTimetable", JSON.stringify(timetable));
    }
    renderTable();
}

function updateValue(day, index, field, value) {
    timetable[day][index][field] = value;
}

function changeDay(day, btn) {
    currentDay = day;
    document.querySelectorAll(".tabs button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderTable();
}

function renderTable() {
    const body = document.getElementById("timetableBody");
    body.innerHTML = "";

    timetable[currentDay].forEach((cls, index) => {
        const [start, end] = cls.time.split(" - ");

        if (isEditMode) {
            // Editable Row with Delete Button
            body.innerHTML += `
                <tr class="class-row">
                    <!-- TIME (clickable, opens modal) -->
                    <td
                        onclick="openTimePicker(${index}, '${cls.time}')"
                        style="cursor:pointer; font-weight:600; color:#1e88e5;"
                    >
                        ${cls.time}
                    </td>

                    <!-- WORK -->
<td
  class="editable-cell"
  onclick="openTextEditor('${currentDay}', ${index}, 'Work', '${cls.Work}')"
>
  ${cls.Work}
</td>

<!-- LOCATION -->
<td
  class="editable-cell editable-location"
  onclick="openTextEditor('${currentDay}', ${index}, 'location', '${cls.location}')"
>
  ${cls.location}
</td>



                    <!-- DELETE -->
                    <td>
                        <button
                            onclick="deleteRow(${index})"
                            style="background:none; border:none; color:red; cursor:pointer; font-size:1.2rem;"
                        >
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        } else {
            // Normal View
            body.innerHTML += `
                <tr class="class-row" data-start="${start}" data-end="${end}">
                    <td>${cls.time}</td>
                    <td>${cls.Work}</td>
                    <td>${cls.location}</td>
                </tr>
            `;
        }
    });

    // Add "+" button row at the bottom if in edit mode
    if (isEditMode) {
        body.innerHTML += `
            <tr>
                <td colspan="4">
                    <button onclick="addRow()" style="width:100%; padding:10px; background:#e8f0fe; border:2px dashed #1e88e5; color:#1e88e5; font-weight:bold; cursor:pointer; border-radius:8px;">
                        + Add New Row
                    </button>
                </td>
            </tr>
        `;
    }

    if (!isEditMode) {
        updateClassStates();
        updateStickyCurrentClass();
    }
}

// Function to add a blank row to the current day
function addRow() {
    const newEntry = { time: "00:00 - 00:00", Work: "New Task", notify: false, location: "Room" };
    timetable[currentDay].push(newEntry);
    renderTable(); // Refresh the table to show the new row
}

// Function to delete a specific row
function deleteRow(index) {
    if (confirm("Are you sure you want to delete this task?")) {
        timetable[currentDay].splice(index, 1);
        renderTable(); // Refresh the table
    }
}

// Keep all your original logic below exactly as it was
setInterval(() => {
    if (!isEditMode) {
        updateClassStates();
        updateStickyCurrentClass();
    }
}, 60000);

function setCurrentDay() {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = new Date().getDay();
    const todayName = days[today];
    const buttons = document.querySelectorAll(".tabs button");
    buttons.forEach(button => {
        if (button.innerText === todayName) {
            button.click();
        }
    });
}

function timeToMinutes(time) {
    if (!time) return 0;
    const [hours, minutes] = time.trim().split(":").map(Number);
    return hours * 60 + minutes;
}

function updateClassStates() {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    let nextClassMarked = false;

    document.querySelectorAll(".class-row").forEach(row => {
        row.classList.remove("past", "current", "next");
        const start = timeToMinutes(row.dataset.start);
        const end = timeToMinutes(row.dataset.end);

        if (currentMinutes >= end) {
            row.classList.add("past");
        } else if (currentMinutes >= start && currentMinutes <= end) {
            row.classList.add("current");
        } else if (!nextClassMarked && currentMinutes < start) {
            row.classList.add("next");
            nextClassMarked = true;
        }
    });
}

function updateStickyCurrentClass() {
    const bar = document.getElementById("currentClassBar");
    const text = document.getElementById("currentClassText");
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const rows = document.querySelectorAll("#timetableBody tr");
    let found = false;

    rows.forEach(row => {
        const timeCell = row.querySelector("td");
        if (!timeCell || isEditMode) return;

        const [start, end] = timeCell.innerText.split(" - ");
        const startMin = timeToMinutes(start);
        const endMin = timeToMinutes(end);

        if (currentMinutes >= startMin && currentMinutes <= endMin) {
            const cells = row.querySelectorAll("td");
            text.innerText = `${cells[0].innerText} • ${cells[1].innerText} • ${cells[2]?.innerText || ""}`;
            bar.classList.remove("hidden");
            found = true;
        }
    });

    if (!found) bar.classList.add("hidden");
}

window.addEventListener("load", () => {
    const overlay = document.getElementById("quoteOverlay");
    const typedEl = document.getElementById("quoteText");

    const quotes = ["Designed for Focus"];
    const quote = quotes[0];
    let index = 0;

    // 1. Function to trigger the fade out
    const dismissOverlay = () => {
        overlay.classList.add("fade-out");
        // Optional: Remove from DOM after animation so it doesn't interfere
        setTimeout(() => {
            overlay.style.display = "none";
        }, 500);
    };

    // 2. Add Click/Tap listener to vanish on click
    overlay.addEventListener("click", dismissOverlay);

    // 3. Typing logic
    function typeQuote() {
        if (typedEl && index < quote.length) {
            typedEl.textContent += quote.charAt(index);
            index++;
            setTimeout(typeQuote, 45);
        }
    }

    typedEl.textContent = "";
    setTimeout(typeQuote, 600);

    // 4. Keep the auto-vanish as a fallback (after 3 seconds)
    setTimeout(dismissOverlay, 1750);
});

let activeEditRowIndex = null;

function openTimePicker(index, time) {
    if (!isEditMode) return;

    activeEditRowIndex = index;

    const [start, end] = time.split(" - ");
    document.getElementById("startTime").value = start;
    document.getElementById("endTime").value = end;

    document.getElementById("timePickerOverlay").classList.remove("hidden");
}

function closeTimePicker() {
    document.getElementById("timePickerOverlay").classList.add("hidden");
}

function applyTime() {
    const start = document.getElementById("startTime").value;
    const end = document.getElementById("endTime").value;

    if (!start || !end) {
        alert("Please select both times");
        return;
    }

    if (end <= start) {
        alert("End time must be after start time");
        return;
    }

    timetable[currentDay][activeEditRowIndex].time = `${start} - ${end}`;
    renderTable();
    closeTimePicker();
}

function openNativePicker(wrapper) {
    const input = wrapper.querySelector("input[type='time']");
    if (!input) return;

    // Modern browsers (Chrome, Edge, Android)
    if (input.showPicker) {
        input.showPicker();
    } else {
        input.focus(); // fallback
    }
}

let activeTextEdit = {
    type: null,
    day: null,
    index: null,
    field: null
};

function openTextEditor(day, index, field, currentValue, type = "timetable") {
    if (!isEditMode) return;

    activeTextEdit = { type, day, index, field };

    const title =
        type === "name"
            ? "Edit Name"
            : field === "Work"
                ? "Edit Work"
                : "Edit Location";

    document.getElementById("textEditTitle").innerText = title;

    const input = document.getElementById("textEditInput");
    input.value = currentValue;
    input.focus();

    document.getElementById("textEditOverlay").classList.remove("hidden");
}


function applyTextEdit() {
    const value = document.getElementById("textEditInput").value.trim();
    if (!value) return;

    if (activeTextEdit.type === "name") {
        userName = value;
        localStorage.setItem("userName", userName);
        document.getElementById("userName").innerText = userName;
    } else {
        const { day, index, field } = activeTextEdit;
        timetable[day][index][field] = value;
        renderTable();
    }

    closeTextEditor();
}

function closeTextEditor() {
    const overlay = document.getElementById("textEditOverlay");
    overlay.classList.add("hidden");

    // 🔥 reset state (VERY IMPORTANT)
    activeTextEdit = {
        type: null,
        day: null,
        index: null,
        field: null
    };
}


