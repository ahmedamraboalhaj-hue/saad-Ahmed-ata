// Quran Management System - Sheikh Sayed Ahmed Atta
// Core Logic Optimized for Stability

let students = [];
let currentStudent = null;
let currentAttendanceStatus = 'present'; // global state for toggle

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initQuranSelects();
    loadStudents();
    setupEventListeners();
    console.log("System initialized successfully.");
});

function initQuranSelects() {
    if (typeof quranData === 'undefined') {
        console.error("Quran data not loaded!");
        return;
    }

    const options = '<option value="">-- اختر السورة --</option>' + 
        quranData.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    
    const selectorIds = [
        'lawh-surah', 'new-std-surah', 
        'tathbit-surah-from', 'tathbit-surah-to', 
        'madi-surah-from', 'madi-surah-to'
    ];

    selectorIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = options;
    });
}

function setupEventListeners() {
    const searchInput = document.getElementById('student-search');
    const searchResults = document.getElementById('search-results');
    const addStudentBtn = document.getElementById('add-student-btn');
    const addStudentModal = document.getElementById('add-student-modal');
    const closeModal = document.getElementById('close-modal');
    const addStudentForm = document.getElementById('add-student-form');
    const saveSessionBtn = document.getElementById('save-session-btn');
    const clearBtn = document.getElementById('clear-selection-btn');
    const recordingInterface = document.getElementById('recording-interface');
    const initialStats = document.getElementById('initial-stats');

    // Search logic
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length < 1) {
                if (searchResults) searchResults.classList.add('hidden');
                return;
            }
            filterStudents(query);
        });
    }

    // Modal logic
    if (addStudentBtn && addStudentModal) {
        addStudentBtn.onclick = () => addStudentModal.classList.remove('hidden');
    }
    if (closeModal && addStudentModal) {
        closeModal.onclick = () => addStudentModal.classList.add('hidden');
    }

    // Add Student Form
    if (addStudentForm) {
        addStudentForm.onsubmit = (e) => {
            e.preventDefault();
            const data = {
                name: document.getElementById('new-std-name').value,
                level: document.getElementById('new-std-level').value,
                gender: document.getElementById('new-std-gender').value,
                currentSurah: document.getElementById('new-std-surah').value,
                phone: document.getElementById('new-std-phone').value
            };
            addNewStudent(data);
        };
    }

    // Save Session
    if (saveSessionBtn) {
        saveSessionBtn.onclick = saveCurrentSession;
    }

    if (clearBtn) {
        clearBtn.onclick = () => {
            if (recordingInterface) recordingInterface.classList.add('hidden');
            if (initialStats) initialStats.classList.remove('hidden');
            currentStudent = null;
        };
    }

    // Global click for search dropdown
    document.addEventListener('click', (e) => {
        if (searchInput && searchResults && !searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.add('hidden');
        }
    });

    // Range Inputs change -> Update WhatsApp Link
    const inputIds = [
        'lawh-surah', 'lawh-aya-from', 'lawh-aya-to',
        'tathbit-surah-from', 'tathbit-aya-from', 'tathbit-surah-to', 'tathbit-aya-to',
        'madi-surah-from', 'madi-aya-from', 'madi-surah-to', 'madi-aya-to'
    ];
    inputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateWhatsAppLink);
    });
}

// --- DATA ACCESS ---
function loadStudents() {
    const localData = localStorage.getItem('quran_students');
    if (localData) {
        try {
            students = JSON.parse(localData);
        } catch (e) {
            console.error("Error parsing local data", e);
            students = [];
        }
    } else {
        students = [
            { id: 1, name: "عبدالرحمن محمد", level: "المستوى الأول", gender: "ذكر", phone: "0500000000", lawh: { surah: 2, from: 1, to: 10 }, last_session: "2026-03-20" },
            { id: 2, name: "أحمد علي", level: "المستوى الثاني", gender: "ذكر", phone: "0511111111", lawh: { surah: 18, from: 1, to: 5 }, last_session: "2026-03-19" }
        ];
        saveToLocal();
    }
    updateStats();
}

function saveToLocal() {
    localStorage.setItem('quran_students', JSON.stringify(students));
    updateStats();
}

