// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getDatabase, ref, set, update, onValue } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-database.js";

// --- Firebase Config ---
const firebaseConfig = {
    apiKey: "AIzaSyBVkawjdyAmNLZvKIFUejWZx94HIHyKQZk",
    authDomain: "mt-managemant.firebaseapp.com",
    databaseURL: "https://mt-managemant-default-rtdb.firebaseio.com",
    projectId: "mt-managemant",
    storageBucket: "mt-managemant.firebasestorage.app",
    messagingSenderId: "831738703268",
    appId: "1:831738703268:web:eeb23efa50bd32f853e531"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- Javascript Data Logic ---
let userNow = "";
let chatRole = ""; 
const today = new Date().toISOString().split('T')[0];

// Core Data (Initial Empty State, will be populated by Firebase)
let workers = [];
let rates = {}; 
let accounts = {};
let histories = { boardWork: [], userWork: [], nasta: [], loan: [], company: [] };
let approvedUsers = {};
let pendingRequests = [];
let chatMsgs = [];
let secAdmin = { mob: '4444', pass: 'mmmm' };
let branding = { name: 'MT-MANAGEMENT PRO', logo: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' };
let sectionNames = {
    secProduction: 'প্রোডাকশন', secWork: 'কাজ', secNasta: 'নাস্তা', secLoan: 'পেমেন্ট/লোন', secCompany: 'কোম্পানি রিপোর্ট'
};
let appNotice = "";
let userPics = {};

// --- Real-time Data Sync from Firebase ---
const dbRef = ref(db, '/');
onValue(dbRef, (snapshot) => {
    const data = snapshot.val() || {};
    
    workers = data.workers || [];
    rates = data.rates || {};
    accounts = data.accounts || {};
    histories = data.histories || { boardWork: [], userWork: [], nasta: [], loan: [], company: [] };
    approvedUsers = data.approved_users || {};
    pendingRequests = data.pending_reqs || [];
    chatMsgs = data.support_chat || [];
    secAdmin = data.secAdmin || { mob: '4444', pass: 'mmmm' };
    branding = data.branding || { name: 'MT-MANAGEMENT PRO', logo: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' };
    sectionNames = data.sectionNames || sectionNames;
    appNotice = data.appNotice || "";
    userPics = data.userPics || {};

    // Update UI dynamically on data change
    applyBranding();
    loadNotice();
    if(!document.getElementById('adminPanel')?.classList.contains('hidden')) erAdminAll();
    if(!document.getElementById('userDashboard')?.classList.contains('hidden')) erUserPanel();
    if(!document.getElementById('secAdminPanel')?.classList.contains('hidden')) erSecAdminStats();
    if(!document.getElementById('chatModal')?.classList.contains('hidden')) erMessages();
});

// Initialization
['pDate', 'npDate', 'nDate', 'lDate', 'cDate'].forEach(id => {
    let el = document.getElementById(id); if(el) el.value = today;
});

// --- Clock Logic ---
function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute:'2-digit' });
    const dateStr = now.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' });
    const timeEl = document.getElementById('digitalTime');
    const dateEl = document.getElementById('digitalDate');
    if(timeEl) timeEl.innerText = timeStr;
    if(dateEl) dateEl.innerText = dateStr;
}
setInterval(updateClock, 1000); updateClock();

// --- Branding & Settings ---
window.applyBranding = function applyBranding() {
    if(document.getElementById('brandNameLogin')) document.getElementById('brandNameLogin').innerText = branding.name;
    if(document.getElementById('brandLogoLogin')) document.getElementById('brandLogoLogin').src = branding.logo;
    if(document.getElementById('adminProfileImg')) document.getElementById('adminProfileImg').src = branding.logo;
    if(document.getElementById('adminBrandName')) document.getElementById('adminBrandName').innerText = "Admin"; 
    
    if(document.getElementById('setBrandName')) document.getElementById('setBrandName').value = branding.name;
    if(document.getElementById('secAdmMob')) document.getElementById('secAdmMob').value = secAdmin.mob;
    if(document.getElementById('secAdmPass')) document.getElementById('secAdmPass').value = secAdmin.pass;
    
    applySectionNames();
}
window.saveBranding = function saveBranding() {
    branding.name = document.getElementById('setBrandName').value;
    set(ref(db, 'branding'), branding);
    alert("Branding Saved!");
}
window.uploadBrandLogo = function uploadBrandLogo(input) {
    if(input.files[0]) {
        let r = new FileReader();
        r.onload = e => { 
            branding.logo = e.target.result; 
            set(ref(db, 'branding/logo'), branding.logo);
        };
        r.readAsDataURL(input.files[0]);
    }
}
window.saveSecAdmin = function saveSecAdmin() {
    secAdmin.mob = document.getElementById('secAdmMob').value;
    secAdmin.pass = document.getElementById('secAdmPass').value;
    set(ref(db, 'secAdmin'), secAdmin);
    alert("Secondary Admin Updated!");
}

window.applySectionNames = function applySectionNames() {
    const ids = ['secProduction', 'secWork', 'secNasta', 'secLoan', 'secCompany'];
    ids.forEach(id => {
        if(document.getElementById('lbl_'+id)) document.getElementById('lbl_'+id).innerText = sectionNames[id];
        if(document.getElementById('t_'+id)) document.getElementById('t_'+id).innerText = sectionNames[id];
        if(document.getElementById('rn_'+id)) document.getElementById('rn_'+id).value = sectionNames[id];
    });
}
window.saveSectionNames = function saveSectionNames() {
    sectionNames.secProduction = document.getElementById('rn_secProduction').value;
    sectionNames.secWork = document.getElementById('rn_secWork').value;
    sectionNames.secNasta = document.getElementById('rn_secNasta').value;
    sectionNames.secLoan = document.getElementById('rn_secLoan').value;
    sectionNames.secCompany = document.getElementById('rn_secCompany').value;
    set(ref(db, 'sectionNames'), sectionNames);
    alert("Names saved!");
}

