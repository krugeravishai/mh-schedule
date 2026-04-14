import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

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

const topRef = ref(db,"topText");
const coverRef = ref(db,"cover");
const sederRef = ref(db,"sederErev");

const toast = document.getElementById("toast");

function showToast(t){
  toast.textContent = t;
  toast.style.opacity = "1";
  setTimeout(()=>toast.style.opacity="0",1500);
}

function todayKey(){
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
}

/* TOGGLE */
function setToggleUI(val){
  const chip = document.getElementById("onlyPageToggle");

  if(val){
    chip.textContent = "עמוד";
    chip.style.background = "#7cc576";
  }else{
    chip.textContent = "דף";
    chip.style.background = "#ccc";
  }
}

/* LOAD */
async function load(){

  const top = await get(topRef);
  if(top.exists()) document.getElementById("topText").value = top.val();

  const cover = await get(coverRef);
  if(cover.exists()) document.getElementById("cover").value = cover.val();

  const seder = await get(sederRef);
  if(seder.exists()){
    const data = seder.val();
    document.getElementById("sederPage").value = data.page || "";
    document.getElementById("onlyPage").value = data.onlyPage || false;
    setToggleUI(data.onlyPage);
  }
}

/* SAVE TOP */
document.getElementById("saveTopText").onclick = async ()=>{
  await set(topRef, document.getElementById("topText").value);
  showToast("נשמר");
};

/* SAVE COVER */
document.getElementById("saveCover").onclick = async ()=>{
  await set(coverRef, document.getElementById("cover").value);
  showToast("נשמר");
};

/* SAVE SEDER */
document.getElementById("saveSederErev").onclick = async ()=>{

  const snap = await get(sederRef);
  const existing = snap.exists() ? snap.val() : {};

  await set(sederRef,{
    ...existing,
    page: document.getElementById("sederPage").value,
    onlyPage: document.getElementById("onlyPage").value === "true",
    lastUpdated: todayKey()
  });

  showToast("נשמר");
};

/* TOGGLE */
document.getElementById("onlyPageToggle").onclick = ()=>{
  const hidden = document.getElementById("onlyPage");

  const val = hidden.value !== "true";
  hidden.value = val;

  setToggleUI(val);
};

load();