function updateStats() {
    const totalCount = students.length;
    const statVals = document.querySelectorAll('.stat-val');
    if (statVals[0]) statVals[0].textContent = totalCount;
    if (statVals[1]) statVals[1].textContent = Math.floor(totalCount * 0.8); // Dummy attendance
}

// --- SEARCH, FILTERS & SELECTION ---
window.setDashboardFilter = (stage) => {
    document.getElementById('filter-level').value = stage;
    applyFilters();
};

window.applyFilters = () => {
    const query = document.getElementById('student-search').value.toLowerCase();
    filterStudents(query);
};

function filterStudents(query) {
    const searchResults = document.getElementById('search-results');
    const stageFilter = document.getElementById('filter-level').value;
    const genderFilter = document.getElementById('filter-gender').value;
    
    if (!searchResults) return;

    const matches = students.filter(s => {
        const nameMatch = s.name.toLowerCase().includes(query);
        const stageMatch = stageFilter === 'الكل' || (s.level && s.level.includes(stageFilter));
        const genderMatch = genderFilter === 'الكل' || s.gender === genderFilter;
        return nameMatch && stageMatch && genderMatch;
    });

    if (matches.length > 0) {
        searchResults.innerHTML = matches.map(s => `
            <div class="search-item" onclick="selectStudent('${s.id}')">
                <div class="search-info">
                    <span class="name">${s.name}</span>
                    <span class="level-tag">${s.level} - ${s.gender}</span>
                </div>
                <i class="fa-solid fa-chevron-left"></i>
            </div>
        `).join('');
        searchResults.classList.remove('hidden');
    } else {
        searchResults.innerHTML = '<div class="search-item">لا يوجد نتائج تطابق الفلاتر</div>';
        searchResults.classList.remove('hidden');
    }
}

// --- NEW FEATURE: STUDENTS LIST VIEW ---
let listGenderFilter = 'الكل';

