import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getDatabase, ref, get, set, remove } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

/* ---------------- Firebase ---------------- */

const firebaseConfig={
 apiKey:"AIzaSyBVk4Y4CW3pB-3_bbuE8rDHXopUnZuFmSw",
 authDomain:"schedule-mh.firebaseapp.com",
 projectId:"schedule-mh",
 storageBucket:"schedule-mh.appspot.com",
 messagingSenderId:"950949574717",
 appId:"1:950949574717:web:6cc6dfe51ef405e3cf5254"
};

const app=getApps().length?getApps()[0]:initializeApp(firebaseConfig);
const db=getDatabase(app);

/* ---------------- DOM ---------------- */

const table=document.getElementById("schedule-table");
const daySelect=document.getElementById("day-select");
const dateInput=document.getElementById("special-date");
const saveBtn=document.getElementById("save-btn");

/* ---------------- status ---------------- */

const status=document.createElement("div");
status.style.textAlign="center";
status.style.margin="10px";
status.style.fontWeight="bold";
document.body.insertBefore(status,table);

function setStatus(t){status.textContent=t}

/* ---------------- toast ---------------- */

const toast=document.createElement("div");
toast.style.position="fixed";
toast.style.top="20px";
toast.style.left="50%";
toast.style.transform="translateX(-50%)";
toast.style.background="#333";
toast.style.color="white";
toast.style.padding="10px 20px";
toast.style.borderRadius="6px";
toast.style.opacity="0";
toast.style.transition="opacity 0.3s";
toast.style.zIndex="1000";
document.body.appendChild(toast);

function showToast(t){
 toast.textContent=t;
 toast.style.opacity="1";
 setTimeout(()=>toast.style.opacity="0",2000);
}

/* ---------------- buttons ---------------- */

const deleteBtn=document.createElement("button");
deleteBtn.innerHTML="🗑️";
deleteBtn.style.margin="8px";
deleteBtn.style.display="none";
dateInput.parentElement.appendChild(deleteBtn);

const pullBtn=document.createElement("button");
pullBtn.innerHTML="📥 משוך מערכת רגילה";
pullBtn.style.margin="8px";
pullBtn.style.display="none";
dateInput.parentElement.appendChild(pullBtn);

/* ---------------- state ---------------- */

let grades=[];
let rows=[];
let currentDay="מיוחד";
let specialDates=[];
let dragIndex=null;
let gradeCounter=1;

/* ---------------- helpers ---------------- */

function convertDateToKey(v){
 if(!v) return null;
 const [y,m,d]=v.split("-");
 return `${d}-${m}-${y}`;
}

function getWeekdayName(key){
 const [d,m,y]=key.split("-");
 const date=new Date(y,m-1,d);
 const days=["ראשון","שני","שלישי","רביעי","חמישי","שישי","שבת"];
 return days[date.getDay()];
}

function normalizeTime(v){
 const m=v.match(/^(\d{1,2}):(\d{2})$/);
 if(!m) return null;
 let h=parseInt(m[1]);
 let min=parseInt(m[2]);
 if(h>23||min>59) return null;
 return `${h.toString().padStart(2,"0")}:${min.toString().padStart(2,"0")}`;
}

function timeToMinutes(t){
 const n=normalizeTime(t);
 if(!n) return 999999;
 const [h,m]=n.split(":");
 return parseInt(h)*60+parseInt(m);
}

function sortRows(){
 rows.sort((a,b)=>timeToMinutes(a["שעה"])-timeToMinutes(b["שעה"]));
}

/* ---------------- spreadsheet navigation ---------------- */

function handleCellKey(e,row,col){

 if(e.key==="Enter"){
  e.preventDefault();
  focusCell(row+1,col);
 }

 if(e.key==="Tab"){
  e.preventDefault();
  if(e.shiftKey) focusCell(row,col-1);
  else focusCell(row,col+1);
 }

}

function focusCell(r,c){

 const trs=table.querySelectorAll("tr");
 if(r+1>=trs.length) return;

 const cells=trs[r+1].children;
 if(c<0||c>=cells.length) return;

 cells[c].focus();

}

/* ---------------- special dates ---------------- */

async function loadSpecialDates(){

 const snap=await get(ref(db,"specialSchedules"));
 specialDates=[];

 if(!snap.exists()) return;

 const today=new Date();
 today.setHours(0,0,0,0);

 const data=snap.val();

 for(const key in data){

  const [d,m,y]=key.split("-");
  const date=new Date(y,m-1,d);
  date.setHours(0,0,0,0);

  if(date < today){
   await remove(ref(db,"specialSchedules/"+key));
  }else{
   specialDates.push(`${y}-${m}-${d}`);
  }

 }

}

