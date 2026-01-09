const ROLES_LIST = [
    "Ketua", "Wakil", "Sekretaris", "Bendahara", 
    "Ketertiban", "Kerapian", "Kebersihan", "Perlengkapan"
];

let appData = {
    roles: [],
    students: [], 
    nominations: {}, 
    voting: {}       
};

let tempStudentName = "";
let activeRole = ""; 
let onModalCloseCallback = null;

document.addEventListener('DOMContentLoaded', () => {
    const booth = document.getElementById('screen-voting-booth');
    const modal = document.getElementById('custom-modal');
    
    if (modal && modal.parentNode !== document.body) {
        document.body.appendChild(modal);
    }

    loadSystemData();
    initDataStructure();
    renderRoleList();
    renderPhase1RoleButtons();
    renderPhase2Dashboard();
});

function loadSystemData() {
    const stored = localStorage.getItem('tpa_election_v8_final');
    if (stored) {
        appData = JSON.parse(stored);
    }
}

function saveSystemData() {
    localStorage.setItem('tpa_election_v8_final', JSON.stringify(appData));
}

function initDataStructure() {
    appData.roles.forEach(role => {
        if (!appData.nominations[role]) appData.nominations[role] = [];
        if (!appData.voting[role]) {
            appData.voting[role] = { candidates: [], votes: {} };
        }
    });
}

function resetSystemData() {
    localStorage.removeItem('tpa_election_v8_final');
    location.reload();
}

function goToScreen(screenId) {
    document.querySelectorAll('.screen')
        .forEach(el => el.classList.remove('active'));

    document.getElementById(screenId).classList.add('active');

    if (screenId === 'screen-phase1-student-list') {
    renderStudentSelectList();
    }
}

function openPeminatan() {
    if (appData.roles.length === 0) {
        showCustomModal(
            "Belum Bisa",
            "Silakan tambahkan jabatan terlebih dahulu.",
            "error"
        );
        return;
    }

    goToScreen('screen-phase1-students');
}

function addRole() {
    const input = document.getElementById('input-role-name');
    const role = input.value.trim();

    if (!role) return;

    if (appData.roles.includes(role)) {
        showCustomModal("Gagal", "Jabatan sudah ada.", "error");
        return;
    }

    appData.roles.push(role);
    appData.nominations[role] = [];
    appData.voting[role] = { candidates: [], votes: {} };

    saveSystemData();
    input.value = "";

    renderRoleList();
    renderPhase1RoleButtons();
    renderPhase2Dashboard();
}

function renderRoleList() {
    const ul = document.getElementById('list-roles');
    ul.innerHTML = "";

    if (appData.roles.length === 0) {
        ul.innerHTML = `
            <li style="color:#999; justify-content:center;">
                Belum ada jabatan.
            </li>
        `;
        return;
    }

    appData.roles.forEach((role, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${role}</span>
            <i class="fas fa-times" onclick="deleteRole(${index})"
               style="cursor:pointer;color:red"></i>
        `;
        ul.appendChild(li);
    });
}

function deleteRole(index) {
    const role = appData.roles[index];

    if (!confirm(`Hapus jabatan ${role}?`)) return;

    appData.roles.splice(index, 1);
    delete appData.nominations[role];
    delete appData.voting[role];

    saveSystemData();

    renderRoleList();
    renderPhase1RoleButtons();
    renderPhase2Dashboard();
}

function addStudent() {
    const input = document.getElementById('input-student-name');
    const name = input.value.trim();

    if (!name) return;

    if (appData.students.some(s => s.name === name)) {
        showCustomModal("Gagal", "Nama sudah ada.", "error");
        return;
    }

    appData.students.push({ name, chosen: false });
    saveSystemData();
    input.value = "";
    renderStudentList();
}

function renderStudentList() {
    const ul = document.getElementById('list-students');
    ul.innerHTML = "";

    if (appData.students.length === 0) {
        ul.innerHTML = `
            <li style="color:#999; justify-content:center;">
                Belum ada santri.
            </li>
        `;
        return;
    }

    appData.students.forEach((s, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${s.name}</span>
            <i class="fas fa-times"
               style="color:red; cursor:pointer"
               onclick="deleteStudent(${index})"></i>
        `;
        ul.appendChild(li);
    });
}

