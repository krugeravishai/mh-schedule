import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  remove
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBVk4Y4CW3pB-3_bbuE8rDHXopUnZuFmSw",
  authDomain: "schedule-mh.firebaseapp.com",
  projectId: "schedule-mh",
  storageBucket: "schedule-mh.appspot.com",
  messagingSenderId: "950949574717",
  appId: "1:950949574717:web:6cc6dfe51ef405e3cf5254"
};

// Initialize Firebase
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getDatabase(app);
const messagesRef = ref(db, "messages");

// DOM references
const messageBar = document.getElementById("message-bar");

// Local state
const displayedMessages = new Map(); // key -> div
const shownFullScreenMessages = new Set(); // to prevent duplicates

// Grade labels
const gradeLabels = {
  "1": "שיעור א",
  "2": "שיעור ב",
  "3": "שיעור ג",
  "4": "שיעור ד",
  "5": "שיעור ה",
  "6": "שיעור ו",
  "older": "בוגרים",
  "everyone": "כולם"
};

// Create message element
function createMessageElement(message, key) {
  const gradeKey = gradeLabels.hasOwnProperty(message.grade) ? message.grade : "everyone";
  const gradeLabel = gradeLabels[gradeKey];

  const div = document.createElement("div");
  div.classList.add("message", "to-bar", `grade-${gradeKey}`);
  div.innerHTML = `<div><strong>${gradeLabel}:</strong></div><div>${message.text}</div>`;
  return div;
}

// Fullscreen animation
function showFullScreenMessage(div, key) {
  if (shownFullScreenMessages.has(key)) return;
  shownFullScreenMessages.add(key);

  const fullDiv = div.cloneNode(true);
  fullDiv.classList.add("full-screen-message");
  document.body.appendChild(fullDiv);

  setTimeout(() => {
    document.body.removeChild(fullDiv);
    messageBar.appendChild(div);
    displayedMessages.set(key, div);
  }, 6000);
}

// Periodic scan
async function scanMessages() {
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
        // Expired — remove from DB and from DOM
        remove(ref(db, `messages/${key}`));
        if (displayedMessages.has(key)) {
          const div = displayedMessages.get(key);
          div.remove();
          displayedMessages.delete(key);
        }
        return;
      }

      if (start <= now && now <= end) {
        existingKeys.add(key);

        const existing = displayedMessages.get(key);
        const newHtml = createMessageElement(message, key).innerHTML;

        if (!existing) {
          const newDiv = createMessageElement(message, key);
          if (!message.silent) {
            showFullScreenMessage(newDiv, key);
          } else {
            messageBar.appendChild(newDiv);
            displayedMessages.set(key, newDiv);
          }
        } else if (existing.innerHTML !== newHtml) {
          // Message was edited
          const updatedDiv = createMessageElement(message, key);
          messageBar.replaceChild(updatedDiv, existing);
          displayedMessages.set(key, updatedDiv);
        }
      }
    });
  }

  // Clean up removed messages
  for (const [key, div] of displayedMessages) {
    if (!existingKeys.has(key)) {
      div.remove();
      displayedMessages.delete(key);
    }
  }
}

// Initial load and start polling
scanMessages();
setInterval(scanMessages, 1000);
