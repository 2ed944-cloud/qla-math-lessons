// ==================== QLA Mathematics Portal - Enhanced JavaScript ====================
// Features: Progress tracking, bookmarks, PWA, search, analytics, accessibility

(function() {
  'use strict';

  // ==================== Configuration ====================
  const CONFIG = {
    storageKeys: {
      grade: 'qla_grade',
      progress: 'qla_progress',
      bookmarks: 'qla_bookmarks',
      lastVisit: 'qla_last_visit',
      theme: 'qla_theme'
    },
    analytics: {
      enabled: true,
      sessionId: generateSessionId()
    }
  };

  // ==================== Course Data ====================
  const grade7Units = [
    {
      num: 1,
      when: "Sep–Nov 2025 (9 wks)",
      name: "Unit 1 — Numbers; Properties of Numbers & Fractions",
      lessons: [
        "Number System Overview (Rational & Irrational Numbers)",
        "Prime Factorization Toolkit (Factors/Multiples • Prime/Composite • Factor Trees • HCF/LCM)",
        "Comparing & Simplifying Rational Numbers",
        "Add/Sub across Rationals",
        "Multiply/Divide across Rationals",
        "Absolute Value of Numbers",
        "Applications & Word Problems",
        "BEDMAS with Rationals"
      ]
    },
    {
      num: 2,
      when: "Nov–Dec 2025 (3 wks)",
      name: "Unit 2 — Expressions (Linear Expressions)",
      lessons: [
        "Rules for Writing Algebraic Expressions",
        "Simplify by Collecting Like Terms",
        "Algebraic Products",
        "Evaluating Algebraic Expressions",
        "Expanding Brackets",
        "Factorizing Expressions"
      ]
    },
    {
      num: 3,
      when: "Dec 2025 (2 wks)",
      name: "Unit 3 — Equations (Solving Linear Equations)",
      lessons: [
        "Solving One‑step Equations",
        "Solving Two‑step Equations",
        "Multi‑step Equations"
      ]
    },
    {
      num: 4,
      when: "Jan–Feb 2026 (2 wks)",
      name: "Unit 4 — Ratios & Proportional Relationships",
      lessons: [
        "Expressing Ratios & Writing Ratios as Fractions",
        "Simplifying & Equivalent Ratios",
        "Problem Solving Using Ratios",
        "Using Ratios to Divide Quantities"
      ]
    },
    {
      num: 5,
      when: "Feb–Mar 2026 (3 wks)",
      name: "Unit 5 — Coordinates (Coordinate Plane)",
      lessons: [
        "Plotting Positive & Negative Coordinates",
        "Plotting Points from a Table of Values",
        "Graphing Straight Lines",
        "Drawing Linear Graphs",
        "Horizontal & Vertical Lines",
        "Drawing Using X, Y Intercepts"
      ]
    },
    {
      num: 6,
      when: "Apr 2026 (3 wks)",
      name: "Unit 6 — Statistics & Probability — Statistics",
      lessons: [
        "Tally & Frequency Tables",
        "Grouping Data",
        "Reading Bar Charts",
        "Drawing Bar Charts",
        "Stem & Leaf Plots",
        "Mode, Median, Mean & Range",
        "Mean from a Frequency Table"
      ]
    },
    {
      num: 7,
      when: "May–Jun 2026 (4 wks)",
      name: "Unit 7 — Statistics & Probability — Simple Probability",
      lessons: [
        "Describing Probability",
        "Assigning Numbers to Probability",
        "Sample Space",
        "Compound Events",
        "Probability Trees",
        "Theoretical Probability",
        "Complementary Events"
      ]
    }
  ];

  const grade8Units = [
    { name: "Unit 1 — The Number System", lessons: [
      "Review of BEDMAS & absolute value", "Converting recurring decimals",
      "Rounding numbers", "Squares & roots", "Operations on fractions"
    ]},
    { name: "Unit 2 — Geometry of Polygons", lessons: [
      "Angle facts (supplementary, complementary, vertical, adjacent)", "Angles in triangles", "Isosceles triangle",
      "Angles of quadrilaterals", "Algebraic equations in geometry", "Parallel lines",
      "Angles in polygons (sum, interior & exterior)"
    ]},
    { name: "Unit 3 — Transformations & Congruence", lessons: [
      "Translations", "Rotations", "Reflections", "Enlargements"
    ]},
    { name: "Unit 4 — Statistics", lessons: ["Pie charts", "Histograms"]},
    { name: "Unit 5 — Pythagorean Theorem", lessons: [
      "Find hypotenuse", "Find missing sides", "Converse of Pythagoras", "Problem solving"
    ]},
    { name: "Unit 6 — Expressions & Equations (Systems)", lessons: [
      "Two- & three-step equations", "Solution by elimination", "Solution by equating", "Solution by substitution"
    ]},
    { name: "Unit 7 — Geometry Measurement", lessons: [
      "Converting metric units", "Parts of a circle", "Circumference & area of a circle",
      "Perimeter of polygons", "Area of polygons", "Composite shapes (area)",
      "Volume of cuboids", "Volume of prisms", "Volume of a cylinder"
    ]},
    { name: "Unit 8 — Statistics & Probability (Compound)", lessons: ["Simple events with & without replacement"]},
    { name: "Unit 9 — Constructions (Congruence & Similarity)", lessons: [
      "Construct ASA triangle", "Construct SAS triangle", "Construct SSS triangle"
    ]},
    { name: "Unit 10 — Percentages", lessons: [
      "Interchanging number forms", "Decimals ⇄ percentages", "One quantity as % of another", "% increase & decrease", "% change"
    ]}
  ];

  // ==================== State Management ====================
  class StateManager {
    constructor() {
      this.state = {
        currentGrade: this.loadGrade(),
        progress: this.loadProgress(),
        bookmarks: this.loadBookmarks(),
        searchIndex: [],
        filterMode: 'all' // 'all', 'bookmarked', 'completed', 'in-progress'
      };
    }

    loadGrade() {
      return localStorage.getItem(CONFIG.storageKeys.grade) || '7';
    }

    saveGrade(grade) {
      this.state.currentGrade = grade;
      localStorage.setItem(CONFIG.storageKeys.grade, grade);
      this.trackEvent('grade_switch', { grade });
    }

    loadProgress() {
      try {
        return JSON.parse(localStorage.getItem(CONFIG.storageKeys.progress)) || {};
      } catch {
        return {};
      }
    }

    saveProgress() {
      localStorage.setItem(CONFIG.storageKeys.progress, JSON.stringify(this.state.progress));
    }

    updateProgress(lessonId, status) {
      this.state.progress[lessonId] = {
        status, // 'completed', 'in-progress', 'not-started'
        timestamp: Date.now(),
        grade: this.state.currentGrade
      };
      this.saveProgress();
      this.trackEvent('lesson_progress', { lessonId, status });
      updateStats();
    }

    getProgress(lessonId) {
      return this.state.progress[lessonId] || { status: 'not-started' };
    }

    loadBookmarks() {
      try {
        return JSON.parse(localStorage.getItem(CONFIG.storageKeys.bookmarks)) || [];
      } catch {
        return [];
      }
    }

    saveBookmarks() {
      localStorage.setItem(CONFIG.storageKeys.bookmarks, JSON.stringify(this.state.bookmarks));
    }

    toggleBookmark(lessonId) {
      const index = this.state.bookmarks.indexOf(lessonId);
      if (index > -1) {
        this.state.bookmarks.splice(index, 1);
        this.trackEvent('bookmark_remove', { lessonId });
      } else {
        this.state.bookmarks.push(lessonId);
        this.trackEvent('bookmark_add', { lessonId });
      }
      this.saveBookmarks();
      updateStats();
      return this.isBookmarked(lessonId);
    }

    isBookmarked(lessonId) {
      return this.state.bookmarks.includes(lessonId);
    }

    buildSearchIndex() {
      const index = [];
      const units = this.state.currentGrade === '7' ? grade7Units : grade8Units;
      let lessonIdx = 2;

      units.forEach((unit, unitIdx) => {
        unit.lessons.forEach((title) => {
          const lessonId = `grade${this.state.currentGrade}-lesson-${lessonIdx}`;
          index.push({
            id: lessonId,
            title,
            unit: unit.name,
            unitIndex: unitIdx,
            href: `grade${this.state.currentGrade}/lesson-${lessonIdx}.html`,
            keywords: this.generateKeywords(title)
          });
          lessonIdx++;
        });
      });

      this.state.searchIndex = index;
      return index;
    }

    generateKeywords(title) {
      const keywords = title.toLowerCase()
        .replace(/[•—–]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2);
      return [...new Set(keywords)];
    }

    search(query) {
      if (!query) return [];
      const terms = query.toLowerCase().split(/\s+/);
      
      return this.state.searchIndex
        .filter(item => {
          const searchText = `${item.title} ${item.unit} ${item.keywords.join(' ')}`.toLowerCase();
          return terms.every(term => searchText.includes(term));
        })
        .slice(0, 10);
    }

    resetProgress() {
      if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
        this.state.progress = {};
        this.saveProgress();
        this.trackEvent('progress_reset');
        updateStats();
        showToast('Progress reset successfully', 'success');
        location.reload();
      }
    }

    exportData() {
      const data = {
        grade: this.state.currentGrade,
        progress: this.state.progress,
        bookmarks: this.state.bookmarks,
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qla-math-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.trackEvent('data_export');
      showToast('Data exported successfully', 'success');
    }

    trackEvent(eventName, data = {}) {
      if (!CONFIG.analytics.enabled) return;
      
      const event = {
        name: eventName,
        timestamp: Date.now(),
        sessionId: CONFIG.analytics.sessionId,
        grade: this.state.currentGrade,
        ...data
      };
      
      // Store events for potential later upload
      const events = JSON.parse(localStorage.getItem('qla_analytics') || '[]');
      events.push(event);
      if (events.length > 100) events.shift(); // Keep last 100 events
      localStorage.setItem('qla_analytics', JSON.stringify(events));
      
      console.log('[Analytics]', event);
    }
  }

  // ==================== Initialize State ====================
  const state = new StateManager();

  // ==================== DOM References ====================
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  const elements = {
    tab7: $('#tab7'),
    tab8: $('#tab8'),
    panel7: $('#panel7'),
    panel8: $('#panel8'),
    searchInput: $('#q'),
    searchResults: $('#searchResults'),
    installBtn: $('#installBtn'),
    resetProgressBtn: $('#resetProgress'),
    exportDataBtn: $('#exportData'),
    g7Units: $('#g7-units'),
    g8Units: $('#g8-units'),
    stats: {
      total: $('#totalLessons'),
      completed: $('#completedLessons'),
      inProgress: $('#inProgressLessons'),
      bookmarked: $('#bookmarkedLessons')
    }
  };

  // ==================== Build Lesson UI ====================
  function buildUnits(container, gradeFolder, units) {
    container.innerHTML = '';
    let lessonIdx = 2;

    units.forEach((unit, unitIdx) => {
      const block = document.createElement('article');
      block.className = 'card p-5 mb-5';
      block.setAttribute('aria-labelledby', `unit-${gradeFolder}-${unitIdx}`);
      
      block.innerHTML = `
        <header class="flex items-center gap-3 mb-3">
          <div class="rounded-xl bg-[--maroon] text-white w-11 h-11 grid place-items-center shadow" aria-hidden="true">
            ${unitIdx + 1}
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-lg" id="unit-${gradeFolder}-${unitIdx}">${unit.name}</h3>
            <p class="text-xs text-slate-600">${unit.lessons.length} lesson(s)${unit.when ? ' • ' + unit.when : ''}</p>
          </div>
        </header>
        <nav class="grid gap-2 md:grid-cols-2 lg:grid-cols-3" 
             id="${gradeFolder}-u${unitIdx}"
             aria-label="${unit.name} lessons"></nav>
      `;
      
      container.appendChild(block);
      const lessonList = $(`#${gradeFolder}-u${unitIdx}`);

      unit.lessons.forEach((title) => {
        const lessonId = `${gradeFolder}-lesson-${lessonIdx}`;
        const href = `${gradeFolder}/lesson-${lessonIdx}.html`;
        const progress = state.getProgress(lessonId);
        const isBookmarked = state.isBookmarked(lessonId);
        
        const row = document.createElement('div');
        row.className = `row ${isBookmarked ? 'bookmarked' : ''}`;
        row.setAttribute('data-lesson-id', lessonId);
        row.setAttribute('data-href', href);
        row.setAttribute('role', 'button');
        row.setAttribute('tabindex', '0');
        
        row.innerHTML = `
          <span class="font-semibold text-sm flex-1">${title}</span>
          <div class="flex items-center gap-2">
            <button class="bookmark-btn text-gray-400 hover:text-[--gold] transition p-1"
                    data-lesson-id="${lessonId}"
                    aria-label="${isBookmarked ? 'Remove bookmark' : 'Add bookmark'}"
                    title="${isBookmarked ? 'Remove bookmark' : 'Add bookmark'}">
              <i class="fas fa-bookmark${isBookmarked ? '' : '-o'}"></i>
            </button>
            <span class="status checking">Checking…</span>
          </div>
        `;
        
        lessonList.appendChild(row);
        
        // Check if lesson exists
        checkLessonExists(href, row, lessonId);
        
        // Add event listeners
        row.addEventListener('click', (e) => {
          if (!e.target.closest('.bookmark-btn')) {
            handleLessonClick(lessonId, href, row);
          }
        });
        
        row.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!e.target.closest('.bookmark-btn')) {
              handleLessonClick(lessonId, href, row);
            }
          }
        });
        
        lessonIdx++;
      });
    });
    
    // Add bookmark button listeners
    $$('.bookmark-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const lessonId = btn.dataset.lessonId;
        const isNowBookmarked = state.toggleBookmark(lessonId);
        const row = btn.closest('.row');
        
        if (isNowBookmarked) {
          row.classList.add('bookmarked');
          btn.innerHTML = '<i class="fas fa-bookmark"></i>';
          btn.setAttribute('aria-label', 'Remove bookmark');
        } else {
          row.classList.remove('bookmarked');
          btn.innerHTML = '<i class="fas fa-bookmark-o"></i>';
          btn.setAttribute('aria-label', 'Add bookmark');
        }
        
        showToast(isNowBookmarked ? 'Bookmark added' : 'Bookmark removed', 'success');
      });
    });
  }

  // ==================== Lesson Existence Check ====================
  async function checkLessonExists(href, row, lessonId) {
    try {
      const response = await fetch(href, { method: 'HEAD' });
      const badge = $('.status', row);
      const progress = state.getProgress(lessonId);
      
      if (response.ok) {
        badge.className = 'status open';
        badge.textContent = progress.status === 'completed' ? 'Completed' : 
                           progress.status === 'in-progress' ? 'Continue' : 'Open';
        row.classList.remove('disabled');
      } else {
        badge.className = 'status soon';
        badge.textContent = 'Coming Soon';
        row.classList.add('disabled');
      }
    } catch {
      const badge = $('.status', row);
      badge.className = 'status soon';
      badge.textContent = 'Coming Soon';
      row.classList.add('disabled');
    }
  }

  // ==================== Lesson Click Handler ====================
  function handleLessonClick(lessonId, href, row) {
    if (row.classList.contains('disabled')) return;
    
    state.updateProgress(lessonId, 'in-progress');
    state.trackEvent('lesson_open', { lessonId, href });
    
    // Store referrer for back navigation
    sessionStorage.setItem('qla_return_url', window.location.href);
    
    window.location.href = href;
  }

  // ==================== Grade Switching ====================
  function activateGrade(grade) {
    state.saveGrade(grade);
    
    const is7 = grade === '7';
    elements.tab7.setAttribute('aria-selected', is7 ? 'true' : 'false');
    elements.tab8.setAttribute('aria-selected', is7 ? 'false' : 'true');
    
    elements.panel7.classList.toggle('hidden', !is7);
    elements.panel8.classList.toggle('hidden', is7);
    
    elements.panel7.setAttribute('aria-hidden', is7 ? 'false' : 'true');
    elements.panel8.setAttribute('aria-hidden', is7 ? 'true' : 'false');
    
    elements.searchInput.value = '';
    elements.searchResults.classList.remove('show');
    
    state.buildSearchIndex();
    updateStats();
  }

  // ==================== Search Functionality ====================
  let searchDebounceTimer;
  
  function handleSearch(query) {
    clearTimeout(searchDebounceTimer);
    
    if (!query.trim()) {
      elements.searchResults.classList.remove('show');
      filterLessons('');
      return;
    }
    
    searchDebounceTimer = setTimeout(() => {
      const results = state.search(query);
      displaySearchResults(results);
      state.trackEvent('search', { query, resultCount: results.length });
    }, 300);
  }

  function displaySearchResults(results) {
    if (results.length === 0) {
      elements.searchResults.innerHTML = '<div class="search-result text-slate-500">No lessons found</div>';
      elements.searchResults.classList.add('show');
      return;
    }
    
    elements.searchResults.innerHTML = results.map(result => `
      <div class="search-result" data-href="${result.href}" role="option" tabindex="0">
        <div class="font-semibold text-sm">${highlightText(result.title, elements.searchInput.value)}</div>
        <div class="text-xs text-slate-600">${result.unit}</div>
      </div>
    `).join('');
    
    elements.searchResults.classList.add('show');
    
    // Add click handlers
    $$('.search-result', elements.searchResults).forEach(item => {
      const href = item.dataset.href;
      if (href) {
        item.addEventListener('click', () => {
          window.location.href = href;
        });
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            window.location.href = href;
          }
        });
      }
    });
  }

  function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  }

  function filterLessons(query) {
    const panel = elements.panel7.getAttribute('aria-hidden') === 'false' ? elements.panel7 : elements.panel8;
    const rows = $$('.row', panel);
    const searchText = query.toLowerCase();
    
    rows.forEach(row => {
      const matches = !searchText || row.textContent.toLowerCase().includes(searchText);
      const shouldShow = matches && (
        state.state.filterMode === 'all' ||
        (state.state.filterMode === 'bookmarked' && state.isBookmarked(row.dataset.lessonId))
      );
      row.style.display = shouldShow ? '' : 'none';
    });
    
    // Hide empty units
    $$('.card', panel).forEach(card => {
      const visibleRows = $$('.row', card).filter(r => r.style.display !== 'none');
      card.style.display = visibleRows.length > 0 ? '' : 'none';
    });
  }

  // ==================== Statistics Update ====================
  function updateStats() {
    const units = state.state.currentGrade === '7' ? grade7Units : grade8Units;
    const totalLessons = units.reduce((sum, unit) => sum + unit.lessons.length, 0);
    
    let completed = 0;
    let inProgress = 0;
    
    Object.values(state.state.progress).forEach(p => {
      if (p.grade === state.state.currentGrade) {
        if (p.status === 'completed') completed++;
        else if (p.status === 'in-progress') inProgress++;
      }
    });
    
    const bookmarked = state.state.bookmarks.filter(id => 
      id.startsWith(`grade${state.state.currentGrade}`)
    ).length;
    
    animateNumber(elements.stats.total, totalLessons);
    animateNumber(elements.stats.completed, completed);
    animateNumber(elements.stats.inProgress, inProgress);
    animateNumber(elements.stats.bookmarked, bookmarked);
  }

  function animateNumber(element, target) {
    const current = parseInt(element.textContent) || 0;
    const increment = target > current ? 1 : -1;
    const duration = 500;
    const steps = Math.abs(target - current);
    const stepDuration = duration / (steps || 1);
    
    let value = current;
    const timer = setInterval(() => {
      value += increment;
      element.textContent = value;
      if (value === target) clearInterval(timer);
    }, stepDuration);
  }

  // ==================== Toast Notifications ====================
  function showToast(message, type = 'info', duration = 3000) {
    const container = $('#toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="flex items-start gap-3">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} text-lg"></i>
        <div class="flex-1">${message}</div>
        <button class="text-slate-400 hover:text-slate-600" onclick="this.parentElement.parentElement.remove()" aria-label="Close notification">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ==================== PWA Installation ====================
  let deferredPrompt;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    elements.installBtn.classList.remove('hidden');
  });
  
  elements.installBtn?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    state.trackEvent('pwa_install', { outcome });
    
    if (outcome === 'accepted') {
      showToast('App installed successfully!', 'success');
    }
    
    deferredPrompt = null;
    elements.installBtn.classList.add('hidden');
  });

  // ==================== Keyboard Shortcuts ====================
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      if (e.key === 'Escape') {
        e.target.blur();
        elements.searchInput.value = '';
        elements.searchResults.classList.remove('show');
      }
      return;
    }
    
    // Search focus: /
    if (e.key === '/') {
      e.preventDefault();
      elements.searchInput.focus();
    }
    
    // Grade switch: G
    if (e.key.toLowerCase() === 'g') {
      e.preventDefault();
      const newGrade = state.state.currentGrade === '7' ? '8' : '7';
      activateGrade(newGrade);
    }
    
    // Bookmarks filter: B
    if (e.key.toLowerCase() === 'b') {
      e.preventDefault();
      state.state.filterMode = state.state.filterMode === 'bookmarked' ? 'all' : 'bookmarked';
      filterLessons(elements.searchInput.value);
      showToast(
        state.state.filterMode === 'bookmarked' ? 'Showing bookmarks only' : 'Showing all lessons',
        'info'
      );
    }
  });

  // ==================== Event Listeners ====================
  elements.tab7.addEventListener('click', () => activateGrade('7'));
  elements.tab8.addEventListener('click', () => activateGrade('8'));
  
  elements.searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
  elements.searchInput.addEventListener('focus', () => {
    if (elements.searchInput.value) handleSearch(elements.searchInput.value);
  });
  
  // Close search results when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      elements.searchResults.classList.remove('show');
    }
  });
  
  elements.resetProgressBtn?.addEventListener('click', () => state.resetProgress());
  elements.exportDataBtn?.addEventListener('click', () => state.exportData());

  // ==================== Service Worker Registration ====================
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('[SW] Registered:', reg);
          state.trackEvent('sw_registered');
        })
        .catch(err => console.error('[SW] Registration failed:', err));
    });
  }

  // ==================== Initialization ====================
  function init() {
    // Build lesson lists
    buildUnits(elements.g7Units, 'grade7', grade7Units);
    buildUnits(elements.g8Units, 'grade8', grade8Units);
    
    // Activate saved grade
    activateGrade(state.state.currentGrade);
    
    // Build search index
    state.buildSearchIndex();
    
    // Update stats
    updateStats();
    
    // Set current year
    const yearElement = $('#year');
    if (yearElement) yearElement.textContent = new Date().getFullYear();
    
    // Track page view
    state.trackEvent('page_view', { page: 'portal' });
    
    // Show returning user message
    const lastVisit = localStorage.getItem(CONFIG.storageKeys.lastVisit);
    if (lastVisit) {
      const daysSince = Math.floor((Date.now() - parseInt(lastVisit)) / (1000 * 60 * 60 * 24));
      if (daysSince > 7) {
        showToast(`Welcome back! It's been ${daysSince} days.`, 'info', 5000);
      }
    }
    localStorage.setItem(CONFIG.storageKeys.lastVisit, Date.now().toString());
    
    // Accessibility announcement
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
    
    console.log('[QLA] Portal initialized successfully');
  }

  // ==================== Utility Functions ====================
  function generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==================== Start Application ====================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Make state available globally for debugging
  window.QLAState = state;
  
})();