function deleteStudent(index) {
    if (!confirm("Hapus santri ini?")) return;

    const name = appData.students[index].name;

    // hapus dari daftar santri
    appData.students.splice(index, 1);

    // hapus dari semua peminatan (jaga konsistensi)
    appData.roles.forEach(role => {
        appData.nominations[role] =
            appData.nominations[role].filter(n => n !== name);
    });

    saveSystemData();
    renderStudentList();
}

let activeStudentIndex = null;

function openStudentChoice(index) {
    if (appData.roles.length === 0) {
        showCustomModal(
            "Belum Bisa",
            "Belum ada jabatan yang bisa dipilih.",
            "error"
        );
        return;
    }

    activeStudentIndex = index;
    const student = appData.students[index];
    document.getElementById('greet-santri').innerText = `Halo, ${student.name}!`;
    goToScreen('screen-phase1-choose');
}

function startPeminatan() {
    if (appData.students.length === 0) {
        showCustomModal(
            "Belum Bisa",
            "Tambahkan santri terlebih dahulu.",
            "error"
        );
        return;
    }

    goToScreen('screen-phase1-student-list');
}

function renderStudentSelectList() {
    const ul = document.getElementById('list-students-select');
    ul.innerHTML = "";

    appData.students.forEach((s, index) => {
        const li = document.createElement('li');

        li.innerHTML = `
            <span>${s.name}</span>
            <span style="font-size:.8rem; color:${s.chosen ? 'green' : '#999'}">
                ${s.chosen ? '✔ Sudah memilih' : 'Belum memilih'}
            </span>
        `;

        if (!s.chosen) {
            li.style.cursor = "pointer";
            li.onclick = () => openStudentChoice(index);
        } else {
            li.style.opacity = "0.6";
        }

        ul.appendChild(li);
    });
}

function submitPhase1Choice(role) {
    const student = appData.students[activeStudentIndex];

    if (role !== 'Tidak Menjabat') {
        appData.nominations[role].push(student.name);
    }

    student.chosen = true;
    saveSystemData();

    showCustomModal(
        "Tersimpan",
        `${student.name} telah memilih.`,
        "success",
        () => {
            goToScreen('screen-phase1-student-list');
            renderStudentSelectList();
        }
    );
}

function processPhase1Name() {
    const input = document.getElementById('input-santri-name');
    const name = input.value.trim();
    
    if (!name) {
        showCustomModal("Ups", "Isi nama dulu!", "error");
        return;
    }
    
    tempStudentName = name;
    document.getElementById('greet-santri').innerText = `Halo, ${name}!`;
    input.value = ""; 
    goToScreen('screen-phase1-choose');
}

function renderPhase1RoleButtons() {
    const container = document.getElementById('container-roles-p1');
    container.innerHTML = "";
    
    appData.roles.forEach(role => {
        const btn = document.createElement('button');
        btn.className = 'role-btn-p1';
        btn.innerHTML = `${role}`;
        btn.onclick = () => submitPhase1Choice(role);
        container.appendChild(btn);
    });
}

function showPhase1Results() {
    const list = document.getElementById('list-results-p1');
    list.innerHTML = "";

    let totalPeminat = 0;

    appData.roles.forEach(role => {
        totalPeminat += appData.nominations[role].length;
    });

    // ✅ JIKA BELUM ADA PEMINAT SAMA SEKALI
    if (totalPeminat === 0) {
        list.innerHTML = `
            <div style="
                text-align:center;
                color:#999;
                padding:20px;
                font-size:0.95rem;
            ">
                Belum ada peminat.
            </div>
        `;
        goToScreen('screen-phase1-results');
        return;
    }

    // ✅ JIKA SUDAH ADA PEMINAT
    appData.roles.forEach(role => {
        const names = appData.nominations[role].join(", ");
        const count = appData.nominations[role].length;

        const div = document.createElement('div');
        div.innerHTML = `
            <strong>${role} (${count})</strong><br>
            <small>${names || '-'}</small>
        `;
        list.appendChild(div);
    });

    goToScreen('screen-phase1-results');
}

