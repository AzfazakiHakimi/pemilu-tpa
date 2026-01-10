let appData = {
    roles: [],
    students: [],
    nominations: {},
    voting: {}
};

let activeRole = "";
let activeStudentIndex = null;
let modalCallback = null;

document.addEventListener("DOMContentLoaded", () => {
    loadSystemData();
    initDataStructure();
    renderRoleList();
    renderStudentList();
    renderPhase1RoleButtons();
    renderPhase2Dashboard();
});

function loadSystemData() {
    const stored = localStorage.getItem("tpa_election_v8_final");
    if (stored) appData = JSON.parse(stored);
}

function saveSystemData() {
    localStorage.setItem("tpa_election_v8_final", JSON.stringify(appData));
}

function initDataStructure() {
    if (!appData.nominations["Tidak Menjabat"]) {
        appData.nominations["Tidak Menjabat"] = [];
    }

    appData.roles.forEach(role => {
        if (!appData.nominations[role]) appData.nominations[role] = [];
        if (!appData.voting[role]) appData.voting[role] = { candidates: [], votes: {} };
    });
}

function goToScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(id).classList.add("active");

    if (id === "screen-phase1-student-list") {
        renderStudentSelectList();
    } 
    else if (id === "screen-phase2-dashboard") {
        renderPhase2Dashboard();
    }
    else if (id === "screen-phase1-results") {
        renderPhase1Data();
    }
}

function openPeminatan() {
    if (appData.roles.length === 0) {
        showModal("Belum Bisa", "Tambahkan jabatan terlebih dahulu.", "error");
        return;
    }
    goToScreen("screen-phase1-students");
}

function addRole() {
    const input = document.getElementById("input-role-name");
    const role = input.value.trim();
    if (!role || appData.roles.includes(role)) return;

    appData.roles.push(role);
    appData.nominations[role] = [];
    appData.voting[role] = { candidates: [], votes: {} };

    input.value = "";
    saveSystemData();
    renderRoleList();
    renderPhase1RoleButtons();
    renderPhase2Dashboard();
}

function renderRoleList() {
    const ul = document.getElementById("list-roles");
    ul.innerHTML = "";

    if (appData.roles.length === 0) {
        ul.innerHTML = "<li style='color:#999;justify-content:center'>Belum ada jabatan.</li>";
        return;
    }

    appData.roles.forEach((role, i) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${role}</span><i class="fas fa-times" style="color:red;cursor:pointer" onclick="deleteRole(${i})"></i>`;
        ul.appendChild(li);
    });
}

function deleteRole(i) {
    showConfirm("Hapus Jabatan", "Jabatan akan dihapus.", () => {
        const role = appData.roles[i];
        appData.roles.splice(i, 1);
        delete appData.nominations[role];
        delete appData.voting[role];
        saveSystemData();
        renderRoleList();
        renderPhase1RoleButtons();
        renderPhase2Dashboard();
        showModal("Berhasil", "Jabatan dihapus.", "success");
    });
}

function addStudent() {
    const input = document.getElementById("input-student-name");
    const name = input.value.trim();
    if (!name || appData.students.some(s => s.name === name)) return;

    appData.students.push({ name, chosen: false });
    input.value = "";
    saveSystemData();
    renderStudentList();
}

function renderStudentList() {
    const ul = document.getElementById("list-students");
    ul.innerHTML = "";

    if (appData.students.length === 0) {
        ul.innerHTML = "<li style='color:#999;justify-content:center'>Belum ada santri.</li>";
        return;
    }

    appData.students.forEach((s, i) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${s.name}</span><i class="fas fa-times" style="color:red;cursor:pointer" onclick="deleteStudent(${i})"></i>`;
        ul.appendChild(li);
    });
}