window.toggleSection = (sectionId) => {
    const dashboardIds = ['grade-dashboard', 'achievers-section', 'search-section', 'initial-stats', 'recording-interface'];
    const studentsListSection = document.getElementById('students-list-section');

    if (sectionId === 'students-list-section') {
        dashboardIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
        studentsListSection.classList.remove('hidden');
        updateYearOptions();
        filterStudentsList();
    } else {
        dashboardIds.forEach(id => {
            const el = document.getElementById(id);
            // Show only relevant initial state
            if (id === 'grade-dashboard' || id === 'search-section' || id === 'initial-stats') {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });
        studentsListSection.classList.add('hidden');
    }
};

window.updateYearOptions = () => {
    const stage = document.getElementById('list-filter-stage').value;
    const yearSelect = document.getElementById('list-filter-year');
    let options = '<option value="الكل">الكل</option>';

    const years = {
        'الابتدائي': ['أول ابتدائي', 'ثاني ابتدائي', 'ثالث ابتدائي', 'رابع ابتدائي', 'خامس ابتدائي', 'سادس ابتدائي'],
        'الإعدادي': ['أول إعدادي', 'ثاني إعدادي', 'ثالث إعدادي'],
        'الثانوي': ['أول ثانوي', 'ثاني ثانوي', 'ثالث ثانوي']
    };

    if (years[stage]) {
        years[stage].forEach(y => {
            options += `<option value="${y}">${y}</option>`;
        });
    }

    yearSelect.innerHTML = options;
};

window.setListGender = (gender) => {
    listGenderFilter = gender;
    document.querySelectorAll('.gender-btn').forEach(btn => {
        if (btn.getAttribute('data-gender') === gender) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    filterStudentsList();
};

window.filterStudentsList = () => {
    const stage = document.getElementById('list-filter-stage').value;
    const year = document.getElementById('list-filter-year').value;
    const container = document.getElementById('students-table-container');

    const filtered = students.filter(s => {
        const stageMatch = stage === 'الكل' || (s.level && s.level.includes(stage));
        const yearMatch = year === 'الكل' || s.level === year;
        const genderMatch = listGenderFilter === 'الكل' || s.gender === listGenderFilter;
        return stageMatch && yearMatch && genderMatch;
    });

    if (filtered.length > 0) {
        container.innerHTML = filtered.map(s => `
            <div class="student-list-item" onclick="viewFromList('${s.id}')">
                <div class="std-info-row">
                    <span class="std-name">${s.name}</span>
                    <span class="std-meta">${s.level} - ${s.gender}</span>
                </div>
                <div class="std-actions">
                    <span class="std-meta">${s.last_session || 'لا يوجد تسجيل'}</span>
                    <i class="fa-solid fa-chevron-left" style="margin-right: 15px; color: var(--primary-blue);"></i>
                </div>
            </div>
        `).join('');
    } else {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-user-slash"></i>
                <p>لا يوجد طلاب يطابقون هذه الفلاتر</p>
            </div>
        `;
    }
};

window.viewFromList = (id) => {
    toggleSection('main-dashboard');
    selectStudent(id);
};

window.selectStudent = (id) => {
    const student = students.find(s => s.id == id);
    if (!student) return;

    currentStudent = student;
    setAttendance('present'); // Default to present on selection
    const searchResults = document.getElementById('search-results');
    const searchInput = document.getElementById('student-search');
    if (searchResults) searchResults.classList.add('hidden');
    if (searchInput) searchInput.value = '';

    // Fill UI
    document.getElementById('current-student-name').textContent = student.name;
    document.getElementById('current-student-level').textContent = student.level;
    document.getElementById('current-student-gender').textContent = student.gender || 'ذكر';
    document.getElementById('current-guardian-phone').textContent = student.phone || '--';
    document.getElementById('last-session-date').textContent = student.last_session || 'لا يوجد';

    // Set values
    document.getElementById('lawh-surah').value = student.lawh?.surah || student.currentSurah || "";
    document.getElementById('lawh-aya-from').value = student.lawh?.from || "";
    document.getElementById('lawh-aya-to').value = student.lawh?.to || "";
    
    document.getElementById('tathbit-surah-from').value = student.tathbit?.sFrom || "";
    document.getElementById('tathbit-aya-from').value = student.tathbit?.aFrom || "";
    document.getElementById('tathbit-surah-to').value = student.tathbit?.sTo || "";
    document.getElementById('tathbit-aya-to').value = student.tathbit?.aTo || "";

    document.getElementById('madi-surah-from').value = student.madi?.sFrom || "";
    document.getElementById('madi-aya-from').value = student.madi?.aFrom || "";
    document.getElementById('madi-surah-to').value = student.madi?.sTo || "";
    document.getElementById('madi-aya-to').value = student.madi?.aTo || "";

    document.getElementById('initial-stats').classList.add('hidden');
    document.getElementById('recording-interface').classList.remove('hidden');
    updateWhatsAppLink();
};

function getRangeText(sFrom, aFrom, sTo, aTo) {
    if (!sFrom) return "---";
    const surahFrom = quranData.find(s => s.id == sFrom)?.name;
    const surahTo = sTo ? quranData.find(s => s.id == sTo)?.name : null;
    
    if (!surahTo || sFrom === sTo) {
        return `سورة ${surahFrom} ${aFrom && aTo ? `(من ${aFrom} إلى ${aTo})` : ''}`;
    } else {
        return `من ${surahFrom} (${aFrom || 1}) إلى ${surahTo} (${aTo || 'آخرها'})`;
    }
}

window.setAttendance = (status) => {
    currentAttendanceStatus = status;
    const pBtn = document.getElementById('toggle-present');
    const aBtn = document.getElementById('toggle-absent');
    const inputs = document.querySelector('.recording-inputs');

    if (status === 'present') {
        pBtn.classList.add('active');
        aBtn.classList.remove('active');
        inputs.style.opacity = '1';
        inputs.style.pointerEvents = 'auto';
    } else {
        aBtn.classList.add('active');
        pBtn.classList.remove('active');
        inputs.style.opacity = '0.4';
        inputs.style.pointerEvents = 'none';
    }
    updateWhatsAppLink();
};

function updateWhatsAppLink() {
    const btn = document.getElementById('send-report-btn');
    if (!currentStudent || !currentStudent.phone || !btn) return;
    
    btn.classList.remove('hidden');
    
    let lawh = "---";
    let tathbit = "---";
    let madi = "---";
    let attendanceIcon = "حضر ✅";

    if (currentAttendanceStatus === 'present') {
        lawh = getRangeText(document.getElementById('lawh-surah').value, 
                        document.getElementById('lawh-aya-from').value, 
                        document.getElementById('lawh-surah').value, 
                        document.getElementById('lawh-aya-to').value);

        tathbit = getRangeText(document.getElementById('tathbit-surah-from').value,
                            document.getElementById('tathbit-aya-from').value,
                            document.getElementById('tathbit-surah-to').value,
                            document.getElementById('tathbit-aya-to').value);

        madi = getRangeText(document.getElementById('madi-surah-from').value,
                            document.getElementById('madi-aya-from').value,
                            document.getElementById('madi-surah-to').value,
                            document.getElementById('madi-aya-to').value);
    } else {
        attendanceIcon = "غائب ❌";
        lawh = "لم يتم التسميع لعدم الحضور";
        tathbit = "---";
        madi = "---";
    }

    const title = currentStudent.gender === 'أنثى' ? "للطالبة" : "للطالب";
    const statusText = currentAttendanceStatus === 'present' ? "تم الحضور" : "لم يتم الحضور (غائب)";
    
    const message = `السلام عليكم ورحمة الله وبركاته،
تفضلوا بتقرير اليوم ${title}/ ${currentStudent.name}:

📅 الحضور: ${statusText} ${attendanceIcon}
📖 اللوح (الجديد): ${lawh}
🔄 التثبيت: ${tathbit}
📚 الماضي: ${madi}

نأمل المتابعة والحرص جزاكم الله خيراً.`;

    const cleanPhone = currentStudent.phone.replace(/\D/g, ''); 
    const finalPhone = cleanPhone.startsWith('0') ? '20' + cleanPhone.substring(1) : cleanPhone;
    btn.href = `https://wa.me/${finalPhone}/?text=${encodeURIComponent(message)}`;
}

// --- ACTIONS ---
function addNewStudent(data) {
    const newStudent = { id: Date.now(), ...data, lawh: {}, tathbit: {}, madi: {}, last_session: "" };
    students.push(newStudent);
    saveToLocal();
    document.getElementById('add-student-modal').classList.add('hidden');
    document.getElementById('add-student-form').reset();
    alert('تمت إضافة الطالب بنجاح');
}

function saveCurrentSession() {
    if (!currentStudent) return;

    currentStudent.lawh = { 
        surah: parseInt(document.getElementById('lawh-surah').value), 
        from: parseInt(document.getElementById('lawh-aya-from').value), 
        to: parseInt(document.getElementById('lawh-aya-to').value) 
    };
    
    currentStudent.tathbit = {
        sFrom: parseInt(document.getElementById('tathbit-surah-from').value),
        aFrom: parseInt(document.getElementById('tathbit-aya-from').value),
        sTo: parseInt(document.getElementById('tathbit-surah-to').value),
        aTo: parseInt(document.getElementById('tathbit-aya-to').value)
    };

    currentStudent.madi = {
        sFrom: parseInt(document.getElementById('madi-surah-from').value),
        aFrom: parseInt(document.getElementById('madi-aya-from').value),
        sTo: parseInt(document.getElementById('madi-surah-to').value),
        aTo: parseInt(document.getElementById('madi-aya-to').value)
    };

    currentStudent.last_session = new Date().toLocaleDateString('ar-EG');

    // Completion Alert
    const sId = currentStudent.lawh.surah;
    if (sId) {
        const surah = quranData.find(s => s.id === sId);
        if (surah && currentStudent.lawh.to === surah.ayas) {
            alert(`🎉 مبارك تم إتمام سورة ${surah.name}`);
        }
    }

    const idx = students.findIndex(s => s.id == currentStudent.id);
    students[idx] = currentStudent;
    saveToLocal();

    const btn = document.getElementById('save-session-btn');
    const oldText = btn.innerHTML;
    btn.innerHTML = '✅ تم الحفظ';
    setTimeout(() => {
        btn.innerHTML = oldText;
        document.getElementById('recording-interface').classList.add('hidden');
        document.getElementById('initial-stats').classList.remove('hidden');
        currentStudent = null;
    }, 1500);
}