function resetPeminatan() {
    if (!confirm("Reset seluruh peminatan? Semua santri bisa memilih ulang.")) {
        return;
    }

    // 1. Reset status santri
    appData.students.forEach(s => {
        s.chosen = false;
    });

    // 2. Kosongkan semua peminatan per jabatan
    appData.roles.forEach(role => {
        appData.nominations[role] = [];
    });

    saveSystemData();

    showCustomModal(
        "Berhasil",
        "Peminatan telah direset.",
        "success",
        () => {
            showPhase1Results();
        }
    );
}

function renderPhase2Dashboard() {
    const list = document.getElementById('list-roles-p2');
    list.innerHTML = "";

    if (appData.roles.length === 0) {
        list.innerHTML = `
            <div style="
                text-align:center;
                color:#999;
                padding:20px;
                font-size:0.95rem;
            ">
                Belum ada jabatan.
            </div>
        `;
        return;
    }

    appData.roles.forEach(role => {
        const div = document.createElement('div');
        const count =
            appData.voting[role].candidates.length > 0
                ? appData.voting[role].candidates.length
                : (appData.nominations[role]?.length || 0);

        div.innerHTML = `
            <span>${role}</span>
            <span style="
                background:#dfe6e9;
                padding:5px 10px;
                border-radius:10px;
                font-size:0.8rem;
            ">
                ${count} Calon
            </span>
        `;

        div.onclick = () => setupVotingScreen(role);
        list.appendChild(div);
    });
}

function setupVotingScreen(role) {
    if (
        appData.nominations[role] &&
        appData.nominations[role].length > 0 &&
        appData.voting[role].candidates.length === 0
    ) {
        appData.nominations[role].forEach(name => {
            appData.voting[role].candidates.push(name);
            appData.voting[role].votes[name] = 0;
        });

        saveSystemData();
    }

    activeRole = role;
    
    const titleEl = document.getElementById('judul-setup-jabatan');
    if(titleEl) titleEl.innerText = role;

    renderCandidateList();
    goToScreen('screen-phase2-setup');
}

function addCandidateAction() {
    const input = document.getElementById('input-candidate');
    const name = input.value.trim();
    
    if(!name) return;
    
    if(appData.voting[activeRole].candidates.includes(name)) {
        showCustomModal("Gagal", "Nama sudah ada.", "error");
        return;
    }

    appData.voting[activeRole].candidates.push(name);
    if(appData.voting[activeRole].votes[name] === undefined) {
        appData.voting[activeRole].votes[name] = 0;
    }
    
    saveSystemData();
    input.value = "";
    renderCandidateList();
    renderPhase2Dashboard();
}

