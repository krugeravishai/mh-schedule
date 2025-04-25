// Grade labels
const gradeLabels = {
  "1": "שיעור א",
  "2": "שיעור ב",
  "3": "שיעור ג",
  "4": "שיעור ד",
  "5": "שיעור ה",
  "6": "שיעור ו",
  "older": "בוגרים",
  "everyone": "כולם",

  "2-3":"שיעור ב-ג",
  "4-5":"שיעור ד-ה"
};

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBVk4Y4CW3pB-3_bbuE8rDHXopUnZuFmSw",
  authDomain: "schedule-mh.firebaseapp.com",
  projectId: "schedule-mh",
  storageBucket: "schedule-mh.appspot.com",
  messagingSenderId: "950949574717",
  appId: "1:950949574717:web:6cc6dfe51ef405e3cf5254"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getDatabase(app);
const messagesRef = ref(db, "messages");

function pad(n) {
  return n.toString().padStart(2, '0');
}

function getLocalDatetimeString(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseLocalDatetime(inputValue) {
  const [datePart, timePart] = inputValue.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

document.addEventListener("DOMContentLoaded", () => {
  const now = new Date();
  const defaultStart = getLocalDatetimeString(now);
  const defaultEnd = getLocalDatetimeString(new Date(now.getTime() + 3600000)); //add number of milliseconds to be the default end time

  document.getElementById("startTime").value = defaultStart;
  document.getElementById("endTime").value = defaultEnd;

  const silentToggle = document.getElementById("silentToggle");
  const silentInput = document.getElementById("silent");

  silentToggle.addEventListener("click", () => {
    const silent = silentInput.value === "true";
    silentInput.value = (!silent).toString();
    silentToggle.textContent = silent ? "לא שקט" : "שקט";
    silentToggle.style.backgroundColor = silent ? "#ccc" : "#4caf50";
  });

  document.getElementById("sendButton").addEventListener("click", async () => {
    const text = document.getElementById("text").value.trim();
    const grade = document.getElementById("grade").value;
    const startInput = document.getElementById("startTime").value;
    const endInput = document.getElementById("endTime").value;
    const silent = document.getElementById("silent").value === "true";

    if (!text || !startInput || !endInput) {
      showToast("אנא מלא את הכל לפני השליחה");
      return;
    }

    const startTime = parseLocalDatetime(startInput);
    const endTime = parseLocalDatetime(endInput);

    await push(messagesRef, {
      text,
      grade,
      silent,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    });

    showToast("הודעה נשלחה!");
    document.getElementById("text").value = "";
  });
});

import { get, remove } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";


function createGridMessage(message, key) {
  const gradeLabel = gradeLabels[message.grade] || "כולם";
  const gradeClass = `grade-${message.grade || "everyone"}`;

  const div = document.createElement("div");
  div.classList.add("message", gradeClass); // Apply color via CSS class

  div.innerHTML = `
    <div class="message-buttons">
      <button onclick="editMessage('${key}')">
        <img src="icons/pencil.svg" alt="Edit" style="width:16px; height:16px;">
      </button>

      <button onclick="deleteMessage('${key}', this.parentElement.parentElement)">
        <img src="icons/trash.svg" alt="Delete" style="width:16px; height:16px;">
      </button>
    </div>
    <div class="message-grade">${gradeLabel}:</div>
    <div class="message-text">${message.text}</div>
  `;
  return div;
}


const displayedMessages = new Map();

async function scanAndUpdateMessages() {
  const snapshot = await get(messagesRef);
  const now = new Date();
  const existingKeys = new Set();

  if (snapshot.exists()) {
    snapshot.forEach(child => {
      const key = child.key;
      const message = child.val();
      const start = new Date(message.startTime);
      const end = new Date(message.endTime);

      if (end < now) {
        if (displayedMessages.has(key)) {
          displayedMessages.get(key).remove();
          displayedMessages.delete(key);
        }
        return;
      }

      if (start <= now && now <= end) {
        existingKeys.add(key);
        const existing = displayedMessages.get(key);
        const newHtml = createGridMessage(message, key).innerHTML;

        if (!existing) {
          const newDiv = createGridMessage(message, key);
          document.getElementById("messageGrid").appendChild(newDiv);
          displayedMessages.set(key, newDiv);
        } else if (existing.innerHTML !== newHtml) {
          const updatedDiv = createGridMessage(message, key);
          document.getElementById("messageGrid").replaceChild(updatedDiv, existing);
          displayedMessages.set(key, updatedDiv);
        }
      }
    });
  }

  // Remove messages no longer in the snapshot
  for (const [key, div] of displayedMessages) {
    if (!existingKeys.has(key)) {
      div.remove();
      displayedMessages.delete(key);
    }
  }
}

window.deleteMessage = async (key, div) => {
  // Remove the message from Firebase
  await remove(ref(db, `messages/${key}`));

  // Remove the message element from the DOM
  div.remove();
};

window.editMessage = async (key) => {
  const snapshot = await get(ref(db, `messages/${key}`));
  if (!snapshot.exists()) return;

  const msg = snapshot.val();

  // Remove the message from Firebase first
  await remove(ref(db, `messages/${key}`));

  // Populate the form with the existing message details
  document.getElementById("text").value = msg.text;
  document.getElementById("grade").value = msg.grade;
  document.getElementById("startTime").value = getLocalDatetimeString(new Date(msg.startTime));
  document.getElementById("endTime").value = getLocalDatetimeString(new Date(msg.endTime));

  //When editing the default should be that it is silent since its just fixing something and shouldnt alert everyone
  document.getElementById("silent").value = "true";
  document.getElementById("silentToggle").textContent = "שקט";
  document.getElementById("silentToggle").style.backgroundColor = "#4caf50";

  // Scroll to the top of the page to make it easier to edit the message
  window.scrollTo(0, 0);
};

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.opacity = "1";

  setTimeout(() => {
    toast.style.opacity = "0";
  }, 2000);
}


setInterval(scanAndUpdateMessages, 1000);
