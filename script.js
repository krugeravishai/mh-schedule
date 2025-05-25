let totalImages = 99;
let imageTime = 15000; //how many seconds the image displays in millisecond


const latitude = 31.914352288683233;   // Place latitude
const longitude = 34.99863056272468;  // Place longitude


let currentPeriod;
let now = new Date();
//now.setHours(5);

let sunTimes = SunCalc.getTimes(now, latitude, longitude);
console.log("The current date is: " + now);
console.log("Sunset is at: " + sunTimes.sunset);
console.log("Sunrise is at:" + sunTimes.sunrise);

//updating the text at the top of the screen
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getDatabase, ref, onValue, get, set } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

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

setInterval(async () => {
    sunTimes = SunCalc.getTimes(now, latitude, longitude);
    console.log("The current date is: " + now);
    console.log("Sunset is at: " + sunTimes.sunset);
    console.log("Sunrise is at:" + sunTimes.sunrise);
}, 1000 * 60 * 60 * 24); //every day update the new sun times

// const REAL_START = Date.now(); // real time when simulation starts
// const SIM_START = new Date();  // virtual time starts at current real time

// const SPEED = 80000; // 1 real second = 12 virtual minutes → 24 hours in 2 minutes

// function getSimulatedTime() {
//     const elapsed = Date.now() - REAL_START; // milliseconds
//     return new Date(SIM_START.getTime() + elapsed * SPEED);
// }


// Function to update the clock
function updateClock() {
    const clockElement = document.getElementById("clock");
    if (!clockElement) return;

    // Format Hebrew date
    const hebrewDateFormatter = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
        day: 'numeric',
        month: 'long'
    });
    const hebrewDayFormatter = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
        weekday: 'long'
    });

    now = new Date();

    let hebrewDate = hebrewDateFormatter.format(now).replace(' ב', ' ');
    const hebrewDay = hebrewDayFormatter.format(now);

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const sunriseMinutes = sunTimes.sunrise.getHours() * 60 + sunTimes.sunrise.getMinutes();
    const sunsetMinutes = sunTimes.sunset.getHours() * 60 + sunTimes.sunset.getMinutes();

    if (nowMinutes > sunsetMinutes) {
        console.log("אור ל");
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        hebrewDate = hebrewDateFormatter.format(tomorrow).replace(' ב', ' ');
        hebrewDate = `אור ל${hebrewDate}`;
    } else if (nowMinutes < sunriseMinutes) {
        hebrewDate = `אור ל${hebrewDate}`;
    }

    // Optional: Convert numbers to Hebrew gematria
    function toGematria(num) {
        const letters =
            ["", "א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ז׳", "ח׳", "ט׳",
             "י׳", 'י"א', 'י"ב', 'י"ג', 'י"ד', 'ט"ו', 'ט"ז', 'י"ז', 'י"ח', 'י"ט',
             "כ׳", 'כ"א', 'כ"ב', 'כ"ג', 'כ"ד', 'כ"ה', 'כ"ו', 'כ"ז', 'כ"ח', 'כ"ט',
             "ל׳", 'ל"א'];
        return num <= 32 ? letters[num] : num;
    }

    hebrewDate = hebrewDate.replace(/(\d+)/g, match => toGematria(parseInt(match)));


    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    //clockElement.innerHTML = `${hebrewDate} - ${hours}:${minutes} - ${hebrewDay}`;

    const gematriaHebrewDate = hebrewDate.replace(/,/g, "").replace(/(\d+)/g, match => toGematria(parseInt(match, 10)));

    if(now.getSeconds() === 0 && now.getMinutes() === 0){
        console.log(hebrewDay+": "+ gematriaHebrewDate); //printing every hour the day and date to see if works right 
    }

    // Update clock display
    clockElement.innerHTML = `${gematriaHebrewDate} - ${hours}:${minutes} - ${hebrewDay}`; //:${seconds}
}

setInterval(updateClock, 1000);
updateClock(); // Run immediately



let imageIndex = Math.floor(Math.random() * totalImages) + 1;
let currentLayer = 1;