// --- Navigation ---
window.navTo = function navTo(secId) {
    document.querySelector('#adminPanel .scroll-content').classList.add('hidden');
    document.getElementById(secId).classList.remove('hidden');
}
window.goBack = function goBack() {
    document.querySelectorAll('.section-container').forEach(el => el.classList.add('hidden'));
    document.querySelector('#adminPanel .scroll-content').classList.remove('hidden');
}
window.toggleForm = function toggleForm(type) {
    document.getElementById('loginForm').classList.toggle('hidden', type === 'reg');
    document.getElementById('regForm').classList.toggle('hidden', type === 'login');
}
window.confirmLogout = function confirmLogout() { if(confirm("Logout?")) location.reload(); }

// --- Auth Logic ---
window.handleReg = function handleReg() {
    let n = document.getElementById('rName').value.trim();
    let m = document.getElementById('rMob').value.trim();
    let p = document.getElementById('rPass').value;
    if(!n || !m || !p) return alert("Fill all fields");
    
    pendingRequests.push({name: n, mob: m, pass: p});
    set(ref(db, 'pending_reqs'), pendingRequests);
    alert("Request Sent!"); toggleForm('login');
}

window.handleLogin = function handleLogin() {
    let m = document.getElementById('lMob').value.trim();
    let p = document.getElementById('lPass').value;
    
    if(m === '4444' && p === 'mmmm') {
        document.getElementById('authPage').classList.add('hidden');
        document.getElementById('adminPanel').classList.remove('hidden');
        erAdminAll();
    } else if (m === secAdmin.mob && p === secAdmin.pass && secAdmin.mob !== "") {
        document.getElementById('authPage').classList.add('hidden');
        document.getElementById('secAdminPanel').classList.remove('hidden');
        erSecAdminStats();
    } else {
        let user = Object.values(approvedUsers).find(u => u.mob === m && u.pass === p);
        if(user) {
            userNow = user.name;
            document.getElementById('authPage').classList.add('hidden');
            document.getElementById('userDashboard').classList.remove('hidden');
            erUserPanel();
        } else { alert("Wrong Credentials!"); }
    }
}

// --- Admin Functions ---
window.erAdminAll = function erAdminAll() {
    ['pWorkers', 'nWorkers', 'lWorkers', 'npWorkers'].forEach(id => {
        const c = document.getElementById(id);
        if(c) c.innerHTML = workers.map(w => `<div class="w-chip" onclick="this.classList.toggle('selected')">${w}</div>`).join('');
    });
    erFinalBalance(); erRequests(); erSettings(); calculateAdminStats(); erActiveUsers();
}

window.calculateAdminStats = function calculateAdminStats() {
    let totalWork = 0; let totalTaken = 0;
    Object.values(accounts).forEach(a => totalWork += (a.bill || 0));
    Object.values(accounts).forEach(a => totalTaken += (a.cost || 0));
    if(document.getElementById('admTotWork')) document.getElementById('admTotWork').innerText = totalWork.toFixed(0);
    if(document.getElementById('admTotTaken')) document.getElementById('admTotTaken').innerText = totalTaken.toFixed(0);
    if(document.getElementById('admTotDue')) document.getElementById('admTotDue').innerText = (totalWork - totalTaken).toFixed(0);
}

window.erSecAdminStats = function erSecAdminStats() {
    let totProd = 0;
    if(histories.boardWork) histories.boardWork.forEach(h => totProd += h.totalTk);
    
    let totCompTaken = 0;
    if(histories.company) histories.company.forEach(c => { if(c.type === 'in') totCompTaken += c.amount; });

    if(document.getElementById('secAdmWork')) document.getElementById('secAdmWork').innerText = totProd.toFixed(0);
    if(document.getElementById('secAdmTaken')) document.getElementById('secAdmTaken').innerText = totCompTaken.toFixed(0);
    if(document.getElementById('secAdmDue')) document.getElementById('secAdmDue').innerText = (totProd - totCompTaken).toFixed(0);
}

window.saveData = function saveData() {
    update(ref(db, '/'), {
        accounts: accounts,
        histories: histories,
        workers: workers,
        rates: rates
    });
}

// --- Data Entry ---
window.saveBoardWork = function saveBoardWork() {
    let selected = Array.from(document.querySelectorAll('#npWorkers .selected')).map(el => el.innerText);
    let s = parseInt(document.getElementById('npS').value || 0);
    let d = parseInt(document.getElementById('npD').value || 0);
    let rS = parseFloat(document.getElementById('npRateS').value || 0);
    let rD = parseFloat(document.getElementById('npRateD').value || 0);
    if(selected.length === 0) return alert("Select Workers");
    let tk = (s*rS) + (d*rD);
    
    if(!histories.boardWork) histories.boardWork = [];
    histories.boardWork.unshift({ id: Date.now(), date: document.getElementById('npDate').value, names: selected, s, d, totalTk: tk });
    
    saveData(); 
    document.querySelectorAll('.selected').forEach(e=>e.classList.remove('selected')); 
    alert("Saved!");
}

window.saveUserRateWork = function saveUserRateWork() {
    let selected = Array.from(document.querySelectorAll('#pWorkers .selected')).map(el => el.innerText);
    let s = parseInt(document.getElementById('sQty').value || 0);
    let d = parseInt(document.getElementById('dQty').value || 0);
    if(!selected.length) return alert("Select Workers");
    let grpTotal = 0; let details = [];
    selected.forEach(w => {
        if(!accounts[w]) accounts[w] = {bill:0, cost:0};
        let bill = (s * (rates[w]?.s||0)) + (d * (rates[w]?.d||0));
        accounts[w].bill += bill; grpTotal += bill; details.push({name:w, bill:bill});
    });
    
    if(!histories.userWork) histories.userWork = [];
    histories.userWork.unshift({ id:Date.now(), date:document.getElementById('pDate').value, names:selected, s, d, totalTk:grpTotal, details });
    
    saveData(); 
    document.querySelectorAll('.selected').forEach(e=>e.classList.remove('selected')); 
    alert("Saved!");
}