/* ---------------- calendar ---------------- */

async function initCalendar(){

 await loadSpecialDates();
 flatpickr("#special-date",{

  dateFormat:"Y-m-d",
  defaultDate:new Date(),
  disableMobile: true,

  onDayCreate:(dObj,dStr,fp,dayElem)=>{

   const d=dayElem.dateObj;
   const date=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

   if(specialDates.includes(date)){

    const dot=document.createElement("span");

    dot.style.position="absolute";
    dot.style.bottom="3px";
    dot.style.left="50%";
    dot.style.transform="translateX(-50%)";
    dot.style.width="6px";
    dot.style.height="6px";
    dot.style.background="red";
    dot.style.borderRadius="50%";

    dayElem.appendChild(dot);

   }

  },

  onChange:loadSchedule

 });

}

/* ---------------- load schedule ---------------- */

async function loadSchedule(){

 setStatus("טוען...");

 try{

 let refPath;
 let weekday=currentDay;

 if(currentDay==="מיוחד"){

  const key=convertDateToKey(dateInput.value);
  if(!key){grades=[];rows=[];render();return;}

  weekday=getWeekdayName(key);
  refPath=ref(db,"specialSchedules/"+key);

 }else{

  refPath=ref(db,"schedules/"+currentDay);

 }

 const snap=await get(refPath);

 grades=[];
 rows=[];
 gradeCounter=1;

 if(snap.exists()){

  const data=snap.val();
  const names=data.grades||[];

  names.forEach(n=>{
   grades.push({id:"g"+gradeCounter++,name:n});
  });

  (data[weekday]||[]).forEach(r=>{

   const obj={שעה:r["שעה"]||""};

   grades.forEach(g=>{
    obj[g.id]=r[g.name]||"";
   });

   rows.push(obj);

  });

 }

 sortRows();
 render();
 updateButtons();
 setStatus("");

 }catch(e){

  console.error(e);
  setStatus("בעיה בהתחברות למסד הנתונים");

 }

}

/* ---------------- pull weekday schedule ---------------- */

async function pullNormalSchedule(){

 const key=convertDateToKey(dateInput.value);
 if(!key) return;

 const weekday=getWeekdayName(key);

 const snap=await get(ref(db,"schedules/"+weekday));
 if(!snap.exists()) return;

 const data=snap.val();

 grades=[];
 rows=[];
 gradeCounter=1;

 data.grades.forEach(n=>{
  grades.push({id:"g"+gradeCounter++,name:n});
 });

 data[weekday].forEach(r=>{

  const obj={שעה:r["שעה"]||""};

  grades.forEach(g=>{
   obj[g.id]=r[g.name]||"";
  });

  rows.push(obj);

 });

 render();

}

pullBtn.onclick=pullNormalSchedule;

/* ---------------- delete special schedule ---------------- */

deleteBtn.onclick=async()=>{

 const key=convertDateToKey(dateInput.value);

 if(!confirm("למחוק יום מיוחד זה?")) return;

 await remove(ref(db,"specialSchedules/"+key));

 location.reload();

};

/* ---------------- render table ---------------- */

