// ==========================================
// 1. DATA & KONFIGURASI AWAL
// ==========================================

const ROLES_LIST = [
    "Ketua", "Wakil", "Sekretaris", "Bendahara", 
    "Ketertiban", "Kerapian", "Kebersihan", "Perlengkapan"
];

// Struktur Data Utama
let appData = {
    nominations: {}, // Fase 1: { 'Ketua': ['Ahmad', 'Budi'], ... }
    voting: {}       // Fase 2: { 'Ketua': { candidates: [], votes: {} } }
};

// Variabel Sementara (State)
let tempStudentName = "";
let activeRole = "";
let onModalCloseCallback = null; // Untuk menangani aksi setelah tombol OK di modal diklik

// ==========================================
// 2. SISTEM UTAMA (INIT & NAVIGATION)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    loadSystemData();
    initDataStructure();
    
    // Render awal elemen yang statis
    renderPhase1RoleButtons();
    renderPhase2Dashboard();
});

// Fungsi Pindah Layar (Screen Switcher)
function goToScreen(screenId) {
    // Sembunyikan semua layar
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    // Tampilkan layar yang dituju
    const target = document.getElementById(screenId);
    if(target) {
        target.classList.add('active');
        // Scroll ke atas setiap ganti layar
        window.scrollTo(0,0);
    } else {
        console.error("Screen ID not found:", screenId);
    }
}

// Fungsi Load/Save LocalStorage
function saveSystemData() {
    localStorage.setItem('tpa_election_v3', JSON.stringify(appData));
}

function loadSystemData() {
    const stored = localStorage.getItem('tpa_election_v3');
    if (stored) {
        appData = JSON.parse(stored);
    }
}

function initDataStructure() {
    // Pastikan struktur data lengkap (antisipasi jika data kosong/baru)
    ROLES_LIST.forEach(role => {
        if (!appData.nominations[role]) appData.nominations[role] = [];
        if (!appData.voting[role]) appData.voting[role] = { candidates: [], votes: {} };
    });
}

function resetSystemData() {
    if(confirm("PERINGATAN KERAS: Apakah Anda yakin ingin menghapus SEMUA data pemilihan? Tindakan ini tidak bisa dibatalkan.")) {
        localStorage.removeItem('tpa_election_v3');
        location.reload();
    }
}

// ==========================================
// 3. SISTEM POPUP MODAL (PENGGANTI ALERT)
// ==========================================

function showCustomModal(title, message, type = 'success', callback = null) {
    const modal = document.getElementById('custom-modal');
    const titleEl = document.getElementById('modal-title');
    const msgEl = document.getElementById('modal-message');
    const iconContainer = document.getElementById('modal-icon-type');

    titleEl.innerText = title;
    msgEl.innerText = message;
    
    // Set Icon & Warna Berdasarkan Tipe
    if (type === 'success') {
        iconContainer.style.background = '#55efc4'; // Hijau
        iconContainer.innerHTML = '<i class="fas fa-check"></i>';
    } else if (type === 'error') {
        iconContainer.style.background = '#ff7675'; // Merah
        iconContainer.innerHTML = '<i class="fas fa-times"></i>';
    } else if (type === 'info') {
        iconContainer.style.background = '#74b9ff'; // Biru
        iconContainer.innerHTML = '<i class="fas fa-info"></i>';
    }

    onModalCloseCallback = callback;
    modal.classList.add('show');
}

function closeCustomModal() {
    const modal = document.getElementById('custom-modal');
    modal.classList.remove('show');
    
    // Jalankan callback jika ada (misal: pindah halaman setelah klik OK)
    if (onModalCloseCallback) {
        onModalCloseCallback();
        onModalCloseCallback = null;
    }
}

// ==========================================
// 4. LOGIKA FASE 1: PENJARINGAN (MINAT)
// ==========================================

