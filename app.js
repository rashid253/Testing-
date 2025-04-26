// app.js
document.addEventListener('DOMContentLoaded', async () => {
  // --- IndexedDB helpers ---
  const { get, set } = window.idbKeyval;

  // --- State ---
  let students = await get('students') || [];
  let attendanceRecords = await get('attendanceRecords') || [];
  let editingEnabled = true;

  // --- DOM Elements: Registration ---
  const studentFormGroup   = document.getElementById('studentFormGroup');
  const studentNameInput   = document.getElementById('studentName');
  const addStudentBtn      = document.getElementById('addStudent');
  const studentsTableBody  = document.getElementById('studentsTableBody');
  const saveTableBtn       = document.getElementById('saveTable');
  const shareTableBtn      = document.getElementById('shareTable');
  const downloadTableBtn   = document.getElementById('downloadTable');
  const editTableBtn       = document.getElementById('editTable');

  // --- DOM Elements: Attendance ---
  const attendanceContainer      = document.getElementById('attendanceContainer');
  const attendanceSummaryDiv     = document.getElementById('attendanceSummary');
  const attendanceSummaryList    = document.getElementById('attendanceSummaryList');
  const shareAttendanceBtn       = document.getElementById('shareAttendance');
  const downloadAttendanceBtn    = document.getElementById('downloadAttendance');

  // --- DOM Elements: Register Section ---
  const attendanceRecordsContainer = document.getElementById('attendanceRecordsContainer');

  // --- Helpers: save state ---
  async function saveStudents() {
    await set('students', students);
  }
  async function saveAttendanceRecords() {
    await set('attendanceRecords', attendanceRecords);
  }

  // --- Registration: render student table ---
  function renderStudentTable() {
    studentsTableBody.innerHTML = '';
    students.forEach((s, idx) => {
      const tr = document.createElement('tr');
      tr.dataset.adm = s.adm;
      tr.innerHTML = `
        <td>${idx+1}</td>
        <td>${s.adm}</td>
        <td class="student-name">${s.name}</td>
        <td>
          ${editingEnabled
            ? `<button class="btn btn-link p-0 edit-btn"><i class="fa fa-pencil"></i></button>
               <button class="btn btn-link p-0 text-danger delete-btn"><i class="fa fa-trash"></i></button>`
            : ''}
        </td>`;
      studentsTableBody.appendChild(tr);
    });
  }

  // --- Registration: add student ---
  addStudentBtn.addEventListener('click', async () => {
    if (!editingEnabled) return;
    const name = studentNameInput.value.trim();
    if (!name) return;
    const nextAdm = students.reduce((max, s) => Math.max(max, s.adm), 0) + 1;
    students.push({ adm: nextAdm, name });
    await saveStudents();
    renderStudentTable();
    studentNameInput.value = '';
    renderAttendanceForm();
  });

  // --- Registration: Save/Edit table controls ---
  saveTableBtn.addEventListener('click', () => {
    editingEnabled = false;
    studentFormGroup.classList.add('d-none');
    saveTableBtn.classList.add('d-none');
    shareTableBtn.classList.remove('d-none');
    downloadTableBtn.classList.remove('d-none');
    editTableBtn.classList.remove('d-none');
    renderStudentTable();
  });

  editTableBtn.addEventListener('click', () => {
    editingEnabled = true;
    studentFormGroup.classList.remove('d-none');
    saveTableBtn.classList.remove('d-none');
    shareTableBtn.classList.add('d-none');
    downloadTableBtn.classList.add('d-none');
    editTableBtn.classList.add('d-none');
    renderStudentTable();
  });

  // --- Registration: Share/Download table PDF ---
  shareTableBtn.addEventListener('click', () => generateStudentPDF('share'));
  downloadTableBtn.addEventListener('click', () => generateStudentPDF('download'));

  function generateStudentPDF(mode) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text('Student List', 14, 15);
    const body = students.map((s, i) => [i+1, s.adm, s.name]);
    doc.autoTable({
      head: [['Sr#','Adm No','Name']],
      body,
      startY: 20,
      headStyles: { fillColor: [40,40,40] }
    });
    const filename = 'Student_List.pdf';
    if (mode==='share' && navigator.canShare) {
      const blob = doc.output('blob');
      const file = new File([blob], filename, { type:'application/pdf' });
      navigator.share({ files:[file], title: filename }).catch(()=>doc.save(filename));
    } else {
      doc.save(filename);
    }
  }

  // --- Registration: edit/delete row ---
  studentsTableBody.addEventListener('click', async e => {
    const tr = e.target.closest('tr');
    if (!tr) return;
    const adm = parseInt(tr.dataset.adm,10);
    // Edit
    if (e.target.closest('.edit-btn')) {
      if (tr.classList.contains('editing')) return;
      tr.classList.add('editing');
      const nameTd = tr.querySelector('.student-name');
      const orig = nameTd.textContent;
      tr.dataset.orig = orig;
      nameTd.innerHTML = `<input type="text" class="form-control form-control-sm" value="${orig}">`;
      const actionsTd = tr.lastElementChild;
      actionsTd.innerHTML = `
        <button class="btn btn-link p-0 save-btn"><i class="fa fa-check text-success"></i></button>
        <button class="btn btn-link p-0 cancel-btn"><i class="fa fa-times text-danger"></i></button>`;
    }
    // Save edit
    if (e.target.closest('.save-btn')) {
      const input = tr.querySelector('input');
      const val = input.value.trim();
      if (val) {
        const student = students.find(s=>s.adm===adm);
        student.name = val;
        await saveStudents();
      }
      tr.classList.remove('editing');
      renderStudentTable();
      renderAttendanceForm();
    }
    // Cancel edit
    if (e.target.closest('.cancel-btn')) {
      tr.classList.remove('editing');
      renderStudentTable();
    }
    // Delete
    if (e.target.closest('.delete-btn')) {
      if (confirm('Delete this student?')) {
        students = students.filter(s=>s.adm!==adm);
        await saveStudents();
        renderStudentTable();
        renderAttendanceForm();
      }
    }
  });

  // --- Attendance: render form ---
  function renderAttendanceForm() {
    attendanceSummaryDiv.classList.add('d-none');
    attendanceContainer.innerHTML = '';
    if (students.length === 0) {
      attendanceContainer.innerHTML = '<p class="text-muted">No students registered.</p>';
      return;
    }
    const tbl = document.createElement('table');
    tbl.className = 'table table-striped';
    tbl.innerHTML = `
      <thead class="table-dark"><tr>
        <th>Sr#</th><th>Name</th><th>Present</th>
      </tr></thead>
      <tbody id="attendanceTableBody"></tbody>`;
    attendanceContainer.append(tbl);
    const tb = tbl.querySelector('#attendanceTableBody');
    students.forEach((s,i) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${i+1}</td>
        <td>${s.name}</td>
        <td><input type="checkbox" class="form-check-input attendance-checkbox"></td>`;
      tb.append(row);
    });
    const saveBtn = document.createElement('button');
    saveBtn.id = 'saveAttendance';
    saveBtn.className = 'btn btn-primary';
    saveBtn.textContent = 'Save Attendance';
    attendanceContainer.append(saveBtn);
    saveBtn.addEventListener('click', saveAttendance);
  }

  // --- Attendance: save ---
  async function saveAttendance() {
    const checkboxes = attendanceContainer.querySelectorAll('.attendance-checkbox');
    const summary = [];
    checkboxes.forEach((cb,i) => {
      summary.push({ name: students[i].name, status: cb.checked ? 'Present' : 'Absent' });
    });
    // hide form
    attendanceContainer.innerHTML = '';
    // show summary
    attendanceSummaryList.innerHTML = '';
    summary.forEach(item => {
      const li = document.createElement('li');
      li.className = 'list-group-item';
      li.innerHTML = `
        ${item.name} -
        <span class="${item.status==='Present'?'text-success':'text-danger'}">${item.status}</span>`;
      attendanceSummaryList.append(li);
    });
    attendanceSummaryDiv.classList.remove('d-none');
    // store record
    const timestamp = new Date().toLocaleString();
    attendanceRecords.push({ date: timestamp, list: summary });
    await saveAttendanceRecords();
    renderAttendanceRecords();
  }

  // --- Attendance: share/download summary ---
  shareAttendanceBtn.addEventListener('click', () => generateAttendancePDF('share'));
  downloadAttendanceBtn.addEventListener('click', () => generateAttendancePDF('download'));

  function generateAttendancePDF(mode) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const title = attendanceRecords.slice(-1)[0];
    doc.text(`Attendance: ${title.date}`, 14, 15);
    const body = title.list.map((it,i)=>[i+1, it.name, it.status]);
    doc.autoTable({
      head:[['Sr#','Name','Status']],
      body, startY:20,
      headStyles:{ fillColor:[40,40,40] }
    });
    const fname = `Attendance_${title.date.replace(/[,: ]/g,'_')}.pdf`;
    if (mode==='share' && navigator.canShare) {
      doc.save(fname);
      try {
        const blob = doc.output('blob');
        const file = new File([blob], fname, { type:'application/pdf' });
        navigator.share({ files:[file], title: fname });
      } catch {}
    } else {
      doc.save(fname);
    }
  }

  // --- Register: render past records ---
  function renderAttendanceRecords() {
    attendanceRecordsContainer.innerHTML = '';
    if (attendanceRecords.length===0) {
      attendanceRecordsContainer.innerHTML = '<p class="text-muted">No attendance records.</p>';
      return;
    }
    attendanceRecords.forEach((rec, idx) => {
      const card = document.createElement('div');
      card.className = 'card mb-3';
      let items = '';
      rec.list.forEach(it => {
        items += `<li class="list-group-item">${it.name} - <span class="${it.status==='Present'?'text-success':'text-danger'}">${it.status}</span></li>`;
      });
      card.innerHTML = `
        <div class="card-body">
          <h5 class="card-title">Date: ${rec.date}</h5>
          <ul class="list-group mb-2">${items}</ul>
          <button class="btn btn-info btn-sm share-rec" data-idx="${idx}"><i class="fa fa-share-alt me-1"></i>Share</button>
          <button class="btn btn-secondary btn-sm download-rec" data-idx="${idx}"><i class="fa fa-download me-1"></i>Download</button>
        </div>`;
      attendanceRecordsContainer.append(card);
    });
  }

  // --- Register: share/download each record ---
  attendanceRecordsContainer.addEventListener('click', e => {
    const shareBtn = e.target.closest('.share-rec');
    const dlBtn    = e.target.closest('.download-rec');
    if (shareBtn) {
      const idx = parseInt(shareBtn.dataset.idx,10);
      generateSpecificRecordPDF(idx,'share');
    }
    if (dlBtn) {
      const idx = parseInt(dlBtn.dataset.idx,10);
      generateSpecificRecordPDF(idx,'download');
    }
  });
  function generateSpecificRecordPDF(idx, mode) {
    const rec = attendanceRecords[idx];
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text(`Attendance: ${rec.date}`, 14, 15);
    const body = rec.list.map((it,i)=>[i+1, it.name, it.status]);
    doc.autoTable({ head:[['Sr#','Name','Status']], body, startY:20 });
    const fname = `Attendance_${rec.date.replace(/[,: ]/g,'_')}.pdf`;
    if (mode==='share' && navigator.canShare) {
      doc.save(fname);
      try {
        const blob = doc.output('blob');
        const file = new File([blob], fname, { type:'application/pdf' });
        navigator.share({ files:[file], title: fname });
      } catch {}
    } else {
      doc.save(fname);
    }
  }

  // --- Initial render ---
  renderStudentTable();
  renderAttendanceForm();
  renderAttendanceRecords();
});
