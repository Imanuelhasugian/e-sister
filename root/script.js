// Application State
let currentUser = null;
let patients = [];
let doctors = [];
let statuses = [];
let insurance = [];
let currentEditingRM = null;
let currentMasterType = null;
let currentEditingId = null;

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeData();
    bindEvents();
    checkAdminSession();
});

// Check Admin Session
function checkAdminSession() {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession === 'active') {
        currentUser = 'admin';
        document.getElementById('patientPortal').style.display = 'none';
        document.getElementById('adminPortal').style.display = 'block';
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        updateDashboard();
        renderPatientsTable();
        renderMasterTabs();
    } else {
        showPatientPortal();
    }
}

// Initialize Default Data
function initializeData() {
    // Load data from localStorage or set defaults
    patients = JSON.parse(localStorage.getItem('patients')) || [];
    doctors = JSON.parse(localStorage.getItem('doctors')) || [
        { id: 1, name: 'Dr. Ahmad Wijaya' },
        { id: 2, name: 'Dr. Siti Nurhaliza' },
        { id: 3, name: 'Dr. Budi Santoso' }
    ];
    statuses = JSON.parse(localStorage.getItem('statuses')) || [
        { id: 1, name: 'Pendaftaran' },
        { id: 2, name: 'Pemeriksaan Awal' },
        { id: 3, name: 'Konsultasi Dokter' },
        { id: 4, name: 'Pemeriksaan Lab' },
        { id: 5, name: 'Hasil Pemeriksaan' },
        { id: 6, name: 'Selesai' }
    ];
    insurance = JSON.parse(localStorage.getItem('insurance')) || [
        { id: 1, name: 'BPJS Kesehatan' },
        { id: 2, name: 'Asuransi Swasta' },
        { id: 3, name: 'Mandiri' }
    ];

    // Save default data if not exists
    saveData();
}

// Save Data to localStorage
function saveData() {
    localStorage.setItem('patients', JSON.stringify(patients));
    localStorage.setItem('doctors', JSON.stringify(doctors));
    localStorage.setItem('statuses', JSON.stringify(statuses));
    localStorage.setItem('insurance', JSON.stringify(insurance));
}