function processPhase1Name() {
    const inputEl = document.getElementById('input-santri-name');
    const name = inputEl.value.trim();

    if (name === "") {
        showCustomModal("Ups!", "Tulis namamu dulu ya.", "error");
        return;
    }

    tempStudentName = name;
    // Update sapaan di layar berikutnya
    document.getElementById('greet-santri').innerText = `Halo, ${name}!`;
    
    // Bersihkan input dan pindah layar
    inputEl.value = "";
    goToScreen('screen-phase1-choose');
}

function renderPhase1RoleButtons() {
    const container = document.getElementById('container-roles-p1');
    container.innerHTML = "";

    ROLES_LIST.forEach(role => {
        const btn = document.createElement('button');
        btn.className = 'role-btn-p1';
        btn.innerHTML = `<i class="fas fa-star" style="color:#fdcb6e"></i> ${role}`;
        btn.onclick = () => submitPhase1Choice(role);
        container.appendChild(btn);
    });
}

function submitPhase1Choice(roleChoice) {
    if (roleChoice !== 'Tidak Menjabat') {
        // Simpan nama ke array jabatan tersebut
        appData.nominations[roleChoice].push(tempStudentName);
    }
    
    saveSystemData();

    // Tampilkan popup sukses, lalu kembali ke input nama
    showCustomModal(
        "Tersimpan!", 
        `Terima kasih ${tempStudentName}, pilihanmu sudah dicatat.`, 
        "success", 
        () => {
            goToScreen('screen-phase1-input');
        }
    );
}

function showPhase1Results() {
    const container = document.getElementById('list-results-p1');
    container.innerHTML = "";

    ROLES_LIST.forEach(role => {
        const div = document.createElement('div');
        const listNames = appData.nominations[role];
        const namesString = listNames.length > 0 ? listNames.join(", ") : "<i style='color:#aaa'>Belum ada peminat</i>";
        
        div.innerHTML = `
            <strong>${role} (${listNames.length})</strong><br>
            <small>${namesString}</small>
        `;
        container.appendChild(div);
    });

    goToScreen('screen-phase1-results');
}

// ==========================================
// 5. LOGIKA FASE 2: SETUP & VOTING
// ==========================================

function renderPhase2Dashboard() {
    const list = document.getElementById('list-roles-p2');
    list.innerHTML = "";

    ROLES_LIST.forEach(role => {
        const div = document.createElement('div');
        const count = appData.voting[role].candidates.length;
        
        div.innerHTML = `
            <span><i class="fas fa-tag" style="color:var(--secondary)"></i> &nbsp; ${role}</span>
            <span style="background:#dfe6e9; padding:5px 10px; border-radius:10px; font-size:0.8rem; font-weight:bold;">${count} Kandidat</span>
        `;
        div.onclick = () => setupVotingScreen(role);
        list.appendChild(div);
    });
}

function setupVotingScreen(role) {
    activeRole = role;
    document.getElementById('setup-role-name').innerText = role;
    renderSetupCandidateList();
    goToScreen('screen-phase2-setup');
}

// --- Manajemen Kandidat ---

function addCandidateAction() {
    const input = document.getElementById('input-candidate');
    const name = input.value.trim();

    if (!name) return;

    // Cek duplikasi
    if (appData.voting[activeRole].candidates.includes(name)) {
        showCustomModal("Gagal", "Nama kandidat sudah ada!", "error");
        return;
    }

    // Tambah kandidat
    appData.voting[activeRole].candidates.push(name);
    // Inisialisasi suara 0
    if (appData.voting[activeRole].votes[name] === undefined) {
        appData.voting[activeRole].votes[name] = 0;
    }
    
    saveSystemData();
    input.value = "";
    renderSetupCandidateList();
    renderPhase2Dashboard(); // Update angka di dashboard
}