function renderCandidateList() {
    const ul = document.getElementById('list-candidates-setup');
    ul.innerHTML = "";
    const candidates = appData.voting[activeRole].candidates;
    
    if(candidates.length === 0) {
        ul.innerHTML = "<li style='color:#999; justify-content:center'>Belum ada kandidat.</li>";
        return;
    }

    candidates.forEach((name, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${name}</span> <i class="fas fa-times" style="color:red; cursor:pointer;" onclick="deleteCandidate(${index})"></i>`;
        ul.appendChild(li);
    });
}

function deleteCandidate(index) {
    const name = appData.voting[activeRole].candidates[index];
    appData.voting[activeRole].candidates.splice(index, 1);
    delete appData.voting[activeRole].votes[name];
    saveSystemData();
    renderCandidateList();
    renderPhase2Dashboard();
}

function startVotingSession() {
    const candidates = appData.voting[activeRole].candidates;
    
    if(candidates.length < 1) {
        showCustomModal("Ups", "Minimal 1 kandidat!", "error");
        return;
    }

    document.getElementById('judul-bilik-suara').innerText = activeRole.toUpperCase();
    
    renderVotingButtons();
    goToScreen('screen-voting-booth');
}

function renderVotingButtons() {
    const container = document.getElementById('container-voting-buttons');
    container.innerHTML = "";
    const candidates = appData.voting[activeRole].candidates;

    candidates.forEach(name => {
        const btn = document.createElement('button');
        btn.className = 'vote-btn';
        btn.innerText = name;
        
        btn.onclick = function() {
            castVote(name);
        };
        
        container.appendChild(btn);
    });
}

let voteLocked = false;

function castVote(name) {
    if(voteLocked) return;
    voteLocked = true;

    appData.voting[activeRole].votes[name]++;
    saveSystemData();

    setTimeout(() => voteLocked = false, 3000);

    showCustomModal("Suara Masuk!", `Pilihan untuk ${name} dicatat.`, "success");
}

function adminExitVoting() {
    const pass = prompt("PIN Admin:", "");
    if(pass === "1234") {
        showFinalResults();
    } else if (pass !== null) {
        alert("PIN Salah!");
    }
}

function showFinalResults() {
    document.getElementById('judul-hasil-jabatan').innerText = "Jabatan: " + activeRole;
    
    const container = document.getElementById('chart-area');
    container.innerHTML = "";
    
    const data = appData.voting[activeRole];
    let total = 0;
    
    for(let key in data.votes) total += data.votes[key];
    
    const sorted = Object.keys(data.votes).sort((a,b) => data.votes[b] - data.votes[a]);

    if(total === 0 && sorted.length === 0) {
        container.innerHTML = "<p style='text-align:center'>Belum ada suara.</p>";
    } else {
        sorted.forEach(name => {
            const votes = data.votes[name];
            const pct = total === 0 ? 0 : Math.round((votes/total)*100);
            
            const div = document.createElement('div');
            div.className = "bar-item";
            div.innerHTML = `
                <div class="bar-label">
                    <span>${name}</span> 
                    <span>${votes} Suara (${pct}%)</span>
                </div>
                <div class="bar-bg">
                    <div class="bar-fill" style="width:${pct}%"></div>
                </div>
            `;
            container.appendChild(div);
        });
    }
    
    goToScreen('screen-voting-result');
}

function resetVotingForRole() {
    showCustomModal(
        "Konfirmasi",
        `Reset seluruh suara untuk jabatan ${activeRole}?`,
        "error",
        () => {
            // reset semua suara
            appData.voting[activeRole].candidates.forEach(name => {
                appData.voting[activeRole].votes[name] = 0;
            });

            saveSystemData();

            // tetap di halaman hasil voting
            showFinalResults();
        }
    );
}

function showCustomModal(title, msg, type, callback) {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-message').innerText = msg;
    const icon = document.getElementById('modal-icon-type');
    
    if(type === 'success') {
        icon.style.background = '#55efc4';
        icon.innerHTML = '<i class="fas fa-check"></i>';
    } else if (type === 'error') {
        icon.style.background = '#ff7675';
        icon.innerHTML = '<i class="fas fa-times"></i>';
    }
    
    onModalCloseCallback = callback;
    
    const modal = document.getElementById('custom-modal');
    modal.style.zIndex = "99999999"; 
    modal.classList.add('show');
}

function closeCustomModal() {
    document.getElementById('custom-modal').classList.remove('show');
    if(onModalCloseCallback) {
        onModalCloseCallback();
        onModalCloseCallback = null;
    }
}

function adminResetData() {
    const pass = prompt("PIN Admin:");
    if (pass === "1234") {
        resetSystemData();
    } else if (pass !== null) {
        alert("PIN salah!");
    }
}

function confirmResetSystem() {
    showCustomModal(
        "Konfirmasi Reset",
        "Semua data (jabatan, santri, peminatan, dan voting) akan dihapus. Lanjutkan?",
        "error",
        () => {
            resetSystemData();
        }
    );
}