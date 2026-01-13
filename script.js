//the following variables need to be changed to choice (e.g. imagesTime) or for the specific system (different firebase, google drive etc.)
let imageTime = 15000; //how many seconds the image displays in millisecond
const folderId = "1LPDVaexjakO6mpB_wnZuu9P4_1FLxgiR"
const apiKey = "AIzaSyAuEVR8iXJLnjPiclteqgCLmTMk1enF7JQ";
const latitude = 31.914352288683233;   // Place latitude for sun times calculation
const longitude = 34.99863056272468;  // Place longitude for sun times calculation
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getDatabase, ref, onValue, get, set } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
import { runTransaction } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBVk4Y4CW3pB-3_bbuE8rDHXopUnZuFmSw",
  authDomain: "schedule-mh.firebaseapp.com",
  projectId: "schedule-mh",
  storageBucket: "schedule-mh.appspot.com",
  messagingSenderId: "950949574717",
  appId: "1:950949574717:web:6cc6dfe51ef405e3cf5254"
};

let headers = [];
let filteredSchedule = [];
let currentPeriod;
let now = new Date();
//now.setHours(5);

let sunTimes = SunCalc.getTimes(now, latitude, longitude);
console.log("The current date is: " + now);

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getDatabase(app);
const topTextRef = ref(db, "topText");
const refreshRef = ref(db, "refresh");
onValue(topTextRef, snapshot => {
    if (true) {
        document.getElementById("top-text").textContent = snapshot.val();
    }
});

//this code will listen to see if the website needs to reload but wont do it on the first time 
let startRefreshing = false;
onValue(refreshRef, snapshot => {
    if (startRefreshing) {
        location.reload();
    }
    startRefreshing = true;
});

