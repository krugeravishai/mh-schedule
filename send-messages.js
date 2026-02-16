/*
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
*/

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
    const text = document.getElementById("messageText").value.trim();
    //const grade = document.getElementById("grade").value; i removed this feature
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
      //grade,
      silent,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    });

    showToast("הודעה נשלחה!");
    document.getElementById("messageText").value = "";
  });
});

import { get, set, remove } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";


function createGridMessage(message, key) {
  // const gradeLabel = gradeLabels[message.grade] || "כולם";
  // const gradeClass = `grade-${message.grade || "everyone"}`;

  const div = document.createElement("div");
  div.classList.add("message"); // Apply color via CSS class

  div.innerHTML = `
    <div class="message-buttons">
      <button onclick="editMessage('${key}')">
        <img src="icons/pencil.svg" alt="Edit" style="width:16px; height:16px;">
      </button>

      <button onclick="deleteMessage('${key}', this.parentElement.parentElement)">
        <img src="icons/trash.svg" alt="Delete" style="width:16px; height:16px;">
      </button>
    </div>
    <div class="message-text">${message.text}</div>
  `; //note that i removed this line, above the text: <div class="message-grade">${gradeLabel}:</div>
  return div;
}


const currentGrid = document.getElementById("currentMessageGrid");
const futureGrid = document.getElementById("futureMessageGrid");
const currentSection = document.getElementById("currentSection");
const futureSection = document.getElementById("futureSection");

const displayedCurrent = new Map();
const displayedFuture = new Map();

async function scanAndUpdateMessages() {
  const snapshot = await get(messagesRef);
  const now = new Date();

  const currentKeys = new Set();
  const futureKeys = new Set();

  if (snapshot.exists()) {
    snapshot.forEach(child => {
      const key = child.key;
      const message = child.val();
      const start = new Date(message.startTime);
      const end = new Date(message.endTime);

      // Remove expired
      if (end < now) {
        if (displayedCurrent.has(key)) {
          displayedCurrent.get(key).remove();
          displayedCurrent.delete(key);
        }
        if (displayedFuture.has(key)) {
          displayedFuture.get(key).remove();
          displayedFuture.delete(key);
        }
        return;
      }

      // CURRENT
      if (start <= now && now <= end) {
        currentKeys.add(key);

        if (!displayedCurrent.has(key)) {
          const div = createGridMessage(message, key);
          currentGrid.appendChild(div);
          displayedCurrent.set(key, div);
        }

        // Remove from future if it moved
        if (displayedFuture.has(key)) {
          displayedFuture.get(key).remove();
          displayedFuture.delete(key);
        }
      }

      // FUTURE
      else if (start > now) {
        futureKeys.add(key);

        if (!displayedFuture.has(key)) {
          const div = createGridMessage(message, key);

          const startLabel = document.createElement("div");
          startLabel.style.fontSize = "14px";
          startLabel.style.marginBottom = "4px";
          startLabel.textContent =
            "מתחיל ב: " +
            start.toLocaleString("he-IL", {
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "2-digit"
            });

          div.insertBefore(startLabel, div.querySelector(".message-text"));

          futureGrid.appendChild(div);
          displayedFuture.set(key, div);
        }
      }
    });
  }

  // Cleanup removed ones
  for (const [key, div] of displayedCurrent) {
    if (!currentKeys.has(key)) {
      div.remove();
      displayedCurrent.delete(key);
    }
  }

  for (const [key, div] of displayedFuture) {
    if (!futureKeys.has(key)) {
      div.remove();
      displayedFuture.delete(key);
    }
  }

  // Show/hide sections depending on content
  currentSection.style.display = displayedCurrent.size > 0 ? "block" : "none";
  futureSection.style.display = displayedFuture.size > 0 ? "block" : "none";

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
  document.getElementById("messageText").value = msg.text;
  //document.getElementById("grade").value = msg.grade;
  document.getElementById("startTime").value = getLocalDatetimeString(new Date(msg.startTime));
  document.getElementById("endTime").value = getLocalDatetimeString(new Date(msg.endTime));

  //When editing the default should be that it is silent since its just fixing something and shouldnt alert everyone
  document.getElementById("silent").value = "true";
  document.getElementById("silentToggle").textContent = "שקט";
  document.getElementById("silentToggle").style.backgroundColor = "#4caf50";

  // Scroll to the top of the page to make it easier to edit the message
  window.scrollTo(0, 0);
};

//when the logo is pressed it will make a change to "refresh" in the database, then the main screen knows to refresh.
document.getElementById("logo").addEventListener('click', function () {
  const refreshRef = ref(db, "refresh");
  get(refreshRef).then(snapshot => {
    set(refreshRef, (snapshot.val() || "") + " ");
  });
}
)

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.style.opacity = "1";

  setTimeout(() => {
    toast.style.opacity = "0";
  }, 2000);
}


setInterval(scanAndUpdateMessages, 1000);