function render(){

 table.innerHTML="";

/* header */

 const header=document.createElement("tr");

 header.appendChild(document.createElement("th"));

 const thTime=document.createElement("th");
 thTime.textContent="שעה";
 header.appendChild(thTime);

 grades.forEach((g,i)=>{

  const th=document.createElement("th");
  th.draggable=true;

  th.ondragstart=()=>dragIndex=i;
  th.ondragover=e=>e.preventDefault();

  th.ondrop=()=>{
   const moved=grades.splice(dragIndex,1)[0];
   grades.splice(i,0,moved);
   dragIndex=null;
   render();
  };

  const wrap=document.createElement("div");
  wrap.style.display="flex";
  wrap.style.justifyContent="space-between";

  const title=document.createElement("div");
  title.contentEditable=true;
  title.textContent=g.name;

  title.style.minWidth="40px";
  title.style.display="inline-block";

  title.onblur=()=>g.name=title.innerText;

  const del=document.createElement("span");
  del.textContent="✕";
  del.style.cursor="pointer";

  del.onclick=()=>{

   if(!confirm(`למחוק את העמודה "${g.name||"עמודה ריקה"}"?`)) return;

   grades.splice(i,1);
   rows.forEach(r=>delete r[g.id]);
   render();

  };

  wrap.appendChild(title);
  wrap.appendChild(del);

  th.appendChild(wrap);
  header.appendChild(th);

 });

 const add=document.createElement("th");
 add.textContent="+";
 add.style.background="green";
 add.style.color="white";
 add.style.cursor="pointer";

 add.onclick=()=>{

  const id="g"+gradeCounter++;

  grades.push({id,name:""});

  rows.forEach(r=>r[id]="");

  render();

 };

 header.appendChild(add);
 table.appendChild(header);

/* rows */

 rows.forEach((row,i)=>{

  const tr=document.createElement("tr");

  const del=document.createElement("td");
  del.textContent="✕";
  del.onclick=()=>{rows.splice(i,1);render();}
  tr.appendChild(del);

/* time */

  const time=document.createElement("td");
  time.contentEditable=true;
  time.textContent=row["שעה"]||"";

  time.oninput=()=>row["שעה"]=time.innerText.trim();

  time.onblur=()=>{
   const n=normalizeTime(time.innerText.trim());
   if(n) row["שעה"]=n;
   sortRows();
   render();
  };

  tr.appendChild(time);

/* classes */

  grades.forEach((g,c)=>{

   const td=document.createElement("td");
   td.contentEditable=true;
   td.textContent=row[g.id]||"";

   td.oninput=()=>row[g.id]=td.innerText.trim();
   td.onkeydown=e=>handleCellKey(e,i,c+2);

   tr.appendChild(td);

  });

  table.appendChild(tr);

 });

/* add row */

 const addRow=document.createElement("tr");
 const td=document.createElement("td");

 td.colSpan=grades.length+2;
 td.textContent="+";

 td.style.background="green";
 td.style.color="white";
 td.style.cursor="pointer";
 td.style.textAlign="center";

 td.onclick=()=>{

  const r={שעה:""};
  grades.forEach(g=>r[g.id]="");
  rows.push(r);

  render();

 };

 addRow.appendChild(td);
 table.appendChild(addRow);

}

/* ---------------- save ---------------- */

async function saveSchedule(){

 document.activeElement.blur();

 try{

  const out=rows.map(r=>{

   const obj={"שעה":r["שעה"]||""};

   grades.forEach((g,i)=>{

    let name=g.name.trim();
    if(name==="") name="עמודה "+(i+1);

    obj[name]=r[g.id]||"";

   });

   return obj;

  });

  const gradeNames=grades.map((g,i)=>{
   let name=g.name.trim();
   if(name==="") name="עמודה "+(i+1);
   return name;
  });

  let payload;
  let refPath;

  if(currentDay==="מיוחד"){

   const key=convertDateToKey(dateInput.value);
   const weekday=getWeekdayName(key);

   payload={grades:gradeNames,[weekday]:out};
   refPath=ref(db,"specialSchedules/"+key);

  }else{

   payload={grades:gradeNames,[currentDay]:out};
   refPath=ref(db,"schedules/"+currentDay);

  }

  await set(refPath,payload);

  await loadSpecialDates();

  /* refresh calendar dots */
  const fp=document.querySelector("#special-date")._flatpickr;
  if(fp) fp.redraw();

  /* update pull/delete button */
  updateButtons();

  showToast("נשמר");
 }catch(err){

  console.error(err);
  showToast("שגיאה בשמירה");

 }

}

/* ---------------- UI ---------------- */

function updateButtons(){

 if(currentDay!=="מיוחד"){
  deleteBtn.style.display="none";
  pullBtn.style.display="none";
  return;
 }

 const key=dateInput.value;

 if(specialDates.includes(key)){
  deleteBtn.style.display="inline-block";
  pullBtn.style.display="none";
 }else{
  deleteBtn.style.display="none";
  pullBtn.style.display="inline-block";
 }

}

/* ---------------- events ---------------- */

daySelect.onchange=()=>{

 currentDay=daySelect.value;
 dateInput.style.display=currentDay==="מיוחד"?"inline-block":"none";

 loadSchedule();

};

saveBtn.onclick=saveSchedule;

/* ---------------- start ---------------- */

(async()=>{

 await initCalendar();

 daySelect.value="מיוחד";
 currentDay="מיוחד";

 dateInput.style.display="inline-block";

 loadSchedule();

})();

//gotta update the github of script, and then upload edit-schedule html and js
//need to make topText editable by send messages
