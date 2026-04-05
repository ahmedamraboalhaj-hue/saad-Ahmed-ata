// Quran Management System - Multi-Tenant Firebase Version
// Core Logic Optimized for Multi-Tenancy

import { database, auth } from './firebase-config.js';
import { 
    ref, 
    onValue, 
    push, 
    set, 
    update,
    query, 
    orderByChild, 
    equalTo 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

let students = [];
let currentStudent = null;
let currentAttendanceStatus = 'present';
let userOfficeId = localStorage.getItem('userOfficeId');

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth to be ready if no officeId in local
    if (!userOfficeId) {
        auth.onAuthStateChanged(user => {
            if (user) {
                userOfficeId = user.uid;
                localStorage.setItem('userOfficeId', user.uid);
                initApp();
            }
        });
    } else {
        initApp();
    }
});

function initApp() {
    updateUIBranding();
    initQuranSelects();
    loadStudentsFromFirebase();
    setupEventListeners();
    console.log("System initialized for Office:", userOfficeId);
}

function updateUIBranding() {
    const officeName = localStorage.getItem('officeName') || "مكتب تحفيظ القرآن";
    const sheikhName = localStorage.getItem('sheikhName') || "الشيخ المحفظ";
    
    // Update the main header title and subtitle
    const mainTitle = document.querySelector('.title-group h1');
    const subtitle = document.querySelector('.subtitle');
    
    if (mainTitle) mainTitle.textContent = `نظام إدارة ${officeName}`;
    if (subtitle) subtitle.textContent = `بإشراف فضيلة ${sheikhName}`;
}

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
        'madi-surah-from', 'madi-aya-from', 'madi-surah-to', 'madi-aya-to'
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
            const searchQuery = e.target.value.toLowerCase();
            if (searchQuery.length < 1) {
                if (searchResults) searchResults.classList.add('hidden');
                return;
            }
            filterStudents(searchQuery);
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
                phone: document.getElementById('new-std-phone').value,
                officeId: userOfficeId // Associate with office
            };
            addNewStudentToFirebase(data);
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

// --- FIREBASE DATA ACCESS ---
function loadStudentsFromFirebase() {
    if (!userOfficeId) return;

    // Filter by officeId for multi-tenancy
    const studentsRef = ref(database, 'students');
    const filteredQuery = query(studentsRef, orderByChild('officeId'), equalTo(userOfficeId));

    onValue(filteredQuery, (snapshot) => {
        const data = snapshot.val();
        students = [];
        if (data) {
            Object.keys(data).forEach(id => {
                students.push({ id, ...data[id] });
            });
        }
        updateStats();
        console.log(`Loaded ${students.length} students for office ${userOfficeId}`);
    });
}

function addNewStudentToFirebase(data) {
    const studentsRef = ref(database, 'students');
    const newStudentRef = push(studentsRef);
    
    set(newStudentRef, {
        ...data,
        createdAt: new Date().toISOString(),
        lawh: {},
        tathbit: {},
        madi: {},
        last_session: ""
    }).then(() => {
        document.getElementById('add-student-modal').classList.add('hidden');
        document.getElementById('add-student-form').reset();
        alert('تمت إضافة الطالب بنجاح');
    }).catch(err => {
        console.error("Error adding student:", err);
        alert("خطأ في الإضافة: " + err.message);
    });
}

function updateStats() {
    const totalCount = students.length;
    const statVals = document.querySelectorAll('.stat-val');
    if (statVals[0]) statVals[0].textContent = totalCount;
    if (statVals[1]) {
        // Simple logic for attendance: count today's sessions
        const today = new Date().toLocaleDateString('ar-EG');
        const presentToday = students.filter(s => s.last_session === today).length;
        statVals[1].textContent = presentToday;
    }
}

// --- SEARCH, FILTERS & SELECTION ---
window.setDashboardFilter = (stage) => {
    document.getElementById('filter-level').value = stage;
    applyFilters();
};

window.applyFilters = () => {
    const searchQuery = document.getElementById('student-search').value.toLowerCase();
    filterStudents(searchQuery);
};

function filterStudents(searchQuery) {
    const searchResults = document.getElementById('search-results');
    const stageFilter = document.getElementById('filter-level').value;
    const genderFilter = document.getElementById('filter-gender').value;
    
    if (!searchResults) return;

    const matches = students.filter(s => {
        const nameMatch = s.name.toLowerCase().includes(searchQuery);
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

// --- STUDENTS LIST VIEW ---
let listGenderFilter = 'الكل';

window.toggleSection = (sectionId) => {
    const dashboardIds = ['achievers-section', 'initial-stats', 'recording-interface'];
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
            if (id === 'initial-stats') {
                if (el) el.classList.remove('hidden');
            } else {
                if (el) el.classList.add('hidden');
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
    const searchQuery = document.getElementById('list-search-input')?.value.toLowerCase() || '';
    const container = document.getElementById('students-table-container');

    const filtered = students.filter(s => {
        const nameMatch = s.name.toLowerCase().includes(searchQuery);
        const stageMatch = stage === 'الكل' || (s.level && s.level.includes(stage));
        const yearMatch = year === 'الكل' || s.level === year;
        const genderMatch = listGenderFilter === 'الكل' || s.gender === listGenderFilter;
        return nameMatch && stageMatch && yearMatch && genderMatch;
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
    setAttendance('present');
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

    // Set values safely
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

function saveCurrentSession() {
    if (!currentStudent) return;

    const sessionData = {
        lawh: { 
            surah: parseInt(document.getElementById('lawh-surah').value) || null, 
            from: parseInt(document.getElementById('lawh-aya-from').value) || null, 
            to: parseInt(document.getElementById('lawh-aya-to').value) || null 
        },
        tathbit: {
            sFrom: parseInt(document.getElementById('tathbit-surah-from').value) || null,
            aFrom: parseInt(document.getElementById('tathbit-aya-from').value) || null,
            sTo: parseInt(document.getElementById('tathbit-surah-to').value) || null,
            aTo: parseInt(document.getElementById('tathbit-aya-to').value) || null
        },
        madi: {
            sFrom: parseInt(document.getElementById('madi-surah-from').value) || null,
            aFrom: parseInt(document.getElementById('madi-aya-from').value) || null,
            sTo: parseInt(document.getElementById('madi-surah-to').value) || null,
            aTo: parseInt(document.getElementById('madi-aya-to').value) || null
        },
        last_session: new Date().toLocaleDateString('ar-EG'),
        attendance: currentAttendanceStatus
    };

    // Update in Firebase
    const studentRef = ref(database, `students/${currentStudent.id}`);
    update(studentRef, sessionData).then(() => {
        const btn = document.getElementById('save-session-btn');
        const oldText = btn.innerHTML;
        btn.innerHTML = '✅ تم الحفظ';
        setTimeout(() => {
            btn.innerHTML = oldText;
            document.getElementById('recording-interface').classList.add('hidden');
            document.getElementById('initial-stats').classList.remove('hidden');
            currentStudent = null;
        }, 1500);
    }).catch(err => {
        alert("خطأ أثناء الحفظ: " + err.message);
    });
}