// Bind Event Listeners
function bindEvents() {
    // Patient Portal Events
    const adminBtn = document.getElementById('adminBtn');
    const searchBtn = document.getElementById('searchBtn');
    const rmInput = document.getElementById('rmInput');
    
    if (adminBtn) adminBtn.addEventListener('click', showAdminPortal);
    if (searchBtn) searchBtn.addEventListener('click', searchPatient);
    if (rmInput) {
        rmInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchPatient();
            }
        });
    }

    // Login Events
    const loginForm = document.getElementById('loginForm');
    const backToPatientBtn = document.getElementById('backToPatient');
    
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (backToPatientBtn) backToPatientBtn.addEventListener('click', showPatientPortal);

    // Admin Dashboard Events
    const logoutBtn = document.getElementById('logoutBtn');
    const addPatientBtn = document.getElementById('addPatientBtn');
    const exportBtn = document.getElementById('exportBtn');
    
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    if (addPatientBtn) addPatientBtn.addEventListener('click', showAddPatientModal);
    if (exportBtn) exportBtn.addEventListener('click', exportToExcel);

    // Tab Events
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });

    // Modal Events
    const patientForm = document.getElementById('patientForm');
    const masterForm = document.getElementById('masterForm');
    
    if (patientForm) patientForm.addEventListener('submit', savePatient);
    if (masterForm) masterForm.addEventListener('submit', saveMasterData);

    // Close modal events
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    document.querySelectorAll('.cancel-btn').forEach(cancelBtn => {
        cancelBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// Show Patient Portal
function showPatientPortal() {
    document.getElementById('patientPortal').style.display = 'block';
    document.getElementById('adminPortal').style.display = 'none';
    document.getElementById('patientResult').style.display = 'none';
    document.getElementById('notFound').style.display = 'none';
    document.getElementById('rmInput').value = '';
}

// Show Admin Portal
function showAdminPortal() {
    document.getElementById('patientPortal').style.display = 'none';
    document.getElementById('adminPortal').style.display = 'block';
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('loginError').style.display = 'none';
}

// Handle Login
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === 'admin' && password === 'admin') {
        currentUser = 'admin';
        localStorage.setItem('adminSession', 'active');
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        updateDashboard();
        renderPatientsTable();
        renderMasterTabs();
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
}

// Logout
function logout() {
    currentUser = null;
    localStorage.removeItem('adminSession');
    showPatientPortal();
}

// Search Patient
function searchPatient() {
    const rmNumber = document.getElementById('rmInput').value.trim().toUpperCase();

    if (!rmNumber) {
        alert('Silakan masukkan nomor rekam medis!');
        return;
    }

    const patient = patients.find(p => p.rm === rmNumber);

    if (patient) {
        displayPatientResult(patient);
    } else {
        document.getElementById('patientResult').style.display = 'none';
        document.getElementById('notFound').style.display = 'block';
    }
}

// Display Patient Result
function displayPatientResult(patient) {
    document.getElementById('patientName').textContent = patient.name;
    document.getElementById('patientRM').textContent = patient.rm;
    document.getElementById('patientDoctor').textContent = getDoctorName(patient.doctorId);
    document.getElementById('patientDate').textContent = formatDate(patient.date);

    // Generate status timeline
    const timeline = document.getElementById('statusTimeline');
    timeline.innerHTML = '';

    const currentStatusIndex = statuses.findIndex(s => s.id === patient.statusId);

    statuses.forEach((status, index) => {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';

        let iconClass = 'pending';
        let icon = 'fas fa-circle';

        if (index < currentStatusIndex) {
            iconClass = 'completed';
            icon = 'fas fa-check';
        } else if (index === currentStatusIndex) {
            iconClass = 'current';
            icon = 'fas fa-clock';
        }

        timelineItem.innerHTML = `
            <div class="timeline-icon ${iconClass}">
                <i class="${icon}"></i>
            </div>
            <div class="timeline-content ${index === currentStatusIndex ? 'current' : ''}">
                <h4>${status.name}</h4>
                <p>${index === currentStatusIndex ? 'Status saat ini' : index < currentStatusIndex ? 'Selesai' : 'Menunggu'}</p>
            </div>
        `;

        timeline.appendChild(timelineItem);
    });

    document.getElementById('patientResult').style.display = 'block';
    document.getElementById('notFound').style.display = 'none';
}

// Update Dashboard Statistics
function updateDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const todayPatients = patients.filter(p => p.date === today);

    const totalPatients = todayPatients.length;
    const totalCompleted = todayPatients.filter(p => {
        const status = statuses.find(s => s.id === p.statusId);
        return status && status.name === 'Selesai';
    }).length;
    const totalInProgress = totalPatients - totalCompleted;

    document.getElementById('totalPatients').textContent = totalPatients;
    document.getElementById('totalInProgress').textContent = totalInProgress;
    document.getElementById('totalCompleted').textContent = totalCompleted;
}

// Switch Tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');

    // Render appropriate content
    if (tabName === 'patients') {
        renderPatientsTable();
    } else {
        renderMasterTab(tabName);
    }
}

// Render Patients Table
function renderPatientsTable() {
    const tbody = document.querySelector('#patientsTable tbody');
    tbody.innerHTML = '';

    patients.forEach(patient => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${patient.rm}</td>
            <td>${patient.name}</td>
            <td>${patient.age}</td>
            <td>${getDoctorName(patient.doctorId)}</td>
            <td>${getStatusName(patient.statusId)}</td>
            <td>${getInsuranceName(patient.insuranceId)}</td>
            <td>${formatDate(patient.date)}</td>
            <td>
                <button class="action-btn edit-btn" onclick="editPatient('${patient.rm}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="action-btn delete-btn" onclick="deletePatient('${patient.rm}')">
                    <i class="fas fa-trash"></i> Hapus
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Render Master Tabs
function renderMasterTabs() {
    renderMasterTab('doctors');
    renderMasterTab('statuses');
    renderMasterTab('insurance');
}

// Render Master Tab
function renderMasterTab(type) {
    const tabContent = document.getElementById(`${type}Tab`);
    let data, title, addButtonText;

    switch (type) {
        case 'doctors':
            data = doctors;
            title = 'Data Dokter';
            addButtonText = 'Tambah Dokter';
            break;
        case 'statuses':
            data = statuses;
            title = 'Data Status';
            addButtonText = 'Tambah Status';
            break;
        case 'insurance':
            data = insurance;
            title = 'Data Asuransi';
            addButtonText = 'Tambah Asuransi';
            break;
    }

    tabContent.innerHTML = `
        <div class="tab-header">
            <h3>${title}</h3>
            <button class="add-btn" data-action="add" data-type="${type}">
                <i class="fas fa-plus"></i> ${addButtonText}
            </button>
        </div>
        <div class="master-table">
            ${data.map(item => `
                <div class="master-item">
                    <span>${item.name}</span>
                    <div class="master-actions">
                        <button class="action-btn edit-btn" data-action="edit" data-type="${type}" data-id="${item.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn delete-btn" data-action="delete" data-type="${type}" data-id="${item.id}">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Add event listeners for the newly created buttons
    setupMasterTabEvents(tabContent, type);
}

// Setup event listeners for master tab buttons
function setupMasterTabEvents(tabContent, type) {
    // Add button event
    const addBtn = tabContent.querySelector('.add-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            showAddMasterModal(type);
        });
    }

    // Edit and delete button events
    const actionBtns = tabContent.querySelectorAll('.action-btn');
    actionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.dataset.action;
            const dataType = this.dataset.type;
            const id = parseInt(this.dataset.id);

            if (action === 'edit') {
                editMasterData(dataType, id);
            } else if (action === 'delete') {
                deleteMasterData(dataType, id);
            }
        });
    });
}

