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
  const defaultEnd = getLocalDatetimeString(new Date(now.getTime() + 60000));

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
      alert("אנא מלא את כל השדות");
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

    alert("הודעה נשלחה!");
    document.getElementById("text").value = "";
  });
});