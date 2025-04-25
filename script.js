let totalImages = 82;



//updating the text at the top of the screen
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

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
const topTextRef = ref(db, "topText");
onValue(topTextRef, snapshot => {
if (true) {
    document.getElementById("top-text").textContent = snapshot.val();
}
});


// Function to update the clock
function updateClock() {
    const clockElement = document.getElementById("clock");
    if (!clockElement) return;

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
// Get Hebrew Date
let hebrewDate = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
    day: 'numeric',
    month: 'long'
}).format(now);

// Remove the "ב" prefix before the month name
hebrewDate = hebrewDate.replace('ב', '');

// Get Hebrew Day
const hebrewDay = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
    weekday: 'long'
}).format(now);

// Convert numbers in Hebrew date to Gematria with proper punctuation
function toGematria(num) {
    const letters = ["", "א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ז׳", "ח׳", "ט׳", 
                     "י׳", 'י"א', 'י"ב', 'י"ג', 'י"ד', 'ט"ו', 'ט"ז', 'י"ז', 'י"ח', 'י"ט', 
                     "כ׳", 'כ"א', 'כ"ב', 'כ"ג', 'כ"ד', 'כ"ה', 'כ"ו', 'כ"ז', 'כ"ח', 'כ"ט', 
                     "ל׳", 'ל"א']; // Using Hebrew punctuation conventions
    return num <= 32 ? letters[num] : num;
}

const gematriaHebrewDate = hebrewDate.replace(/,/g, "").replace(/(\d+)/g, match => toGematria(parseInt(match, 10)));

// Update clock display
clockElement.innerHTML = `${gematriaHebrewDate} - ${hours}:${minutes}:${seconds} - ${hebrewDay}`;
}

setInterval(updateClock, 1000);
updateClock(); // Run immediately



let imageIndex = Math.floor(Math.random() * totalImages) + 1;
let currentLayer = 1;

function preloadAndUpdateBackground() {
    const nextImage = new Image();
    const imageUrl = `images/background (${imageIndex}).jpg`;
    nextImage.src = imageUrl;

    nextImage.onload = () => {
        const nextLayer = currentLayer === 1 ? 2 : 1;
        const currentDiv = document.getElementById(`bg${currentLayer}`);
        const nextDiv = document.getElementById(`bg${nextLayer}`);

        nextDiv.style.backgroundImage = `url('${imageUrl}')`;
        nextDiv.style.zIndex = '-1';
        currentDiv.style.zIndex = '-2';

        currentLayer = nextLayer;
        imageIndex = (imageIndex % totalImages) + 1;
    };
}

preloadAndUpdateBackground();
setInterval(preloadAndUpdateBackground, 10000);


// Function to read the schedule from JSON
async function readSchedule() {
    try {
        const response = await fetch("schedule.json");
        const data = await response.json();

        if (!Array.isArray(data.grades)) {
            console.error("Grades not found or not an array:", data.grades);
            return { headers: [], filteredSchedule: [] }; // ✅ Always return a valid structure
        }

        const grades = data.grades;
        if (grades.length === 0) {
            console.error("No grades found in the schedule.");
            return { headers: [], filteredSchedule: [] };
        }

        // Days of the week in Hebrew
        const daysOfWeek = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
        const todayIndex = new Date().getDay();
        const today = daysOfWeek[todayIndex];

        if (!data[today]) {
            console.error("No schedule found for today.");
            return { headers: [], filteredSchedule: [] };
        }

        const headers = ["שעה", ...grades];
        const schedule = data[today];

        if (!Array.isArray(schedule) || schedule.length === 0) {
            console.error("Today's schedule is missing or invalid.");
            return { headers, filteredSchedule: [] };
        }

        let filteredSchedule = [];
        schedule.forEach(({ "שעה": time, ...classes }) => {
            const classData = [time, ...grades.map(grade => classes[grade] || "")];
            filteredSchedule.push(classData);
        });

        return { headers, filteredSchedule };  // Always returning a valid object
    } catch (error) {
        console.error("Error reading schedule:", error);
        return { headers: [], filteredSchedule: [] }; //Prevents crashes
    }
}