function preloadAndUpdateBackground() {
    const currentRow = document.querySelector(".current-class");
    currentPeriod = currentRow?.textContent?.trim().replace(/[0-9:]/g, '');
    //console.log("Current Period: " + currentPeriod);

    if (["תפילת שחרית", "תפילת מוסף","תפילת מנחה", "תפילת ערבית", "תפילת מעריב","שחרית", "מוסף", "מנחה", "ערבית", "מעריב"].includes(currentPeriod)) 
    {
        //console.log("During prayer: Wont distract with new images.");
        return; //during prayer times dont distract with images switching
    }

    //console.log("Not during prayer: Will update images.");
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
setInterval(preloadAndUpdateBackground, imageTime);


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

    for (const [rowIndex, row] of filteredSchedule.entries()) {
        // showing the gmara page for the seder erev
        const isSederErev = row[1].includes("סדר ערב");
        const firstClass = row.slice(1).every(cell => cell === row[1]);
        
        if (isSederErev) {
            const pageRef = ref(db, "sederErev");
            let currentPage;
            onValue(pageRef, snapshot => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const today = new Date().toISOString().slice(0, 10);
                    currentPage = data.page;
        
                    if (data.lastUpdated !== today) {
                        const newPage = nextPage(data.page);
                        set(pageRef, { page: newPage, lastUpdated: today });
                        currentPage = newPage;
                        console.log("Updated the page in firebase to: " + currentPage);
                    }
                    console.log("Loading page: " + currentPage);
        
                    const rowElem = document.getElementById(`row-${rowIndex}`);
                    if (rowElem) {
                        rowElem.innerHTML = `
                            <div style="grid-column: 1 / span ${row.length - 1}; text-align: center;">
                                <span dir="rtl">סדר ערב - ${currentPage}</span>
                            </div>
                            <div style="grid-column: ${row.length}; text-align: center;">
                                ${row[0]}
                            </div>`;
                    }
                }
            }, { onlyOnce: false }); // Keep listening
            console.log("Loaded page: " + currentPage);
            //todo maybe add a reoccuring loop that if it didnt manage to load it keeps trying till it manages
        }

        const rowElement = document.createElement("div");
        rowElement.classList.add("schedule-row");

        if (firstClass) { //if everyone has the same class
            // If all classes are the same:
            // 1. Keep the time cell in the far right column
            // 2. Center the class cell across the remaining columns
            // Create a single centered class cell across the rest of the columns
            const classCell = document.createElement("div");
            classCell.innerHTML = row[1]; // The class name (all cells are the same)

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
    };

    const fakeRow = document.createElement("div");
    fakeRow.classList.add("fake-row");
    document.getElementById("schedule-rows").appendChild(fakeRow);
}

function nextPage(current) { //takes the current gmara page and adds one עמוד and then returns it
    const hebrewLetters = [
        "א","ב","ג","ד","ה","ו","ז","ח","ט","י","יא","יב","יג","יד","טו","טז",
        "יז","יח","יט","כ","כא","כב","כג","כד","כה","כו","כז","כח","כט","ל","לא",
        "לב","לג","לד","לה","לו","לז","לח","לט","מ","מא","מב","מג","מד","מה","מו",
        "מז","מח","מט","נ","נא","נב","נג","נד","נה","נו","נז","נח","נט","ס","סא","סב",
        "סג","סד","סה","סו","סז","סח","סט","ע","עא","עב","עג","עד","עה","עו","עז",
        "עח","עט","פ","פא","פב","פג","פד","פה","פו","פז","פח","פט","צ","צא","צב",
        "צג","צד","צה","צו","צז","צח","צט","ק","קא","קב","קג","קד","קה","קו","קז",
        "קח","קט","קי","קיא","קיב","קיג","קיד","קטו","קטז","קיז","קיח","קיט","קכ",
        "קכא","קכב","קכג","קכד","קכה","קכו","קכז","קכח","קכט","קל","קלא","קלב","קלג",
        "קלד","קלה","קלו","קלז","קלח","קלט","קמ","קמא","קמב","קמג","קמד","קמה","קמו",
        "קמז","קמח","קמט","קנ","קנא","קנב","קנג","קנד","קנה","קנו","קנז","קנח","קנט",
        "קס","קסא","קסב","קסג","קסד","קסה","קסו","קסז","קסח","קסט","קע","קעא","קעב",
        "קעג","קעד", "קעה", "קעו","קעז", "קעח","קעט","קפ"
    ];

    const match = current.match(/^([\u0590-\u05FF]+)([.:])$/); // match letter + symbol
    if (!match) return current;

    const [_, base, symbol] = match;
    const index = hebrewLetters.indexOf(base);
    if (index === -1) return current;

    // Alternate between . and :
    if (symbol === ".") {
        return `${base}:`;
    } else {
        if (index + 1 < hebrewLetters.length) {
            return `${hebrewLetters[index + 1]}.`;
        } else {
            return current; // End of list
        }
    }
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