window.saveMoney = function saveMoney(type) {
    let idP = type==='nasta'?'nWorkers':'lWorkers';
    let idA = type==='nasta'?'nAmount':'lAmount';
    let idD = type==='nasta'?'nDate':'lDate';
    let idN = type==='nasta'?'nNote':'lNote';
    let selected = Array.from(document.querySelectorAll(`#${idP} .selected`)).map(e=>e.innerText);
    let amt = parseFloat(document.getElementById(idA).value||0);
    if(!selected.length || amt<=0) return alert("Invalid Input");
    let perHead = amt/selected.length;
    selected.forEach(w => {
        if(!accounts[w]) accounts[w]={bill:0,cost:0};
        accounts[w].cost += perHead;
    });
    
    if(!histories[type]) histories[type] = [];
    histories[type].unshift({ id:Date.now(), date:document.getElementById(idD).value, names:selected, amount:amt, perHead, note:document.getElementById(idN).value });
    
    saveData(); 
    document.querySelectorAll('.selected').forEach(e=>e.classList.remove('selected'));
    document.getElementById(idA).value=''; 
    document.getElementById(idN).value=''; 
    alert("Saved!");
}

window.saveCompanyData = function saveCompanyData() {
    let date = document.getElementById('cDate').value;
    let amount = parseFloat(document.getElementById('cAmount').value || 0);
    let note = document.getElementById('cNote').value;
    if(!amount) return alert("টাকার পরিমাণ দিন");
    if(!histories.company) histories.company = [];
    histories.company.unshift({ id: Date.now(), date: date, type: 'in', amount: amount, note: note });
    
    set(ref(db, 'histories/company'), histories.company);
    document.getElementById('cAmount').value = ''; document.getElementById('cNote').value = '';
    alert("Saved!");
}

// --- Deletion Logic ---
window.delItem = function delItem(type, idx) {
    if(!confirm("Delete?")) return;
    let item = histories[type][idx];
    if(type === 'userWork') {
        item.details.forEach(d => { if(accounts[d.name]) accounts[d.name].bill -= d.bill; });
    } else if (type === 'nasta' || type === 'loan') {
        item.names.forEach(n => { if(accounts[n]) accounts[n].cost -= item.perHead; });
    }
    histories[type].splice(idx, 1); 
    saveData();
    openAdminReport(type); 
}

window.delCompanyItem = function delCompanyItem(idx) {
    if(confirm("Delete?")) { 
        histories.company.splice(idx, 1); 
        set(ref(db, 'histories/company'), histories.company);
        openAdminReport('company'); 
    }
}

// --- Admin Reports View ---
window.openAdminReport = function openAdminReport(type) {
    let html = "";
    let isSecAdmin = !document.getElementById('secAdminPanel').classList.contains('hidden');

    if(type === 'boardWork') {
        html = `<table class="data-table"><thead><tr><th>Date</th><th>Names</th><th>Tk</th>${!isSecAdmin ? '<th>X</th>' : ''}</tr></thead><tbody>`;
        if(histories.boardWork) histories.boardWork.forEach((h,i) => {
            html += `<tr><td>${h.date}</td><td><small>${h.names.join(', ')}</small></td><td>${h.totalTk}</td>${!isSecAdmin ? `<td><button class="del-btn" onclick="delItem('boardWork',${i})">X</button></td>` : ''}</tr>`;
        });
        document.getElementById('repTitle').innerText = "প্রোডাকশন রিপোর্ট";
    } else if (type === 'userWork') {
        html = `<table class="data-table"><thead><tr><th>Date</th><th>Names</th><th>Tk</th><th>X</th></tr></thead><tbody>`;
        if(histories.userWork) histories.userWork.forEach((h,i) => {
            html += `<tr><td>${h.date}</td><td><small>${h.names.join(',')}</small></td><td>${h.totalTk}</td><td><button class="del-btn" onclick="delItem('userWork',${i})">X</button></td></tr>`;
        });
        document.getElementById('repTitle').innerText = "কাজের রিপোর্ট";
    } else if (type === 'nasta' || type === 'loan') {
        html = `<table class="data-table"><thead><tr><th>Date</th><th>For</th><th>Tk</th><th>X</th></tr></thead><tbody>`;
        if(histories[type]) histories[type].forEach((h,i) => {
            html += `<tr><td>${h.date}</td><td><small>${h.names.join(',')}</small></td><td>${h.amount}</td><td><button class="del-btn" onclick="delItem('${type}',${i})">X</button></td></tr>`;
        });
        document.getElementById('repTitle').innerText = (type==='nasta'?"নাস্তা":"পেমেন্ট")+" রিপোর্ট";
    } else if (type === 'company') {
        let totProd = 0; if(histories.boardWork) histories.boardWork.forEach(h => totProd += h.totalTk);
        let totTaken = 0; if(histories.company) histories.company.forEach(c => { if(c.type==='in') totTaken+=c.amount; });
        
        html = `<div style="padding:10px; background:#f1f2f6; border-radius:8px; margin-bottom:10px;">
            <strong>মোট প্রোডাকশন:</strong> ${totProd.toFixed(0)} <br>
            <strong>মোট নেওয়া:</strong> ${totTaken.toFixed(0)} <br>
            <strong style="color:${(totProd-totTaken)>=0?'#00b894':'#d63031'}">বর্তমান পাওনা: ${(totProd-totTaken).toFixed(0)}</strong>
        </div>`;
        
        html += `<table class="data-table"><thead><tr><th>তারিখ</th><th>টাকা</th><th>নোট</th>${!isSecAdmin ? '<th>X</th>' : ''}</tr></thead><tbody>`;
        if(histories.company) histories.company.forEach((item, idx) => {
            if(item.type === 'in') {
                html += `<tr><td>${item.date}</td><td>${item.amount}</td><td>${item.note}</td>${!isSecAdmin ? `<td><button class="del-btn" onclick="delCompanyItem(${idx})">X</button></td>` : ''}</tr>`;
            }
        });
        document.getElementById('repTitle').innerText = "দেওয়া টাকার রিপোর্ট ";
    }

    html += "</tbody></table>";
    document.getElementById('repContent').innerHTML = html;
    document.getElementById('reportModal').classList.remove('hidden');
}

window.closeModal = function closeModal() { 
    document.getElementById('reportModal').classList.add('hidden'); 
}