// Show Add Patient Modal
function showAddPatientModal() {
    currentEditingRM = null;
    document.getElementById('modalTitle').textContent = 'Tambah Pasien';
    document.getElementById('rmNumber').value = generateRMNumber();
    document.getElementById('patientNameInput').value = '';
    document.getElementById('patientAge').value = '';
    document.getElementById('patientDateInput').value = new Date().toISOString().split('T')[0];

    populateDropdowns();
    document.getElementById('patientModal').style.display = 'block';
}

// Generate RM Number
function generateRMNumber() {
    const lastRM = patients.length > 0 ? 
        Math.max(...patients.map(p => parseInt(p.rm.replace('RM', '')))) : 0;
    return `RM${String(lastRM + 1).padStart(4, '0')}`;
}

// Populate Dropdowns
function populateDropdowns() {
    // Doctors dropdown
    const doctorSelect = document.getElementById('patientDoctorSelect');
    doctorSelect.innerHTML = '<option value="">Pilih Dokter</option>';
    doctors.forEach(doctor => {
        doctorSelect.innerHTML += `<option value="${doctor.id}">${doctor.name}</option>`;
    });

    // Status dropdown
    const statusSelect = document.getElementById('patientStatusSelect');
    statusSelect.innerHTML = '<option value="">Pilih Status</option>';
    statuses.forEach(status => {
        statusSelect.innerHTML += `<option value="${status.id}">${status.name}</option>`;
    });

    // Insurance dropdown
    const insuranceSelect = document.getElementById('patientInsuranceSelect');
    insuranceSelect.innerHTML = '<option value="">Pilih Asuransi</option>';
    insurance.forEach(ins => {
        insuranceSelect.innerHTML += `<option value="${ins.id}">${ins.name}</option>`;
    });
}

// Edit Patient
function editPatient(rmNumber) {
    const patient = patients.find(p => p.rm === rmNumber);
    if (!patient) return;

    currentEditingRM = rmNumber;
    document.getElementById('modalTitle').textContent = 'Edit Pasien';
    document.getElementById('rmNumber').value = patient.rm;
    document.getElementById('patientNameInput').value = patient.name;
    document.getElementById('patientAge').value = patient.age;
    document.getElementById('patientDateInput').value = patient.date;

    populateDropdowns();

    document.getElementById('patientDoctorSelect').value = patient.doctorId;
    document.getElementById('patientStatusSelect').value = patient.statusId;
    document.getElementById('patientInsuranceSelect').value = patient.insuranceId;

    document.getElementById('patientModal').style.display = 'block';
}

// Save Patient
function savePatient(e) {
    e.preventDefault();

    const rmNumber = document.getElementById('rmNumber').value;
    const name = document.getElementById('patientNameInput').value;
    const age = parseInt(document.getElementById('patientAge').value);
    const doctorId = parseInt(document.getElementById('patientDoctorSelect').value);
    const statusId = parseInt(document.getElementById('patientStatusSelect').value);
    const insuranceId = parseInt(document.getElementById('patientInsuranceSelect').value);
    const date = document.getElementById('patientDateInput').value;

    const patientData = {
        rm: rmNumber,
        name,
        age,
        doctorId,
        statusId,
        insuranceId,
        date
    };

    if (currentEditingRM) {
        // Update existing patient
        const index = patients.findIndex(p => p.rm === currentEditingRM);
        patients[index] = patientData;
    } else {
        // Add new patient
        patients.push(patientData);
    }

    saveData();
    renderPatientsTable();
    updateDashboard();
    document.getElementById('patientModal').style.display = 'none';
}