function deleteStudent(i) {
    showConfirm("Hapus Santri", "Santri akan dihapus.", () => {
        const name = appData.students[i].name;
        appData.students.splice(i, 1);

        appData.roles.forEach(r => {
            appData.nominations[r] = appData.nominations[r].filter(n => n !== name);
        });

        if (appData.nominations["Tidak Menjabat"]) {
            appData.nominations["Tidak Menjabat"] = appData.nominations["Tidak Menjabat"].filter(n => n !== name);
        }

        saveSystemData();
        renderStudentList();
        showModal("Berhasil", "Santri dihapus.", "success");
    });
}

function startPeminatan() {
    if (appData.students.length === 0) {
        showModal("Belum Bisa", "Tambahkan santri terlebih dahulu.", "error");
        return;
    }
    
    renderPhase2Dashboard();

    goToScreen("screen-phase1-student-list");
}

function renderStudentSelectList() {
    const ul = document.getElementById("list-students-select");
    ul.innerHTML = "";

    appData.students.forEach((s, i) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${s.name}</span><span style="font-size:.8rem;color:${s.chosen ? 'green' : '#999'}">${s.chosen ? "✔ Sudah memilih" : "Belum memilih"}</span>`;
        if (!s.chosen) li.onclick = () => openStudentChoice(i);
        else li.style.opacity = "0.6";
        ul.appendChild(li);
    });
}

function openStudentChoice(i) {
    activeStudentIndex = i;
    document.getElementById("greet-santri").innerText = `Halo, ${appData.students[i].name}!`;
    goToScreen("screen-phase1-choose");
}

function renderPhase1RoleButtons() {
    const c = document.getElementById("container-roles-p1");
    c.innerHTML = "";
    appData.roles.forEach(r => {
        const b = document.createElement("button");
        b.className = "role-btn-p1";
        b.innerText = r;
        b.onclick = () => submitPhase1Choice(r);
        c.appendChild(b);
    });
}

function submitPhase1Choice(role) {
    const s = appData.students[activeStudentIndex];
    
    if (role === "Tidak Menjabat") {
        if (!appData.nominations["Tidak Menjabat"]) appData.nominations["Tidak Menjabat"] = [];
        appData.nominations["Tidak Menjabat"].push(s.name);
    } else {
        appData.nominations[role].push(s.name);
    }

    s.chosen = true;
    saveSystemData();

    renderPhase2Dashboard(); 

    showModal("Tersimpan", `${s.name} telah memilih.`, "success", () => {
        goToScreen("screen-phase1-student-list");
        renderStudentSelectList();
    });
}

function renderPhase1Data() {
    const list = document.getElementById("list-results-p1");
    list.innerHTML = "";

    const noRoleArray = appData.nominations["Tidak Menjabat"] || [];
    const hasData = appData.roles.some(r => (appData.nominations[r] && appData.nominations[r].length > 0)) || noRoleArray.length > 0;

    if (!hasData) {
        list.innerHTML = "<p style='text-align:center; color:#999;'>Belum ada data peminat.</p>";
        return;
    }

    appData.roles.forEach(r => {
        const names = appData.nominations[r] || [];
        
        if (names.length > 0) {
            const div = document.createElement("div");
            div.innerHTML = `
                <strong style="display:block; font-size:1.1rem; margin-bottom:5px;">${r}</strong>
                <span style="color:#555;">${names.join(", ")}</span>
            `;
            list.appendChild(div);
        }
    });

    if (noRoleArray.length > 0) {
        const div = document.createElement("div");
        div.innerHTML = `
            <strong style="display:block; font-size:1.1rem; margin-bottom:5px; color: #a29bfe;">Tidak Menjabat</strong>
            <span style="color:#555;">${noRoleArray.join(", ")}</span>
        `;
        list.appendChild(div);
    }
}

function showPhase1Results() {
    goToScreen("screen-phase1-results");
}

function resetPeminatan() {
    showConfirm("Reset Peminatan", "Calon dari hasil peminatan akan dihapus, tetapi calon manual tetap ada.", () => {
        appData.students.forEach(s => s.chosen = false);
        appData.roles.forEach(role => {
            const listPeminat = appData.nominations[role].map(siswa => siswa.nama); 

            if (appData.voting[role] && appData.voting[role].candidates) {
                appData.voting[role].candidates = appData.voting[role].candidates.filter(kandidat => {
                    const namaKandidat = (typeof kandidat === 'object') ? kandidat.nama : kandidat;
                    
                    return !listPeminat.includes(namaKandidat);
                });
            }

            appData.nominations[role] = [];
        });
        
        appData.nominations["Tidak Menjabat"] = [];
        
        saveSystemData();
        renderPhase2Dashboard(); 

        if(typeof renderPhase1Data === 'function') {
            renderPhase1Data(); 
        }

        showModal("Berhasil", "Peminatan direset.", "success");
    });
}

function renderPhase2Dashboard() {
    const list = document.getElementById("list-roles-p2");
    list.innerHTML = "";

    if (appData.roles.length === 0) {
        list.innerHTML = "<div style='text-align:center;color:#999;padding:20px'>Belum ada jabatan.</div>";
        return;
    }

    appData.roles.forEach(r => {
        const officialCandidates = appData.voting[r].candidates.length;
        const potentialCandidates = appData.nominations[r] ? appData.nominations[r].length : 0;
        const count = officialCandidates > 0 ? officialCandidates : potentialCandidates;
        const badgeColor = count > 0 ? "#55efc4" : "#dfe6e9"; 
        const d = document.createElement("div");
        const textColor = count > 0 ? "#2d3436" : "#636e72";

        d.innerHTML = `
            <span>${r}</span>
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="background:${badgeColor}; padding:5px 12px; border-radius:15px; font-size:.75rem; font-weight:bold; color:${textColor};">
                    ${count} calon
                </span>
                <i class="fas fa-chevron-right" style="color:#b2bec3"></i>
            </div>
        `;
        
        d.onclick = () => setupVotingScreen(r);
        list.appendChild(d);
    });
}

function setupVotingScreen(role) {
    if (appData.nominations[role].length && appData.voting[role].candidates.length === 0) {
        appData.nominations[role].forEach(n => {
            appData.voting[role].candidates.push(n);
            appData.voting[role].votes[n] = 0;
        });
        saveSystemData();
    }
    activeRole = role;
    document.getElementById("judul-setup-jabatan").innerText = role;
    renderCandidateList();
    goToScreen("screen-phase2-setup");
}

function addCandidateAction() {
    const input = document.getElementById("input-candidate");
    const name = input.value.trim();

    if (!name) return;

    const candidates = appData.voting[activeRole].candidates;

    if (candidates.includes(name)) {
        showModal("Duplikat", "Nama calon sudah ada.", "error");
        return;
    }

    candidates.push(name);
    appData.voting[activeRole].votes[name] = 0;

    input.value = "";
    saveSystemData();
    renderCandidateList();
    renderPhase2Dashboard();
}

function renderCandidateList() {
    const ul = document.getElementById("list-candidates-setup");
    ul.innerHTML = "";
    const c = appData.voting[activeRole].candidates;
    if (!c.length) {
        ul.innerHTML = "<li style='color:#999;justify-content:center'>Belum ada kandidat.</li>";
        return;
    }
    c.forEach((n, i) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${n}</span><i class="fas fa-times" style="color:red;cursor:pointer" onclick="deleteCandidate(${i})"></i>`;
        ul.appendChild(li);
    });
}