// --- Settings & User Management ---
window.addWorker = function addWorker() {
    let n = document.getElementById('newWorkerName').value.trim();
    if(n && !workers.includes(n)) { 
        workers.push(n); 
        rates[n]={s:0,d:0}; 
        saveData(); 
        document.getElementById('newWorkerName').value=''; 
    } else {
        alert("Name empty or exists!");
    }
}

window.setRate = function setRate(w,k,v) { 
    if(!rates[w]) rates[w] = {s:0, d:0};
    rates[w][k]=parseFloat(v); 
    set(ref(db, `rates/${w}`), rates[w]); 
}

window.erSettings = function erSettings() {
    if(!document.getElementById('settingsTable')) return;
    document.getElementById('settingsTable').innerHTML = workers.map(w => `
        <tr>
            <td>${w}</td>
            <td><input style="width:50px; padding:5px; border:1px solid #dfe6e9; border-radius:4px;" type="number" value="${rates[w]?.s||0}" onchange="setRate('${w}','s',this.value)"></td>
            <td><input style="width:50px; padding:5px; border:1px solid #dfe6e9; border-radius:4px;" type="number" value="${rates[w]?.d||0}" onchange="setRate('${w}','d',this.value)"></td>
            <td>
                <button onclick="toggleLock(this)" style="background:#f0f0f0; color:#333; border:1px solid #ccc; padding:5px 8px; border-radius:4px; font-size:12px;">
                    🔓 Unlock
                </button>
            </td>
            <td><button class="del-btn" onclick="delWorker('${w}')"><i class="fas fa-trash"></i></button></td>
        </tr>
    `).join('');
}

window.toggleLock = function toggleLock(btn) {
    const row = btn.closest('tr');
    const inputs = row.querySelectorAll('input');
    const isLocked = inputs[0].disabled;

    if (!isLocked) {
        inputs.forEach(input => { input.disabled = true; input.style.backgroundColor = "#e9ecef"; });
        btn.innerHTML = "🔒 Lock";
        btn.style.background = "#ffcc00"; 
        btn.style.borderColor = "#e6b800";
    } else {
        inputs.forEach(input => { input.disabled = false; input.style.backgroundColor = "#fff"; });
        btn.innerHTML = "🔓 Unlock";
        btn.style.background = "#f0f0f0";
        btn.style.borderColor = "#ccc";
    }
}

window.delWorker = function delWorker(n) { 
    if(confirm("Delete "+n+" and all data?")) { 
        workers = workers.filter(w=>w!==n); 
        delete accounts[n];
        delete rates[n];
        saveData(); 
    } 
}

window.erFinalBalance = function erFinalBalance() {
    if(!document.getElementById('finalBalanceBody')) return;
    document.getElementById('finalBalanceBody').innerHTML = workers.map(w => {
        let a = accounts[w]||{bill:0,cost:0};
        let due = a.bill - a.cost;
        return `<tr>
            <td>${w}</td>
            <td>${a.bill.toFixed(0)}</td>
            <td>${a.cost.toFixed(0)}</td>
            <td style="font-weight:bold; color:${due<0?'#d63031':'#00b894'}">${due.toFixed(0)}</td>
        </tr>`;
    }).join('');
}

window.erRequests = function erRequests() {
    if(!document.getElementById('reqList')) return;
    document.getElementById('reqList').innerHTML = pendingRequests.map((r,i) => `
        <tr>
            <td>
                <span style="font-weight:bold">${r.name}</span><br>
                <small>${r.mob}</small>
            </td>
            <td><button class="action-btn" style="width:auto; padding:5px 10px; margin:0;" onclick="approve(${i})">Approve</button></td>
        </tr>
    `).join('');
}

window.erActiveUsers = function erActiveUsers() {
    if(!document.getElementById('activeUserList')) return;
    document.getElementById('activeUserList').innerHTML = Object.values(approvedUsers).map(u => `
        <tr><td>${u.name}</td><td>${u.mob}</td></tr>
    `).join('');
}

window.approve = function approve(i) {
    let u = pendingRequests[i]; 
    approvedUsers[u.mob]=u; 
    
    if(!workers.includes(u.name)) { 
        workers.push(u.name); 
        rates[u.name]={s:0,d:0}; 
    }
    
    pendingRequests.splice(i,1); 
    update(ref(db, '/'), { approved_users: approvedUsers, pending_reqs: pendingRequests, workers: workers, rates: rates });
}

// --- User Dashboard Logic ---
window.erUserPanel = function erUserPanel() {
    document.getElementById('uNameDisp').innerText = userNow;
    
    let p = userPics[userNow];
    if(p && document.getElementById('uImg')) document.getElementById('uImg').src=p;
    
    let a = accounts[userNow]||{bill:0,cost:0};
    if(document.getElementById('uTotWork')) document.getElementById('uTotWork').innerText = a.bill.toFixed(0);
    if(document.getElementById('uTotTaken')) document.getElementById('uTotTaken').innerText = a.cost.toFixed(0);
    if(document.getElementById('uBal')) document.getElementById('uBal').innerText = (a.bill - a.cost).toFixed(0);
}

window.openUserReport = function openUserReport(type) {
    let html = "", tot=0;
    
    if (type === 'boardWork') {
        html = `<table class="data-table"><thead><tr><th>Date</th><th>Names</th><th>S/D</th><th>Tk</th></tr></thead><tbody>`;
        if(histories.boardWork) histories.boardWork.forEach(h => {
            html += `<tr><td>${h.date}</td><td><small>${h.names.join(',')}</small></td><td>S:${h.s}/D:${h.d}</td><td>${h.totalTk}</td></tr>`;
        });
        document.getElementById('repTitle').innerText = "প্রোডাকশন রিপোর্ট";
    } 
    else if(type==='work') {
        html=`<table class="data-table"><thead><tr><th>Date</th><th>S/D</th><th>Tk</th></tr></thead><tbody>`;
        if(histories.userWork) histories.userWork.filter(h=>h.names.includes(userNow)).forEach(h=>{
            let my = h.details.find(d=>d.name===userNow)?.bill||0; tot+=my; 
            html+=`<tr><td>${h.date}</td><td>${h.s}/${h.d}</td><td>${my}</td></tr>`;
        });
        html += `</tbody></table><div style="padding:10px; text-align:right; font-weight:bold;">Total: ${tot.toFixed(0)}</div>`;
        document.getElementById('repTitle').innerText = "আমার কাজের রিপোর্ট";
    } 
    else if(type==='nasta' || type==='payment') { 
         let key = type==='nasta'?'nasta':'loan';
         html=`<table class="data-table"><thead><tr><th>Date</th><th>Tk (Note)</th></tr></thead><tbody>`;
         if(histories[key]) histories[key].filter(h=>h.names.includes(userNow)).forEach(h=>{
            tot+=h.perHead; html+=`<tr><td>${h.date}</td><td>${h.perHead.toFixed(1)} (${h.note})</td></tr>`;
         });
         html += `</tbody></table><div style="padding:10px; text-align:right; font-weight:bold;">Total: ${tot.toFixed(1)}</div>`;
         document.getElementById('repTitle').innerText = (type==='nasta'?"আমার নাস্তা":"আমার পেমেন্ট")+" রিপোর্ট";
    }
    
    document.getElementById('repContent').innerHTML = html;
    document.getElementById('reportModal').classList.remove('hidden');
}