let lastCurrentPeriod = null;  // Track the last current period for comparison
let lastScheduleDay = new Date().getDay(); //Track the last day to compare and update day if needed
// Function to load the schedule initially
async function loadSchedule() {
    const { headers, filteredSchedule } = await readSchedule();

    if (filteredSchedule.length === 0) {
        console.log("No schedule data to display.");
        return;
    }

    const scheduleHeaders = document.getElementById("schedule-headers");
    scheduleHeaders.innerHTML = ""; // Clear existing headers

    // Reverse the order of headers for RTL layout
    headers.reverse().forEach(headerText => {
        const header = document.createElement("div");
        header.textContent = headerText;
        header.style.textAlign = "center";
        scheduleHeaders.appendChild(header);
    });

    const scheduleRows = document.getElementById("schedule-rows");
    scheduleRows.innerHTML = ""; // Clear previous rows

    filteredSchedule.forEach((row, rowIndex) => {
        // Check if all classes are identical (except the time)
        const firstClass = row.slice(1).every(cell => cell === row[1]);

        const rowElement = document.createElement("div");
        rowElement.classList.add("schedule-row");

        if (firstClass) {
            // If all classes are the same:
            // 1. Keep the time cell in the far right column
            // 2. Center the class cell across the remaining columns
            // Create a single centered class cell across the rest of the columns
            const classCell = document.createElement("div");
            classCell.textContent = row[1]; // The class name (all cells are the same)

            //rowElement.style.boxShadow = "inset 0 -10px 10px -5px rgba(255, 255, 255, 0.2)";

            classCell.style.textAlign = "center";
            classCell.style.gridColumn = `1 / span ${row.length - 1}`; // Span across remaining columns
            rowElement.appendChild(classCell);

            const timeCell = document.createElement("div");
            timeCell.textContent = row[0];
            timeCell.style.textAlign = "center";
            timeCell.style.gridColumn = `${row.length}`; // Move the time cell to the last column
            rowElement.appendChild(timeCell);
        } else {
            // If classes are different, add each class as usual, but reverse the content for RTL
            row.reverse().forEach((cellText, cellIndex) => {
                const cell = document.createElement("div");
                cell.textContent = cellText;
                cell.style.textAlign = "center";

                // Add border to middle cells between classes of different grades
                if (cellIndex > 0 && cellIndex < row.length - 1) {
                    cell.style.borderLeft = "3px solid rgba(255,255,255,0.25)";
                }
                cell.style.padding = "0 4px";

                rowElement.appendChild(cell);
            });
        }

        // Add a unique ID to each row for tracking
        rowElement.id = `row-${rowIndex}`;

        scheduleRows.appendChild(rowElement);
    });

    const fakeRow = document.createElement("div");
    fakeRow.classList.add("fake-row");
    document.getElementById("schedule-rows").appendChild(fakeRow);
}



// Function to update the current class and scroll to it
async function updateSchedule() {
    const { filteredSchedule } = await readSchedule();
    if (filteredSchedule.length === 0) return;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    let newCurrentIndex = -1;

    // Find the current period
    for (let i = 0; i < filteredSchedule.length; i++) {
        const periodTime = filteredSchedule[i][0];
        const [hour, minutes] = periodTime.split(":").map(Number);
        const periodMinutes = hour * 60 + minutes;

        if (periodMinutes <= currentTime) {
            newCurrentIndex = i;
        }
    }

    // If there's no change in the current class, exit
    if (newCurrentIndex === -1 || newCurrentIndex === lastCurrentPeriod) return;

    const scheduleRows = document.getElementById("schedule-rows").children;

    // Transition the old current class to normal
    if (lastCurrentPeriod !== null && scheduleRows[lastCurrentPeriod]) {
        scheduleRows[lastCurrentPeriod].classList.remove("current-class");
        scheduleRows[lastCurrentPeriod].classList.add("normal-class");
    }

    // Apply the current class to the new current period
    if (scheduleRows[newCurrentIndex]) {
        scheduleRows[newCurrentIndex].classList.remove("normal-class");

        // Delay applying the new "current-class" to allow previous transition to complete
        setTimeout(() => {
            scheduleRows[newCurrentIndex].classList.add("current-class");

            setTimeout(() => {
                // Scroll the new current class into view
                const scheduleContainer = document.getElementById("schedule-container");
                const newCurrentElement = scheduleRows[newCurrentIndex];

                scheduleContainer.scrollTo({
                    top: newCurrentElement.offsetTop - scheduleContainer.offsetTop,
                    behavior: "smooth"
                });

                lastCurrentPeriod = newCurrentIndex;
            }, 1500);
        }, 1500); // Delay matches CSS transition time (1.5s)

    }
}

loadSchedule();

setInterval(async () => {
    const now = new Date();
    const currentDay = now.getDay();

    if (currentDay !== lastScheduleDay) {
        lastScheduleDay = currentDay;
        await loadSchedule(); // Reload schedule for the new day
    
        // Scroll to the top after loading the new schedule
        const scheduleContainer = document.getElementById("schedule-container");
        scheduleContainer.scrollTo({ top: 0, behavior: "smooth" });
    }    

    updateSchedule();
}, 1000);
