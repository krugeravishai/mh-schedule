import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getDatabase, ref, onChildAdded } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

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

import { get, remove } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";


const loadedMessageKeys = new Set();

// DOM reference for message bar
const messageBar = document.getElementById("message-bar");
export async function loadMessages() {
  const snapshot = await get(messagesRef);
  const now = new Date();

  if (!snapshot.exists()) return;

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

  snapshot.forEach(child => {
    const message = child.val();
    const key = child.key;

    const start = new Date(message.startTime);
    const end = new Date(message.endTime);

    if (end < now) {
      // Message expired, remove from database
      remove(ref(db, `messages/${key}`));
      return;
    }

    if (start <= now && now <= end) {
      const div = document.createElement("div");
      div.classList.add("message", "to-bar");

      const allowedGrades = Object.keys(gradeLabels);
      const gradeKey = allowedGrades.includes(message.grade) ? message.grade.toLowerCase() : "everyone";
      const gradeLabel = gradeLabels[gradeKey];

      div.classList.add(`grade-${gradeKey}`);
      div.innerHTML = `<strong>${gradeLabel}: </strong><br>${message.text}`;

      messageBar.appendChild(div);
      loadedMessageKeys.add(key);
    }
  });
}

function addNewMessage(key, message) {
  const now = new Date();
  const start = new Date(message.startTime);
  const end = new Date(message.endTime);

  if (end < now || start > now) return; // Ignore expired or future messages

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
  
  const allowedGrades = Object.keys(gradeLabels);
  const gradeKey = allowedGrades.includes(message.grade) ? message.grade.toLowerCase() : "everyone";
  const gradeLabel = gradeLabels[gradeKey];

  const finalDiv = document.createElement("div");
  finalDiv.classList.add("message", "to-bar", `grade-${gradeKey}`);
  finalDiv.innerHTML = `<div><strong>${gradeLabel}: </strong></div><div>${message.text}</div>`;

  if (!message.silent) {
    const fullDiv = finalDiv.cloneNode(true);
    fullDiv.classList.add("full-screen-message");
    document.body.appendChild(fullDiv);
  
    setTimeout(() => {
      document.body.removeChild(fullDiv);
      messageBar.appendChild(finalDiv);
    }, 6000); // 5s delay + 1s animation
  } else {
    messageBar.appendChild(finalDiv);
  }  
}


export async function deleteOldMessages() {
  const snapshot = await get(messagesRef);
  const now = new Date();

  if (!snapshot.exists()) return;

  snapshot.forEach(child => {
    const message = child.val();
    const key = child.key;
    const end = new Date(message.endTime);

    if (end < now) {
      remove(ref(db, `messages/${key}`));
      const divs = [...messageBar.querySelectorAll(".message")];
      divs.forEach(div => {
        if (div.innerHTML.includes(message.text)) {
          messageBar.removeChild(div);
        }
      });
    }
  });
}

loadMessages().then(() => {
    onChildAdded(messagesRef, snapshot => {
      const key = snapshot.key;
      const message = snapshot.val();
  
      if (!loadedMessageKeys.has(key)) {
        addNewMessage(key, message);
      }
    });
  });

// Delete old messages every minute
setInterval(deleteOldMessages, 60 * 1000);
