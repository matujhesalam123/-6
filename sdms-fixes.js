(function () {
  // Defensive fixes for missing functions & variables in index.html
  // This file is intended to be included at the end of index.html (before </body>). 
  try {
    // Avoid redefining if already present
    if (typeof window.loadTeacherCardData === 'undefined') {
      window.loadTeacherCardData = function (teacherId) {
        try {
          var tlist = window.masterTeacherData || [];
          var sel = document.getElementById('sidebarTeacherSelect');
          if (!teacherId || teacherId === 'ALL') {
            console.log('loadTeacherCardData: nothing selected or ALL');
            if (sel) sel.value = 'ALL';
            return;
          }
          var teacher = tlist.find(function (t) { return String(t.id) === String(teacherId) || String(t.code) === String(teacherId); });
          if (!teacher) {
            console.warn('Teacher not found for id:', teacherId);
            var target = document.getElementById('exportableProfileCard') || document.body;
            var note = document.createElement('div');
            note.className = 'p-3 bg-teal-50 border border-teal-200 rounded text-teal-900 text-xs';
            note.innerText = 'Selected teacher के लिए डेटा उपलब्ध नहीं है: ' + teacherId;
            var prev = document.getElementById('teacherCardPlaceholder');
            if (prev) prev.remove();
            note.id = 'teacherCardPlaceholder';
            target.insertBefore(note, target.firstChild);
            return;
          }
          var html = '<div class="p-3 rounded border bg-white text-xs shadow-sm">';
          html += '<div class="font-bold text-sm">' + (teacher.name || teacher.displayName || 'Teacher') + '</div>';
          html += '<div class="text-[11px] text-slate-600">Code: ' + (teacher.code || teacher.id) + '</div>';
          html += '<div class="text-[11px] mt-1">Subject: ' + (teacher.subject || '—') + '</div>';
          html += '</div>';
          var prev = document.getElementById('teacherCardPlaceholder');
          if (prev) prev.remove();
          var container = document.getElementById('exportableProfileCard') || document.getElementById('section-profile-card') || document.body;
          var wrapper = document.createElement('div');
          wrapper.id = 'teacherCardPlaceholder';
          wrapper.className = 'mb-2';
          wrapper.innerHTML = html;
          container.insertBefore(wrapper, container.firstChild);
        } catch (e) {
          console.error('loadTeacherCardData error:', e);
        }
      };
    }

    if (typeof window.filterSidebarTeacherDropdown === 'undefined') {
      window.filterSidebarTeacherDropdown = function (query) {
        try {
          var sel = document.getElementById('sidebarTeacherSelect');
          if (!sel) return;
          var q = String(query || '').trim().toLowerCase();
          for (var i = 0; i < sel.options.length; i++) {
            var opt = sel.options[i];
            var text = (opt.text || '').toLowerCase();
            opt.style.display = (q === '' || text.indexOf(q) !== -1) ? '' : 'none';
          }
        } catch (e) {
          console.error('filterSidebarTeacherDropdown error:', e);
        }
      };
    }

    if (typeof window.previewStudentPhoto === 'undefined') {
      window.previewStudentPhoto = function (fileInput) {
        try {
          var preview = document.getElementById('formPhotoPreview');
          if (!fileInput || !fileInput.files || fileInput.files.length === 0) return;
          var f = fileInput.files[0];
          var reader = new FileReader();
          reader.onload = function (ev) {
            if (preview) preview.src = ev.target.result;
          };
          reader.readAsDataURL(f);
        } catch (e) {
          console.error('previewStudentPhoto error:', e);
        }
      };
    }

    // --- Master Grid core variables (prevent ReferenceError) ---
    window.masterGridColumns = window.masterGridColumns || [
      { key: 'scholar', label: 'Scholar No.' },
      { key: 'name', label: 'Name' },
      { key: 'class', label: 'Class' },
      { key: 'section', label: 'Section' },
      { key: 'rollNo', label: 'Roll No.' }
    ];

    window.gridSortColumn = window.gridSortColumn || null;
    window.gridSortAscending = (typeof window.gridSortAscending === 'boolean') ? window.gridSortAscending : true;
    window.gridColumnFilters = window.gridColumnFilters || {};

    window.masterStudentData = window.masterStudentData || [];

    function el(tag, classes, text) {
      var d = document.createElement(tag);
      if (classes) d.className = classes;
      if (text !== undefined) d.textContent = text;
      return d;
    }

    if (typeof window.renderMasterGrid === 'undefined') {
      window.renderMasterGrid = function () {
        try {
          var headerTr = document.getElementById('masterGridHeaderTr');
          var filterTr = document.getElementById('masterGridFilterTr');
          var tbody = document.getElementById('masterGridTbody');
          if (!headerTr || !tbody || !filterTr) {
            console.warn('renderMasterGrid: table elements not found');
            return;
          }

          headerTr.innerHTML = '';
          masterGridColumns.forEach(function (col) {
            var th = document.createElement('th');
            th.className = 'px-2 py-1 text-left';
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'text-xs font-bold';
            btn.textContent = col.label;
            btn.onclick = function () {
              if (gridSortColumn === col.key) gridSortAscending = !gridSortAscending;
              else { gridSortColumn = col.key; gridSortAscending = true; }
              window.applyMasterGridFilters();
            };
            th.appendChild(btn);
            headerTr.appendChild(th);
          });

          filterTr.innerHTML = '';
          masterGridColumns.forEach(function (col) {
            var th = document.createElement('th');
            th.className = 'px-2 py-1';
            var input = document.createElement('input');
            input.className = 'w-full text-xs p-1 rounded bg-indigo-900/10 text-white/90';
            input.placeholder = 'Filter';
            input.dataset.colKey = col.key;
            input.oninput = function () {
              gridColumnFilters[col.key] = input.value;
              window.applyMasterGridFilters();
            };
            th.appendChild(input);
            filterTr.appendChild(th);
          });

          tbody.innerHTML = '';
          var rows = Array.from(masterStudentData || []);
          rows = rows.filter(function (r) {
            var keep = true;
            for (var k in gridColumnFilters) {
              if (!gridColumnFilters[k]) continue;
              var val = (String(r[k] || '')).toLowerCase();
              if (val.indexOf(String(gridColumnFilters[k]).toLowerCase()) === -1) {
                keep = false; break;
              }
            }
            return keep;
          });

          if (gridSortColumn) {
            rows.sort(function (a, b) {
              var va = (a[gridSortColumn] || '').toString().toLowerCase();
              var vb = (b[gridSortColumn] || '').toString().toLowerCase();
              if (va < vb) return gridSortAscending ? -1 : 1;
              if (va > vb) return gridSortAscending ? 1 : -1;
              return 0;
            });
          }

          rows.slice(0, 200).forEach(function (r) {
            var tr = document.createElement('tr');
            tr.className = 'hover:bg-indigo-50';
            masterGridColumns.forEach(function (col) {
              var td = document.createElement('td');
              td.className = 'px-2 py-1 align-middle text-xs';
              td.textContent = (r[col.key] !== undefined && r[col.key] !== null) ? r[col.key] : '';
              tr.appendChild(td);
            });
            tbody.appendChild(tr);
          });

          var badge = document.getElementById('gridFilteredCountBadge');
          if (badge) badge.textContent = (rows.length || 0) + ' छात्र प्रदर्शित';
        } catch (e) {
          console.error('renderMasterGrid error:', e);
        }
      };
    }

    if (typeof window.applyMasterGridFilters === 'undefined') {
      window.applyMasterGridFilters = function () {
        try {
          var global = (document.getElementById('gridGlobalSearchInput') || {}).value || '';
          if (global) {
            gridColumnFilters.name = global;
            gridColumnFilters.scholar = global;
          }
          var cls = (document.getElementById('gridClassFilter') || {}).value;
          if (cls && cls !== 'ALL') gridColumnFilters['class'] = cls;
          else delete gridColumnFilters['class'];

          var sec = (document.getElementById('gridSectionFilter') || {}).value;
          if (sec && sec !== 'ALL') gridColumnFilters['section'] = sec;
          else delete gridColumnFilters['section'];

          window.renderMasterGrid();
        } catch (e) {
          console.error('applyMasterGridFilters error:', e);
        }
      };
    }

    if (typeof window.resetMasterGridFilters === 'undefined') {
      window.resetMasterGridFilters = function () {
        try {
          gridColumnFilters = {};
          var inputs = document.querySelectorAll('#masterGridFilterTr input');
          inputs.forEach(function (i) { i.value = ''; });
          var selects = ['gridClassFilter', 'gridSectionFilter', 'gridCategoryFilter', 'gridConditionFilter'];
          selects.forEach(function (id) {
            var s = document.getElementById(id);
            if (s) s.value = 'ALL';
          });
          window.applyMasterGridFilters();
        } catch (e) {
          console.error('resetMasterGridFilters error:', e);
        }
      };
    }

    function setActiveTitle(title) {
      var el = document.getElementById('currentActiveSectionTitle');
      if (el) el.textContent = 'अनुभाग: ' + title;
    }

    function placeHolderContent(sectionId, title) {
      try {
        setActiveTitle(title);
        var sec = document.getElementById('section-' + sectionId);
        if (!sec) {
          console.warn('placeHolderContent: section not found:', sectionId);
          return;
        }
        var prev = sec.querySelector('.placeholder-note');
        if (prev) prev.remove();
        var d = document.createElement('div');
        d.className = 'placeholder-note bg-yellow-50 border border-yellow-200 p-3 rounded text-xs';
        d.innerHTML = '<strong>' + title + '</strong> — यह सेक्शन अभी आधारभूत placeholder से लोड किया गया है। पूर्ण कार्यान्वयन के लिए स्क्रिप्ट अपडेट करें।';
        sec.insertBefore(d, sec.firstChild);
      } catch (e) {
        console.error('placeHolderContent error:', e);
      }
    }

    if (typeof window.renderSubjectMaster === 'undefined') {
      window.renderSubjectMaster = function () { placeHolderContent('subject-master', 'विषय मास्टर (Subject Master)'); };
    }
    if (typeof window.renderMarksConfig === 'undefined') {
      window.renderMarksConfig = function () { placeHolderContent('marks-config', 'कक्षा थ्योरी/प्रैक्टिकल सेटिंग्स (Marks Config)'); };
    }
    if (typeof window.renderExamMarksEntryTable === 'undefined') {
      window.renderExamMarksEntryTable = function () { placeHolderContent('exam-marks', 'परीक्षा अंक प्रविष्टि (Exam Marks Entry)'); };
    }
    if (typeof window.renderConsolidatedReport === 'undefined') {
      window.renderConsolidatedReport = function () { placeHolderContent('consolidated-report', 'एकजाई शाला परिणाम रिपोर्ट (Consolidated Report)'); };
    }
    if (typeof window.renderClassExamReport === 'undefined') {
      window.renderClassExamReport = function () { placeHolderContent('class-exam-report', 'कक्षा-सेक्शन विस्तृत रिपोर्ट (Class Exam Report)'); };
    }
    if (typeof window.renderBookMaster === 'undefined') {
      window.renderBookMaster = function () { placeHolderContent('book-master', 'पुस्तकालय व पाठ्यपुस्तक मास्टर (Book Master)'); };
    }

    if (typeof window.showSection === 'undefined') {
      window.showSection = function (id) {
        try {
          var sections = document.querySelectorAll('.content-section');
          sections.forEach(function (s) {
            s.classList.add('hidden');
          });
          var target = document.getElementById('section-' + id) || document.getElementById(id);
          if (target) {
            target.classList.remove('hidden');
            var tabs = document.querySelectorAll('.tab-btn');
            tabs.forEach(function (t) { t.classList.remove('active'); });
            var btn = document.getElementById('btn-' + id);
            if (btn) btn.classList.add('active');
            setActiveTitle((target.querySelector('h2, h3') || {}).textContent || id);
          } else {
            console.warn('showSection: target not found for id:', id);
          }

          if (id === 'master-grid' && typeof window.renderMasterGrid === 'function') window.renderMasterGrid();
          if (id === 'profile-card' && typeof window.renderProfileCards === 'function') window.renderProfileCards();
          if (id === 'combined-forms' && typeof window.renderCombinedOfficialForms === 'function') window.renderCombinedOfficialForms();
        } catch (e) {
          console.error('showSection fallback error:', e);
        }
      };
    }

    document.addEventListener('DOMContentLoaded', function () {
      try {
        setTimeout(function () {
          if (document.getElementById('section-master-grid') && !document.getElementById('section-master-grid').classList.contains('hidden')) {
            window.renderMasterGrid();
          }
        }, 30);
      } catch (e) {
        console.error('initial render error:', e);
      }
    });

    window.seedDemoStudents = function (count) {
      count = count || 20;
      var arr = [];
      for (var i = 1; i <= count; i++) {
        arr.push({
          scholar: String(1000 + i),
          name: 'छात्र ' + i,
          class: (i % 2 === 0) ? '10th' : '9th',
          section: (i % 3 === 0) ? 'B' : 'A',
          rollNo: String(i)
        });
      }
      window.masterStudentData = arr;
      window.renderMasterGrid();
    };

    console.log('sdms-fixes.js loaded — defensive functions and master-grid placeholders added.');
  } catch (e) {
    console.error('sdms-fixes.js top-level error:', e);
  }
})();