// Delete Patient
function deletePatient(rmNumber) {
    if (confirm('Apakah Anda yakin ingin menghapus data pasien ini?')) {
        patients = patients.filter(p => p.rm !== rmNumber);
        saveData();
        renderPatientsTable();
        updateDashboard();
    }
}

// Show Add Master Modal
function showAddMasterModal(type) {
    currentMasterType = type;
    currentEditingId = null;

    let title;
    switch (type) {
        case 'doctors':
            title = 'Tambah Dokter';
            break;
        case 'statuses':
            title = 'Tambah Status';
            break;
        case 'insurance':
            title = 'Tambah Asuransi';
            break;
    }

    document.getElementById('masterModalTitle').textContent = title;
    document.getElementById('masterName').value = '';
    document.getElementById('masterModal').style.display = 'block';
}

// Edit Master Data
function editMasterData(type, id) {
    let data, item, title;

    switch (type) {
        case 'doctors':
            data = doctors;
            title = 'Edit Dokter';
            break;
        case 'statuses':
            data = statuses;
            title = 'Edit Status';
            break;
        case 'insurance':
            data = insurance;
            title = 'Edit Asuransi';
            break;
    }

    item = data.find(i => i.id === id);
    if (!item) return;

    currentMasterType = type;
    currentEditingId = id;

    document.getElementById('masterModalTitle').textContent = title;
    document.getElementById('masterName').value = item.name;
    document.getElementById('masterModal').style.display = 'block';
}

// Save Master Data
function saveMasterData(e) {
    e.preventDefault();

    const name = document.getElementById('masterName').value.trim();
    if (!name) return;

    let data;
    switch (currentMasterType) {
        case 'doctors':
            data = doctors;
            break;
        case 'statuses':
            data = statuses;
            break;
        case 'insurance':
            data = insurance;
            break;
    }

    if (currentEditingId) {
        // Update existing
        const index = data.findIndex(i => i.id === currentEditingId);
        data[index].name = name;
    } else {
        // Add new
        const newId = data.length > 0 ? Math.max(...data.map(i => i.id)) + 1 : 1;
        data.push({ id: newId, name });
    }

    saveData();
    renderMasterTab(currentMasterType);
    document.getElementById('masterModal').style.display = 'none';
}

// Delete Master Data
function deleteMasterData(type, id) {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
        switch (type) {
            case 'doctors':
                doctors = doctors.filter(d => d.id !== id);
                break;
            case 'statuses':
                statuses = statuses.filter(s => s.id !== id);
                break;
            case 'insurance':
                insurance = insurance.filter(i => i.id !== id);
                break;
        }

        saveData();
        renderMasterTab(type);
    }
}

// Export to Excel
function exportToExcel() {
    const data = patients.map(patient => ({
        'No. RM': patient.rm,
        'Nama': patient.name,
        'Usia': patient.age,
        'Dokter': getDoctorName(patient.doctorId),
        'Status': getStatusName(patient.statusId),
        'Asuransi': getInsuranceName(patient.insuranceId),
        'Tanggal': formatDate(patient.date)
    }));

    // Create CSV content
    const headers = Object.keys(data[0] || {});
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `data-pasien-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Backup to CSV
function backupCSV() {
  // Combine all data into a single object
  const allData = {
    patients: patients,
    doctors: doctors,
    statuses: statuses,
    insurance: insurance
  };

  // Convert the combined data to CSV format
  let csvContent = "data:text/csv;charset=utf-8,";

  // Add headers for each data type
  for (const dataType in allData) {
    const data = allData[dataType];
    if (data.length === 0) continue; // Skip empty data

    const headers = Object.keys(data[0]);
    csvContent += dataType.toUpperCase() + "\n"; // Add data type as section header
    csvContent += headers.join(",") + "\n";

    // Add rows
    data.forEach(item => {
      const row = headers.map(header => {
        let value = item[header];
        if (typeof value === 'string') {
          value = value.replace(/"/g, '""'); // Escape double quotes
          return `"${value}"`;
        }
        return value;
      }).join(",");
      csvContent += row + "\n";
    });
    csvContent += "\n"; // Add an empty line between data types
  }

  // Create a download link
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "backup.csv");
  document.body.appendChild(link); // Required for Firefox

  link.click(); // Trigger download
  document.body.removeChild(link); // Clean up
}


// Helper Functions
function getDoctorName(id) {
    const doctor = doctors.find(d => d.id === id);
    return doctor ? doctor.name : '-';
}

function getStatusName(id) {
    const status = statuses.find(s => s.id === id);
    return status ? status.name : '-';
}

function getInsuranceName(id) {
    const ins = insurance.find(i => i.id === id);
    return ins ? ins.name : '-';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}