function deleteCandidate(i) {
    const name = appData.voting[activeRole].candidates[i];
    appData.voting[activeRole].candidates.splice(i, 1);
    delete appData.voting[activeRole].votes[name];
    saveSystemData();
    renderCandidateList();
    renderPhase2Dashboard();
}

function startVotingSession() {
    const count = appData.voting[activeRole].candidates.length;

    if (count < 2) {
        showModal(
            "Kurang Calon", 
            "Minimal harus ada 2 caloh untuk memulai pemilihan.", 
            "error"
        );
        return;
    }

    document.getElementById("judul-bilik-suara").innerText = activeRole.toUpperCase();
    renderVotingButtons();
    goToScreen("screen-voting-booth");
}

function renderVotingButtons() {
    const c = document.getElementById("container-voting-buttons");
    c.innerHTML = "";
    appData.voting[activeRole].candidates.forEach(n => {
        const b = document.createElement("button");
        b.className = "vote-btn";
        b.innerText = n;
        b.onclick = () => castVote(n);
        c.appendChild(b);
    });
}

let voteLocked = false;

function castVote(name) {
    if (voteLocked) return;
    voteLocked = true;

    appData.voting[activeRole].votes[name]++;
    saveSystemData();

    showModal(
        "Suara Masuk",
        `Pilihan untuk ${name} dicatat.`,
        "success",
        () => voteLocked = false
    );
}