function renderSetupCandidateList() {
    const ul = document.getElementById('list-candidates-setup');
    ul.innerHTML = "";
    const candidates = appData.voting[activeRole].candidates;

    if (candidates.length === 0) {
        ul.innerHTML = "<li style='justify-content:center; color:#999'>Belum ada kandidat final</li>";
        return;
    }

    candidates.forEach((name, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${name}</span>
            <i class="fas fa-times" style="color:#ff7675; cursor:pointer;" onclick="removeCandidate(${index})"></i>
        `;
        ul.appendChild(li);
    });
}

function removeCandidate(index) {
    const name = appData.voting[activeRole].candidates[index];
    
    // Hapus dari array candidates
    appData.voting[activeRole].candidates.splice(index, 1);
    // Hapus data suaranya juga
    delete appData.voting[activeRole].votes[name];
    
    saveSystemData();
    renderSetupCandidateList();
    renderPhase2Dashboard();
}

// --- Proses Voting (Bilik Suara) ---

function startVotingSession() {
    const candidates = appData.voting[activeRole].candidates;
    
    // Izinkan 1 kandidat (aklamasi) atau lebih
    if (candidates.length < 1) {
        showCustomModal("Belum Siap", "Masukkan minimal 1 kandidat sebelum mulai.", "error");
        return;
    }

    document.getElementById('booth-role-title').innerText = activeRole.toUpperCase();
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
        btn.onclick = () => submitVote(name);
        container.appendChild(btn);
    });
}

function submitVote(candidateName) {
    // Tambah suara
    appData.voting[activeRole].votes[candidateName]++;
    saveSystemData();

    // Tampilkan popup sukses
    showCustomModal(
        "Suara Masuk!", 
        "Terima kasih telah memilih. Panggil teman berikutnya.", 
        "success", 
        () => {
            // Callback kosong: Tetap di layar booth, siap untuk anak selanjutnya
            // Kita bisa reset scroll atau animasi jika perlu
        }
    );
}

function adminExitVoting() {
    // Prompt password sederhana
    const pass = prompt("Masukkan PIN Admin untuk melihat hasil:", "");
    if (pass === "1234") { // PIN Default
        showFinalResults();
    } else {
        if(pass !== null) alert("PIN Salah!"); // Alert bawaan hanya untuk admin error
    }
}

// ==========================================
// 6. HASIL AKHIR & GRAFIK
// ==========================================

function showFinalResults() {
    document.getElementById('result-role-label').innerText = "Jabatan: " + activeRole;
    const container = document.getElementById('chart-area');
    container.innerHTML = "";

    const roleData = appData.voting[activeRole];
    let totalVotes = 0;
    
    // Hitung total
    for (let candidate in roleData.votes) {
        totalVotes += roleData.votes[candidate];
    }

    // Urutkan pemenang (terbanyak di atas)
    const sortedCandidates = Object.keys(roleData.votes).sort((a,b) => roleData.votes[b] - roleData.votes[a]);

    if (totalVotes === 0 && sortedCandidates.length === 0) {
        container.innerHTML = "<p>Belum ada data.</p>";
    } else {
        sortedCandidates.forEach(name => {
            const votes = roleData.votes[name];
            const percent = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);

            const barItem = document.createElement('div');
            barItem.className = 'bar-item';
            barItem.innerHTML = `
                <div class="bar-label">
                    <span>${name}</span>
                    <span>${votes} Suara (${percent}%)</span>
                </div>
                <div class="bar-bg">
                    <div class="bar-fill" style="width: ${percent}%"></div>
                </div>
            `;
            container.appendChild(barItem);
        });
    }

    goToScreen('screen-voting-result');
}

function resetVotingForRole() {
    if (confirm(`Reset hasil suara untuk jabatan ${activeRole}? Kandidat tetap ada, suara jadi 0.`)) {
        const candidates = appData.voting[activeRole].candidates;
        candidates.forEach(name => {
            appData.voting[activeRole].votes[name] = 0;
        });
        saveSystemData();
        showFinalResults(); // Refresh tampilan
    }
}