setInterval(async () => {
    sunTimes = SunCalc.getTimes(now, latitude, longitude);
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

    let hebrewDate = hebrewDateFormatter.format(now).replace(' ב', ' ');
    const hebrewDay = hebrewDayFormatter.format(now);

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const sunriseMinutes = sunTimes.sunrise.getHours() * 60 + sunTimes.sunrise.getMinutes();
    const sunsetMinutes = sunTimes.sunset.getHours() * 60 + sunTimes.sunset.getMinutes();

    if (nowMinutes > sunsetMinutes) {
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

    /*
    if(now.getSeconds() === 0 && now.getMinutes() === 0){
        console.log(hebrewDay+": "+ gematriaHebrewDate); //printing every hour the day and date to see if works right 
    }
    */

    // Update clock display
    clockElement.innerHTML = `${gematriaHebrewDate} - ${hours}:${minutes} - ${hebrewDay}`; //:${seconds}
}
setInterval(updateClock, 1000);
updateClock(); // Run immediately

async function listDriveImages() {
    let allFiles = [];
    let pageToken = null;

    try {
        do {
            const url =
                `https://www.googleapis.com/drive/v3/files` +
                `?q='${folderId}'+in+parents+and+mimeType+contains+'image/'` +
                `&fields=nextPageToken,files(id,name,mimeType)` +
                `&pageSize=1000` +
                (pageToken ? `&pageToken=${pageToken}` : ``) +
                `&key=${apiKey}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.files) {
                allFiles.push(...data.files);
            }

            pageToken = data.nextPageToken || null;

        } while (pageToken);

        return allFiles.map(f =>
            `https://lh3.googleusercontent.com/d/${f.id}=w2000`
        );

    } catch (err) {
        console.error("Drive image load error:", err);
        return [];
    }
}


let driveImages = [];
let imageIndex = 0;
let currentLayer = 1;
async function initBackgroundImages() {
    driveImages = await listDriveImages();

    if (!driveImages.length) {
        console.error("No images found in Drive!");
        return;
    }

    // random starting point
    imageIndex = Math.floor(Math.random() * driveImages.length);
    preloadAndUpdateBackground(); 
    setInterval(preloadAndUpdateBackground, imageTime);
}

function preloadAndUpdateBackground() {
    const currentRow = document.querySelector(".current-class");
    currentPeriod = currentRow?.textContent?.trim().replace(/[0-9:]/g, '');

    if ([
        "תפילת שחרית", "תפילת מוסף","תפילת מנחה",
        "תפילת ערבית", "תפילת מעריב",
        "שחרית", "מוסף", "מנחה", "ערבית", "מעריב"
    ].includes(currentPeriod)) {
        return; // do not switch images during prayer
    }

    if (!driveImages.length) return;

    const nextImage = new Image();
    const imageUrl = driveImages[imageIndex];
    nextImage.src = imageUrl;

    nextImage.onload = () => {
        const nextLayer = currentLayer === 1 ? 2 : 1;
        const currentDiv = document.getElementById(`bg${currentLayer}`);
        const nextDiv = document.getElementById(`bg${nextLayer}`);

        nextDiv.style.backgroundImage = `url('${imageUrl}')`;
        nextDiv.style.zIndex = '-1';
        currentDiv.style.zIndex = '-2';

        currentLayer = nextLayer;

        // advance index in a loop
        imageIndex = (imageIndex + 1) % driveImages.length;
    };
}
initBackgroundImages();


// Function to read the schedule from JSON
async function readSchedule() {
    if (headers.length>0 && filteredSchedule.length>0){ //if the schedule was already read then return the previous read
        return { headers, filteredSchedule };
    }
    const daysOfWeek = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    const todayIndex = now.getDay();
    const weekday = daysOfWeek[todayIndex];
    const dateKey = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

    const scheduleRef = ref(db, "schedules/" + dateKey);
    try {
        const snapshot = await get(scheduleRef);
        let data;

        if (snapshot.exists()) {
            data = snapshot.val(); // Stored as JSON string
        } else {
            // Fallback to local schedule.json
            const response = await fetch("schedule.json");
            const localData = await response.json();

            if (!localData[weekday]) throw new Error("No fallback data for today");

            data = {
                grades: localData.grades,
                [weekday]: localData[weekday]
            };

            // Upload to Firebase
            await set(scheduleRef, data);
        }

        if (!Array.isArray(data.grades)) throw new Error("Invalid or missing grades");

        const grades = data.grades;
        const todaySchedule = data[weekday];

        if (!Array.isArray(todaySchedule)) throw new Error("Invalid or missing schedule for today");

        headers = ["שעה", ...grades];
        filteredSchedule = todaySchedule.map(({ "שעה": time, ...classes }) => {
            return [time, ...grades.map(grade => classes[grade] || "")]; //i think this just fills null values to empty
        });
        return { headers, filteredSchedule };
    } catch (err) {
        console.error("readSchedule failed:", err);
        return { headers: [], filteredSchedule: [] };
    }
    
}


let lastCurrentPeriod = null;  // Track the last current period for comparison
let lastScheduleDay = new Date().getDay(); //Track the last day to compare and update day if needed
// Function to load the schedule initially
async function loadSchedule() {
    await readSchedule();

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
        const firstClass = row.slice(1).every(cell => cell === row[1]);
        
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
            [...row].reverse().forEach((cellText, cellIndex) => { //the [...row] makes it not effect the actual row, but instead change a duplicate
                //console.log("\""+cellText+"\"");
                const cell = document.createElement("div");
                cell.textContent = cellText || '\u00A0';
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

let checkScheduleUpdate = false;
const reloadScheduleUpdate = ref(db, "schedules");
onValue(reloadScheduleUpdate, snapshot => {
    if (checkScheduleUpdate) {
        //waiting 5 seconds for if there are many changes to make
        setTimeout(() => {
            location.reload();
        }, 5000);
    }
    checkScheduleUpdate = true;
});


//this code will try to read the page to learn in seder erev and add it to that row
const sederErevRef = ref(db, "sederErev");
onValue(sederErevRef, snapshot => {
    updateSederErevRow();
});

async function updateSederErevRow() {
    await readSchedule();
    //Check if "סדר ערב" exists today
    const sederErevExists = filteredSchedule.some(row =>
        row.slice(1).some(cell => typeof cell === "string" && cell.includes("סדר ערב"))
    );

    if (!sederErevExists) {
        console.log("No סדר ערב today – not advancing page");
        return; //no seder erev so no need to advance 
    }

    const sederErevRef = ref(db, "sederErev");
    const today = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;

    await runTransaction(sederErevRef, (data) => {
        if (!data) return data;
        if (data.lastUpdated === today) return data;

        return {
            ...data,
            page: nextPage(data.page, data.onlyPage),
            lastUpdated: today
        };
    });

    const snapshot = await get(sederErevRef);
    const page = snapshot.val().page;

    // Updating the סדר ערבs to show the correct page.
        document.querySelectorAll("#schedule-rows .schedule-row div").forEach(div => {
        if (div.textContent.includes("סדר ערב")) {
            div.textContent = `סדר ערב - ${page}`;
            div.style.direction = "rtl";
        }
        });
}


function nextPage(current, onlyPage) {
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
        "קעג","קעד","קעה","קעו","קעז","קעח","קעט","קפ"
    ];

    // Extract base letters and optional symbol
    const match = current.match(/^([\u0590-\u05FF]+)([.:])?$/);
    if (!match) return current;

    const base = match[1];
    const symbol = match[2] || null;
    const index = hebrewLetters.indexOf(base);
    if (index === -1) return current;

    // --- MODE A: onlyPage = false (one-side page: no . no :) ---
    if (!onlyPage) {
        if (index + 1 < hebrewLetters.length) {
            return hebrewLetters[index + 1]; // No . or :
        }
        return current;
    }

    // --- MODE B: onlyPage = true (paper: alternate . :) ---
    if (symbol === ".") {
        return `${base}:`;
    } else if (symbol === ":") {
        if (index + 1 < hebrewLetters.length) {
            return `${hebrewLetters[index + 1]}.`;
        }
        return current;
    } else {
        // No symbol present, default to starting with "."
        return `${base}.`;
    }
}

  

// Function to update the current class and scroll to it
async function updateSchedule() {
    if (filteredSchedule.length === 0) {
        return;
    };

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
    now = new Date();
    const currentDay = now.getDay();
    
    if (currentDay !== lastScheduleDay) {
        //i used to try to reload the new day by recalling loadSchedule but it wouldnt always work
        //so its a lot easier to simply reload the page
        /*
        lastScheduleDay = currentDay;
        await loadSchedule(); // Reload schedule for the new day
    
        // Scroll to the top after loading the new schedule
        const scheduleContainer = document.getElementById("schedule-container");
        scheduleContainer.scrollTo({ top: 0, behavior: "smooth" });
        */
        location.reload();
    }    
    updateSchedule();

}, 1000);