function adminExitVoting() {
    showConfirm(
        "Selesai Pemilihan",
        "Yakin ingin mengakhiri sesi pemilihan ini?",
        () => {
            showModal(
                "Pemilihan Selesai",
                "Sesi pemilihan telah berakhir.",
                "success",
                () => {
                    goToScreen("screen-voting-result");
                    showFinalResults();
                }
            );
        }
    );
}

function showFinalResults() {
    document.getElementById("judul-hasil-jabatan").innerText = activeRole;
    const c = document.getElementById("chart-area");
    c.innerHTML = "";

    const v = appData.voting[activeRole].votes;
    const total = Object.values(v).reduce((a, b) => a + b, 0);

    if (!total) {
        c.innerHTML = "<p style='text-align:center'>Belum ada suara.</p>";
    } else {
        Object.keys(v).sort((a, b) => v[b] - v[a]).forEach(n => {
            const p = Math.round((v[n] / total) * 100);
            c.innerHTML += `
                <div class="bar-item">
                    <div class="bar-label"><span>${n}</span><span>${v[n]} Suara (${p}%)</span></div>
                    <div class="bar-bg"><div class="bar-fill" style="width:${p}%"></div></div>
                </div>
            `;
        });
    }

    goToScreen("screen-voting-result");
}

function resetVotingForRole() {
    showConfirm("Reset Suara", "Semua suara akan dihapus.", () => {
        appData.voting[activeRole].candidates.forEach(n => appData.voting[activeRole].votes[n] = 0);
        saveSystemData();
        showModal("Berhasil", "Suara berhasil direset.", "success", showFinalResults);
    });
}

function confirmResetSystem() {
    showConfirm("Reset Data", "Semua data akan dihapus.", () => {
        localStorage.removeItem("tpa_election_v8_final");
        showModal("Berhasil", "Semua data direset.", "success", () => location.reload());
    });
}

function showModal(title, message, type, cb) {
    document.getElementById("modal-title").innerText = title;
    document.getElementById("modal-message").innerText = message;

    const i = document.getElementById("modal-icon-type");
    i.style.background = type === "success" ? "#55efc4" : "#ff7675";
    i.innerHTML =
        type === "success"
            ? '<i class="fas fa-check"></i>'
            : '<i class="fas fa-times"></i>';

    modalCallback = cb || null;

    document.getElementById("modal-action-area").innerHTML =
        `<button class="btn-modal" onclick="confirmModal()">OKE</button>`;

    document.getElementById("custom-modal").classList.add("show");
}

function showConfirm(title, message, onYes) {
    document.getElementById("modal-title").innerText = title;
    document.getElementById("modal-message").innerText = message;
    const i = document.getElementById("modal-icon-type");
    i.style.background = "#ff7675";
    i.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
    modalCallback = onYes;
    document.getElementById("modal-action-area").innerHTML = `
        <button class="btn-secondary-outline" onclick="closeModal()">Batal</button>
        <button class="btn-danger" onclick="confirmModal()">Ya</button>
    `;
    document.getElementById("custom-modal").classList.add("show");
}

function confirmModal() {
    const cb = modalCallback;
    modalCallback = null;
    document.getElementById("custom-modal").classList.remove("show");
    setTimeout(() => cb && cb(), 200);
}

function closeModal() {
    document.getElementById("custom-modal").classList.remove("show");
    modalCallback = null;
}