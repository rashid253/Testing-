// app.js
window.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const THRESHOLD = 75;
  const colors = { P:'var(--success)', A:'var(--danger)', Lt:'var(--warning)', HD:'var(--orange)', L:'var(--info)' };

  //
  // 1. SETUP
  //
  const schoolIn      = $('schoolNameInput'),
        classSel      = $('teacherClassSelect'),
        secSel        = $('teacherSectionSelect'),
        saveSetupBtn  = $('saveSetup'),
        setupForm     = $('setupForm'),
        setupDisplay  = $('setupDisplay'),
        setupText     = $('setupText'),
        editSetupBtn  = $('editSetup');

  function loadSetup() {
    const school = localStorage.getItem('schoolName'),
          cls    = localStorage.getItem('teacherClass'),
          sec    = localStorage.getItem('teacherSection');
    if (school && cls && sec) {
      schoolIn.value        = school;
      classSel.value        = cls;
      secSel.value          = sec;
      setupText.textContent = `${school} 🏫 | Class: ${cls} | Section: ${sec}`;
      setupForm.classList.add('hidden');
      setupDisplay.classList.remove('hidden');
    }
  }
  saveSetupBtn.onclick = e => {
    e.preventDefault();
    if (!schoolIn.value || !classSel.value || !secSel.value) {
      alert('Complete setup'); return;
    }
    localStorage.setItem('schoolName', schoolIn.value);
    localStorage.setItem('teacherClass', classSel.value);
    localStorage.setItem('teacherSection', secSel.value);
    loadSetup();
  };
  editSetupBtn.onclick = e => { e.preventDefault(); setupForm.classList.remove('hidden'); setupDisplay.classList.add('hidden'); };
  loadSetup();

  //
  // 2. STUDENT REGISTRATION (unchanged)
  //
  // … your existing registration code …

  //
  // 3. ATTENDANCE MARKING
  //
  let attendanceData = JSON.parse(localStorage.getItem('attendanceData')||'{}');
  const dateInput      = $('dateInput'),
        loadAttBtn     = $('loadAttendance'),
        attList        = $('attendanceList'),
        saveAttBtn     = $('saveAttendance');

  // **NEW: Load Attendance Handler**
  loadAttBtn.onclick = e => {
    e.preventDefault();
    const date = dateInput.value;
    if (!date) { alert('Pick a date'); return; }
    attList.innerHTML = '';
    students.forEach(s => {
      const nameDiv = document.createElement('div');
      nameDiv.className = 'attendance-item';
      nameDiv.textContent = s.name;

      const btnDiv = document.createElement('div');
      btnDiv.className = 'attendance-actions';

      ['P','A','Lt','HD','L'].forEach(code => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'att-btn';
        btn.textContent = code;
        btn.dataset.code = code;
        // restore previous
        if (attendanceData[date]?.[s.roll] === code) {
          btn.style.background = colors[code];
          btn.style.color = '#fff';
        }
        btn.onclick = ev => {
          ev.preventDefault();
          // clear others
          btnDiv.querySelectorAll('.att-btn').forEach(x => { x.style.background=''; x.style.color='var(--dark)'; });
          btn.style.background = colors[code];
          btn.style.color = '#fff';
        };
        btnDiv.appendChild(btn);
      });

      attList.appendChild(nameDiv);
      attList.appendChild(btnDiv);
    });
    saveAttBtn.classList.remove('hidden');
  };

  saveAttBtn.onclick = e => {
    e.preventDefault();
    const date = dateInput.value;
    attendanceData[date] = {};
    document.querySelectorAll('.attendance-actions').forEach((div,i) => {
      const sel = div.querySelector('.att-btn[style*="background"]');
      attendanceData[date][students[i].roll] = sel ? sel.dataset.code : 'A';
    });
    localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
    alert('Attendance saved for ' + date);
  };

  //
  // 4. ATTENDANCE ANALYTICS
  //
  const analyticsType  = $('analyticsType'),
        analyticsDate  = $('analyticsDate'),
        analyticsMonth = $('analyticsMonth'),
        semStart       = $('semesterStart'),
        semEnd         = $('semesterEnd'),
        yearStart      = $('yearStart'),
        loadAnBtn      = $('loadAnalytics'),
        analyticsCont  = $('analyticsContainer'),
        graphsEl       = $('graphs'),
        shareAnBtn     = $('shareAnalytics'),
        downloadAnBtn  = $('downloadAnalytics');

  analyticsType.onchange = () => {
    [analyticsDate,analyticsMonth,semStart,semEnd,yearStart,analyticsCont,graphsEl,shareAnBtn,downloadAnBtn]
      .forEach(el => el.classList.add('hidden'));
    if (analyticsType.value==='date') analyticsDate.classList.remove('hidden');
    if (analyticsType.value==='month') analyticsMonth.classList.remove('hidden');
    if (analyticsType.value==='semester') { semStart.classList.remove('hidden'); semEnd.classList.remove('hidden'); }
    if (analyticsType.value==='year')  yearStart.classList.remove('hidden');
  };

  // **NEW: Load Analytics Handler**
  loadAnBtn.onclick = e => {
    e.preventDefault();
    let from, to;
    if (analyticsType.value==='date') {
      if (!analyticsDate.value) { alert('Pick a date'); return; }
      from = to = analyticsDate.value;
    } else if (analyticsType.value==='month') {
      if (!analyticsMonth.value) { alert('Pick a month'); return; }
      from = analyticsMonth.value + '-01';
      to   = analyticsMonth.value + '-31';
    } else if (analyticsType.value==='semester') {
      if (!semStart.value||!semEnd.value) { alert('Pick range'); return; }
      from = semStart.value + '-01'; to = semEnd.value + '-31';
    } else if (analyticsType.value==='year') {
      if (!yearStart.value) { alert('Pick year'); return; }
      from = yearStart.value + '-01-01'; to = yearStart.value + '-12-31';
    } else return;

    // compute stats
    const stats = students.map(s=>({ name:s.name, P:0,A:0,Lt:0,HD:0,L:0, total:0 }));
    Object.entries(attendanceData).forEach(([d,recs])=>{
      if (d>=from && d<=to) stats.forEach((st,i)=>{
        const c = recs[st.roll]||'A';
        st[c]++; st.total++;
      });
    });

    // render table
    let html = '<table><thead><tr><th>Name</th><th>P</th><th>A</th><th>Lt</th><th>HD</th><th>L</th><th>Total</th><th>%</th></tr></thead><tbody>';
    stats.forEach(s=>{
      const pct = s.total?((s.P/s.total)*100).toFixed(1):'0.0';
      html += `<tr><td>${s.name}</td><td>${s.P}</td><td>${s.A}</td><td>${s.Lt}</td><td>${s.HD}</td><td>${s.L}</td><td>${s.total}</td><td>${pct}</td></tr>`;
    });
    html += '</tbody></table>';
    analyticsCont.innerHTML = html;
    analyticsCont.classList.remove('hidden');
    graphsEl.classList.remove('hidden');
    shareAnBtn.classList.remove('hidden');
    downloadAnBtn.classList.remove('hidden');

    // charts
    const labels = stats.map(s=>s.name),
          dataPct = stats.map(s=> s.total? s.P/s.total*100:0 );
    new Chart(document.getElementById('barChart').getContext('2d'), {
      type:'bar', data:{ labels, datasets:[{ label:'% Present', data:dataPct }] },
      options:{ responsive:true }
    });
    const agg = stats.reduce((a,s)=>{ ['P','A','Lt','HD','L'].forEach(c=>a[c]+=s[c]); return a; },{P:0,A:0,Lt:0,HD:0,L:0});
    new Chart(document.getElementById('pieChart').getContext('2d'), {
      type:'pie', data:{ labels:['P','A','Lt','HD','L'], datasets:[{ data:Object.values(agg) }] },
      options:{ responsive:true }
    });
  };
});