// --- Chat System ---
window.openChat = function openChat(role) {
    chatRole = role;
    document.getElementById('chatModal').classList.remove('hidden');
    erMessages();
}

window.closeChat = function closeChat() { 
    document.getElementById('chatModal').classList.add('hidden'); 
}

window.sendMsg = function sendMsg() {
    let txt = document.getElementById('chatInput').value.trim();
    if(!txt) return;
    
    let sender = (chatRole === 'admin') ? 'Admin' : userNow;
    let msgObj = { role: chatRole, text: txt, time: new Date().toLocaleTimeString(), senderName: sender };
    
    chatMsgs.push(msgObj);
    set(ref(db, 'support_chat'), chatMsgs);
    
    document.getElementById('chatInput').value = '';
}

window.erMessages = function erMessages() {
    let html = '';
    chatMsgs.forEach(m => {
        let type = (m.role === chatRole) ? 'msg-out' : 'msg-in';
        html += `
        <div class="msg-bubble ${type}">
            <div style="font-size:10px; opacity:0.7; margin-bottom:2px;">${m.senderName}</div>
            ${m.text}
        </div>`;
    });
    let body = document.getElementById('chatBody');
    if(body) { body.innerHTML = html; body.scrollTop = body.scrollHeight; }
}

// --- Profiles and Notices ---
window.changeProfilePic = function changeProfilePic(input){
    if(typeof userNow === "undefined" || userNow === "") return;

    if(input.files && input.files[0]){
        let reader = new FileReader();
        reader.onload = function(e){
            let preview = document.getElementById('profilePreview');
            let headerImg = document.getElementById('uImg');

            if(preview) preview.src = e.target.result;
            if(headerImg) headerImg.src = e.target.result;

            userPics[userNow] = e.target.result;
            set(ref(db, `userPics/${userNow}`), e.target.result);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

window.openUserPanel = function openUserPanel(){
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("userPanel").style.display = "block";
    loadNotice();
}

window.openUserProfile = function openUserProfile(){
    document.getElementById('userDashboard').classList.add('hidden');
    document.getElementById('userProfileSec').classList.remove('hidden');
    document.getElementById('profileName').innerText = userNow;

    let p = userPics[userNow];
    if(p) document.getElementById('profilePreview').src = p;
}

window.closeUserProfile = function closeUserProfile(){
    document.getElementById('userProfileSec').classList.add('hidden');
    document.getElementById('userDashboard').classList.remove('hidden');
}

window.updatePassword = function updatePassword(){
    let newPass = document.getElementById('newPassword').value;
    let confirmPass = document.getElementById('confirmPassword').value;

    if(newPass === "" || confirmPass === "") return alert("Please enter password in both fields!");
    if(newPass !== confirmPass) return alert("Passwords do not match!");

    Object.keys(approvedUsers).forEach(mob => {
        if(approvedUsers[mob].name === userNow) approvedUsers[mob].pass = newPass;
    });

    set(ref(db, 'approved_users'), approvedUsers);
    alert("Password updated successfully!");
    document.getElementById('newPassword').value = "";
    document.getElementById('confirmPassword').value = "";
}

window.setNotice = function setNotice(text){
    set(ref(db, 'appNotice'), text);
}

window.loadNotice = function loadNotice(){
    let noticeBar = document.getElementById("noticeBar");
    let noticeText = document.getElementById("noticeText");
    let inputEl = document.getElementById("adminNoticeInput");

    if(appNotice && appNotice.trim() !== ""){
        if(noticeText) noticeText.innerText = "📢 " + appNotice;
        if(noticeBar) noticeBar.style.display = "block";
        if(inputEl) inputEl.value = appNotice;
    } else {
        if(noticeBar) noticeBar.style.display = "none";
    }
}

window.updateNoticeFromAdmin = function updateNoticeFromAdmin(){
    let inputEl = document.getElementById("adminNoticeInput");
    if(!inputEl) return alert("Textarea not found!");
    let text = inputEl.value.trim();
    if(text === "") return alert("নোটিশ লিখুন!");
    setNotice(text);
    alert("Notice Updated Successfully!");
}

// ============================================================
// MT MANAGEMENT PRO — NEW ACCOUNTING / NOTIFICATION ENGINE
// ============================================================
let products = {};
let workerLedger = {};
let notifications = {};
let companyLedger = {};
let openingBalances = {};
let lastNotificationIds = {};

function money(n){ return Number(n||0).toLocaleString('en-US',{maximumFractionDigits:2}); }
function esc(v){ return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
function uid(prefix='id'){ return prefix+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,7); }
function ensureNewData(){
    products = products || {};
    workerLedger = workerLedger || {};
    notifications = notifications || {};
    companyLedger = companyLedger || {};
    openingBalances = openingBalances || {};
}
function workerBalance(name){
    let base = Number(openingBalances?.[name] ?? ((accounts?.[name]?.bill||0)-(accounts?.[name]?.cost||0)));
    let sum = 0;
    Object.values(workerLedger?.[name]||{}).forEach(x=>{
        if(x.type==='earning') sum += Number(x.amount||0);
        if(x.type==='deduction') sum -= Number(x.amount||0);
    });
    return base + sum;
}
function workerTotals(name){
    let base = Number(openingBalances?.[name] ?? ((accounts?.[name]?.bill||0)-(accounts?.[name]?.cost||0)));
    let earn=0,ded=0;
    Object.values(workerLedger?.[name]||{}).forEach(x=>x.type==='earning'?earn+=Number(x.amount||0):ded+=Number(x.amount||0));
    return {base,earn,ded,balance:base+earn-ded};
}
function ensureOpening(name){
    if(openingBalances[name]===undefined){
        openingBalances[name]=Number((accounts?.[name]?.bill||0)-(accounts?.[name]?.cost||0));
    }
}
function pushLedger(name, entry){
    ensureOpening(name);
    if(!workerLedger[name]) workerLedger[name]={};
    workerLedger[name][entry.id]=entry;
}
function addNotification(name, title, body, meta={}){
    if(!notifications[name]) notifications[name]={};
    const id=uid('ntf');
    notifications[name][id]={id,title,body,time:new Date().toISOString(),read:false,...meta};
    return id;
}
function notificationMessage(name, title, body){
    const balance=workerBalance(name);
    return `🔔 ${title}\n\n${body}\n\nবর্তমান পাওনা: ৳${money(balance)}\n\nMT Management`;
}
function waLink(mobile, text){
    let m=String(mobile||'').replace(/\D/g,'');
    if(m.startsWith('0')) m='88'+m;
    if(m && !m.startsWith('88') && m.length===11) m='88'+m;
    return `https://wa.me/${m}?text=${encodeURIComponent(text)}`;
}

// Load the new module's data independently so old data remains compatible.
onValue(ref(db,'products'), s=>{ products=s.val()||{}; renderProductUI(); renderDailyProductSelect(); });
onValue(ref(db,'workerLedger'), s=>{ workerLedger=s.val()||{}; renderNewBalances(); renderUserNotifications(); renderAdminNotifications(); });
onValue(ref(db,'notifications'), s=>{ notifications=s.val()||{}; renderUserNotifications(); renderAdminNotifications(); });
onValue(ref(db,'companyLedger'), s=>{ companyLedger=s.val()||{}; });
onValue(ref(db,'openingBalances'), s=>{ openingBalances=s.val()||{}; renderNewBalances(); });

window.renderProductUI=function(){
    const box=document.getElementById('productRateInputs');
    if(box){
        box.innerHTML=workers.map(w=>`<div class="input-group"><label class="input-label">${esc(w)} — প্রতি পিস Worker Rate</label><input type="number" min="0" class="app-input prod-rate" data-worker="${esc(w)}" placeholder="0"></div>`).join('');
    }
    const list=document.getElementById('productList');
    if(list){
        const arr=Object.entries(products);
        list.innerHTML=arr.length?arr.map(([id,p])=>`<div class="card" style="padding:10px;margin-bottom:8px;border:1px solid #eee"><b>${esc(p.name)}</b><br><small>মোট মূল্য: ৳${money(p.totalRate)} / pcs</small><br><small>${Object.entries(p.workerRates||{}).map(([w,r])=>`${esc(w)}: ৳${money(r)}`).join(' • ')}</small><br><button class="del-btn" style="margin-top:6px" onclick="deleteProduct('${id}')">Delete</button></div>`).join(''):'<div style="color:#999">কোনো Product নেই</div>';
    }
};
window.renderDailyProductSelect=function(){
    const s=document.getElementById('dailyProdProduct'); if(!s)return;
    s.innerHTML='<option value="">Product নির্বাচন করুন</option>'+Object.entries(products).map(([id,p])=>`<option value="${id}">${esc(p.name)} — ৳${money(p.totalRate)}/pcs</option>`).join('');
    updateDailyPreview();
};
window.updateDailyPreview=function(){
    const id=document.getElementById('dailyProdProduct')?.value, q=Number(document.getElementById('dailyProdQty')?.value||0), box=document.getElementById('dailyProdPreview');
    if(!box)return;
    const p=products[id]; if(!p||!q){box.innerHTML='<span style="color:#999">Product ও Quantity দিলে স্বয়ংক্রিয় হিসাব এখানে দেখা যাবে।</span>';return;}
    box.innerHTML=`<b>${esc(p.name)} × ${q} pcs</b><br>Company Bill: <b>৳${money(q*Number(p.totalRate||0))}</b><br>${Object.entries(p.workerRates||{}).map(([w,r])=>`${esc(w)}: ৳${money(q*Number(r||0))}`).join('<br>')}`;
};
window.saveProduct=function(){
    const name=document.getElementById('productName').value.trim(); const total=Number(document.getElementById('productTotalRate').value||0);
    if(!name||total<=0)return alert('Product name ও মোট মূল্য দিন');
    const rates={}; document.querySelectorAll('.prod-rate').forEach(i=>{ const v=Number(i.value||0); if(v>0) rates[i.dataset.worker]=v; });
    if(!Object.keys(rates).length)return alert('কমপক্ষে একজন কর্মীর Rate দিন');
    const sum=Object.values(rates).reduce((a,b)=>a+Number(b),0);
    if(sum>total+0.0001)return alert(`Worker Rate মোট ৳${money(sum)}, কিন্তু Product মূল্য ৳${money(total)}। Worker rate মোট মূল্যের বেশি হতে পারবে না।`);
    const id=uid('product'); products[id]={id,name,totalRate:total,workerRates:rates,createdAt:new Date().toISOString()};
    set(ref(db,'products'),products); document.getElementById('productName').value='';document.getElementById('productTotalRate').value='';document.querySelectorAll('.prod-rate').forEach(i=>i.value='');
    alert('Product Save হয়েছে');
};
window.deleteProduct=function(id){if(confirm('এই Product মুছে ফেলবেন?')){delete products[id];set(ref(db,'products'),products);}};
window.saveDailyProduction=function(){
    const date=document.getElementById('dailyProdDate').value||today, pid=document.getElementById('dailyProdProduct').value, qty=Number(document.getElementById('dailyProdQty').value||0), p=products[pid];
    if(!p||qty<=0)return alert('Product এবং Quantity সঠিকভাবে দিন');
    const id=uid('prod'); const companyAmount=qty*Number(p.totalRate||0);
    const entry={id,date,productId:pid,productName:p.name,qty,totalRate:Number(p.totalRate||0),companyAmount,createdAt:new Date().toISOString()};
    Object.entries(p.workerRates||{}).forEach(([name,rate])=>{
        const amount=qty*Number(rate||0); if(amount<=0)return; pushLedger(name,{id:uid('earn'),date,type:'earning',category:'production',amount,productId:pid,productName:p.name,qty,rate:Number(rate||0),sourceId:id});
        // Legacy compatibility: keep old account totals updated.
        if(!accounts[name])accounts[name]={bill:0,cost:0}; accounts[name].bill=Number(accounts[name].bill||0)+amount;
        const msg=notificationMessage(name,'আজকের কাজ যোগ হয়েছে',`${p.name}: ${qty} pcs\nআপনার Rate: ৳${money(rate)}/pcs\nআজকের উপার্জন: ৳${money(amount)}`);
        addNotification(name,'আজকের কাজ যোগ হয়েছে',msg,{sourceId:id,category:'production'});
    });
    const clid=uid('company'); companyLedger[clid]={id:clid,date,type:'invoice',productId:pid,productName:p.name,qty,amount:companyAmount};
    histories.userWork=histories.userWork||[]; histories.userWork.unshift({id:Date.now(),date,names:Object.keys(p.workerRates||{}),s:qty,d:0,totalTk:Object.values(p.workerRates||{}).reduce((a,r)=>a+qty*Number(r),0),details:Object.entries(p.workerRates||{}).map(([name,r])=>({name,bill:qty*Number(r)})),productName:p.name});
    update(ref(db,'/'),{accounts,workerLedger,notifications,openingBalances,companyLedger,histories});
    document.getElementById('dailyProdQty').value=''; alert('Production ও সব কর্মীর হিসাব তৈরি হয়েছে।');
};

window.saveMoney=function(type){
    const idP=type==='nasta'?'nWorkers':'lWorkers', idA=type==='nasta'?'nAmount':'lAmount', idD=type==='nasta'?'nDate':'lDate', idN=type==='nasta'?'nNote':'lNote';
    const selected=Array.from(document.querySelectorAll(`#${idP} .selected`)).map(e=>e.innerText), amt=Number(document.getElementById(idA).value||0);
    if(!selected.length||amt<=0)return alert('কর্মী ও টাকার পরিমাণ দিন');
    const per=amt/selected.length;
    selected.forEach(name=>{
        pushLedger(name,{id:uid('ded'),date:document.getElementById(idD).value||today,type:'deduction',category:type==='loan'?'payment':'advance',amount:per,note:document.getElementById(idN).value||''});
        if(!accounts[name])accounts[name]={bill:0,cost:0}; accounts[name].cost=Number(accounts[name].cost||0)+per;
        const title=type==='loan'?'Payment Update':'Advance/খরচ Update';
        const msg=notificationMessage(name,title,`${type==='loan'?'Payment':'Advance'}: ৳${money(per)}\nবিবরণ: ${document.getElementById(idN).value||'—'}`);
        addNotification(name,title,msg,{category:type==='loan'?'payment':'advance'});
    });
    histories[type]=histories[type]||[]; histories[type].unshift({id:Date.now(),date:document.getElementById(idD).value||today,names:selected,amount:amt,perHead:per,note:document.getElementById(idN).value||''});
    update(ref(db,'/'),{accounts,workerLedger,notifications,openingBalances,histories});
    document.querySelectorAll(`#${idP} .selected`).forEach(e=>e.classList.remove('selected'));document.getElementById(idA).value='';document.getElementById(idN).value='';alert('হিসাব Save হয়েছে এবং Notification তৈরি হয়েছে।');
};

window.saveCompanyData=function(){
    const date=document.getElementById('cDate').value||today, amount=Number(document.getElementById('cAmount').value||0), note=document.getElementById('cNote').value||'';
    if(amount<=0)return alert('টাকার পরিমাণ দিন');
    const id=uid('company');companyLedger[id]={id,date,type:'payment',amount,note};
    histories.company=histories.company||[];histories.company.unshift({id:Date.now(),date,type:'in',amount,note});
    set(ref(db,'companyLedger'),companyLedger);set(ref(db,'histories/company'),histories.company);
    document.getElementById('cAmount').value='';document.getElementById('cNote').value='';alert('কোম্পানি Payment Save হয়েছে।');
};

window.renderNewBalances=function(){
    const body=document.getElementById('finalBalanceBody'); if(!body)return;
    body.innerHTML=workers.map(w=>{const t=workerTotals(w);return `<tr><td>${esc(w)}</td><td>${money(t.base+t.earn)}</td><td>${money(t.ded)}</td><td style="font-weight:bold;color:${t.balance<0?'#d63031':'#00b894'}">${money(t.balance)}</td></tr>`}).join('');
    const totalEarn=workers.reduce((a,w)=>a+workerTotals(w).earn,0), totalDed=workers.reduce((a,w)=>a+workerTotals(w).ded,0), base=workers.reduce((a,w)=>a+workerTotals(w).base,0);
    if(document.getElementById('admTotWork'))document.getElementById('admTotWork').innerText=money(base+totalEarn);
    if(document.getElementById('admTotTaken'))document.getElementById('admTotTaken').innerText=money(totalDed);
    if(document.getElementById('admTotDue'))document.getElementById('admTotDue').innerText=money(base+totalEarn-totalDed);
};
window.renderUserNotifications=function(){
    const box=document.getElementById('userNotificationList');if(!box||!userNow)return;
    const arr=Object.values(notifications?.[userNow]||{}).sort((a,b)=>new Date(b.time)-new Date(a.time)).slice(0,5);
    box.innerHTML=arr.length?arr.map(n=>`<div style="padding:8px 0;border-bottom:1px solid #eee"><b>${esc(n.title)}</b><div style="font-size:12px;color:#555;white-space:pre-line">${esc(n.body)}</div><small style="color:#999">${new Date(n.time).toLocaleString('bn-BD')}</small></div>`).join(''):'<div style="color:#999;font-size:13px">নতুন কোনো হিসাব আপডেট নেই।</div>';
    const latest=arr[0]; if(latest&&lastNotificationIds[userNow]&&lastNotificationIds[userNow]!==latest.id){
        if('Notification' in window&&Notification.permission==='granted')new Notification(latest.title,{body:latest.body.slice(0,180)});
    } if(latest)lastNotificationIds[userNow]=latest.id;
};
window.renderAdminNotifications=function(){
    const box=document.getElementById('adminNotificationList');if(!box)return;
    const arr=[];Object.entries(notifications||{}).forEach(([name,obj])=>Object.values(obj||{}).forEach(n=>arr.push({...n,name})));
    arr.sort((a,b)=>new Date(b.time)-new Date(a.time));
    box.innerHTML=arr.slice(0,20).map(n=>`<div style="padding:9px 0;border-bottom:1px solid #eee"><b>${esc(n.name)} — ${esc(n.title)}</b><div style="font-size:12px;white-space:pre-line;color:#555">${esc(n.body)}</div><button onclick="openWorkerWhatsApp('${esc(n.name)}')" style="display:inline-block;margin-top:5px;color:#25D366;border:0;background:transparent">💬 WhatsApp</button></div>`).join('')||'<div style="color:#999">কোনো notification নেই।</div>';
};
window.requestBrowserNotification=function(){
    if(!('Notification' in window))return alert('এই ব্রাউজারে Notification নেই');
    Notification.requestPermission().then(x=>alert(x==='granted'?'Notification চালু হয়েছে':'Notification অনুমতি দেওয়া হয়নি'));
};
window.openWorkerWhatsApp=function(name){
    const mob=Object.keys(approvedUsers||{}).find(k=>approvedUsers[k]?.name===name);const phone=mob?approvedUsers[mob].mob:'';
    const t=workerTotals(name);const msg=`${name} — হিসাব আপডেট\nমোট কাজ/পাওনা: ৳${money(t.base+t.earn)}\nAdvance/Payment: ৳${money(t.ded)}\nবর্তমান পাওনা: ৳${money(t.balance)}`;
    if(!phone)return alert('এই কর্মীর মোবাইল নম্বর পাওয়া যায়নি');window.open(waLink(phone,msg),'_blank');
};

// Friday summary generator. It can be opened from the Admin notification screen.
window.generateWeeklySummary=function(){
    const now=new Date(); const day=now.getDay(); // Saturday=6, Sunday=0 ... Thursday=4
    const daysSinceSat=(day===6?0:day+1);
    const start=new Date(now); start.setHours(0,0,0,0); start.setDate(now.getDate()-daysSinceSat);
    const end=new Date(start); end.setDate(start.getDate()+5); end.setHours(23,59,59,999);
    const iso=d=>d.toISOString().slice(0,10), from=iso(start), to=iso(end);
    const names=workers.map(name=>{
        let weekEarn=0,weekDed=0; Object.values(workerLedger?.[name]||{}).forEach(x=>{if(String(x.date)>=from&&String(x.date)<=to){if(x.type==='earning')weekEarn+=Number(x.amount||0);else weekDed+=Number(x.amount||0);}});
        const t=workerTotals(name); return `${name}\nএই সপ্তাহের কাজ: ৳${money(weekEarn)}\nএই সপ্তাহে Advance/Payment: ৳${money(weekDed)}\nবর্তমান মোট বাকি: ৳${money(t.balance)}`;
    }).join('\n\n');
    const inv=Object.values(companyLedger||{}).filter(x=>x.type==='invoice'&&String(x.date)>=from&&String(x.date)<=to).reduce((a,x)=>a+Number(x.amount||0),0);
    const pay=Object.values(companyLedger||{}).filter(x=>x.type==='payment'&&String(x.date)>=from&&String(x.date)<=to).reduce((a,x)=>a+Number(x.amount||0),0);
    return `📊 সাপ্তাহিক হিসাব (${from} → ${to})\n\n${names}\n\nকোম্পানি Bill: ৳${money(inv)}\nকোম্পানি Payment: ৳${money(pay)}\nএই সপ্তাহের কোম্পানি বাকি: ৳${money(inv-pay)}`;
};


const _oldOpenAdminReport=window.openAdminReport;
window.openAdminReport=function(type){
    if(type!=='newProduction'){_oldOpenAdminReport(type);return;}
    const rows=[];
    Object.values(workerLedger||{}).forEach(obj=>Object.values(obj||{}).forEach(x=>{if(x.category==='production')rows.push(x);}));
    rows.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    const grouped={}; rows.forEach(x=>{const k=x.sourceId||x.id;if(!grouped[k])grouped[k]={date:x.date,product:x.productName,qty:x.qty,workers:[],total:0};grouped[k].workers.push(x.name||'');grouped[k].total+=Number(x.amount||0);});
    let html=`<table class="data-table"><thead><tr><th>Date</th><th>Product</th><th>Qty</th><th>Workers</th><th>Worker Bill</th></tr></thead><tbody>`;
    Object.values(grouped).forEach(x=>html+=`<tr><td>${esc(x.date)}</td><td>${esc(x.product)}</td><td>${money(x.qty)}</td><td><small>${x.workers.map(esc).join(', ')}</small></td><td>${money(x.total)}</td></tr>`);
    html+='</tbody></table>';
    document.getElementById('repTitle').innerText='Daily Production Report';document.getElementById('repContent').innerHTML=html;document.getElementById('reportModal').classList.remove('hidden');
};
// Product preview listeners and date defaults.
document.addEventListener('input',e=>{if(e.target.id==='dailyProdQty')updateDailyPreview();});
document.addEventListener('change',e=>{if(e.target.id==='dailyProdProduct')updateDailyPreview();});
const _oldErAdminAll=window.erAdminAll;
window.erAdminAll=function(){ _oldErAdminAll(); renderProductUI();renderDailyProductSelect();renderNewBalances();renderAdminNotifications(); };
const _oldErUserPanel=window.erUserPanel;
window.erUserPanel=function(){ _oldErUserPanel();renderUserNotifications();requestBrowserNotificationSilent(); };
function requestBrowserNotificationSilent(){ if('Notification' in window&&Notification.permission==='default'){} }
