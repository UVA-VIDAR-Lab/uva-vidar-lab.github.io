const menuToggle = document.querySelector('.menu-toggle');
  const navList = document.querySelector('nav ul');
  menuToggle.addEventListener('click', () => {
    navList.classList.toggle('show');
  });
  // Optional: Hide menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!menuToggle.contains(e.target) && !navList.contains(e.target)) {
      navList.classList.remove('show');
    }
  });

/**
 * Loads team members from a CSV file and populates the team-list div
 * The CSV should have columns: firstname, lastname, role, profile, headshot_path
 * Team members are sorted alphabetically by last name
 * @param {string} csvFilePath - Path to the CSV file
 */
function renderPersonCard(person) {
  const memberDiv = document.createElement('div');
  memberDiv.className = 'team-member';

  const img = document.createElement('img');
  img.src = person.headshot_path || '../images/profile-images/default-headshot.jpg';
  img.alt = `${person.firstname} ${person.lastname}`;
  img.className = 'team-photo';
  memberDiv.appendChild(img);

  if (person.profile) {
    const nameLink = document.createElement('a');
    nameLink.href = person.profile;
    nameLink.target = '_blank';
    nameLink.className = 'team-name';
    nameLink.textContent = `${person.firstname} ${person.lastname}`;
    memberDiv.appendChild(nameLink);
  } else {
    const nameSpan = document.createElement('span');
    nameSpan.className = 'team-name';
    nameSpan.textContent = `${person.firstname} ${person.lastname}`;
    memberDiv.appendChild(nameSpan);
  }

  const roleSpan = document.createElement('span');
  roleSpan.className = 'team-role';
  roleSpan.textContent = person.role;
  memberDiv.appendChild(roleSpan);

  if (person.current_project) {
    const projects = document.createElement('div');
    projects.className = 'person-projects';
    const chip = document.createElement('span');
    chip.className = 'person-chip';
    chip.textContent = person.current_project;
    projects.appendChild(chip);
    memberDiv.appendChild(projects);
  }

  return memberDiv;
}

function loadTeamMembers(csvFilePath) {
  fetch(csvFilePath)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Unable to load team members from ${csvFilePath}`);
      }
      return response.text();
    })
    .then(text => {
      const rows = parseCSV(text);
      const people = rows.map(row => ({
        firstname: row.firstname || '',
        lastname: row.lastname || '',
        role: row.role || '',
        profile: row.profile || '',
        headshot_path: row.headshot_path || '',
        current_project: row.current_project || '',
        alumni: String(row.alumni || '').toLowerCase() === 'yes',
        next_destination: row.next_destination || ''
      }));

      const teamList = document.getElementById('team-list');
      const alumniList = document.getElementById('alumni-list');
      if (!teamList) {
        console.error('team-list div not found');
        return;
      }

      const currentMembers = people.filter(person => !person.alumni);
      const alumniMembers = people.filter(person => person.alumni);

      const rolePriority = role => {
        const normalized = String(role || '').toLowerCase();
        if (normalized.includes('assistant professor') || normalized.includes('pi')) return 0;
        if (normalized.includes('phd')) return 1;
        if (normalized.includes('ms') || normalized.includes('master')) return 2;
        if (normalized.includes('ug') || normalized.includes('undergrad')) return 3;
        return 4;
      };

      currentMembers.sort((a, b) => {
        const aPriority = rolePriority(a.role);
        const bPriority = rolePriority(b.role);
        if (aPriority !== bPriority) return aPriority - bPriority;
        return a.lastname.localeCompare(b.lastname);
      });
      alumniMembers.sort((a, b) => a.lastname.localeCompare(b.lastname));

      teamList.innerHTML = '';
      currentMembers.forEach(person => teamList.appendChild(renderPersonCard(person)));

      if (alumniList) {
        alumniList.innerHTML = '';
        if (alumniMembers.length === 0) {
          alumniList.innerHTML = '<div class="alumni-empty">No alumni listed yet.</div>';
        } else {
          alumniMembers.forEach(person => {
            const card = document.createElement('div');
            card.className = 'alumni-card';

            const name = document.createElement('div');
            name.className = 'alumni-name';
            name.textContent = `${person.firstname} ${person.lastname}`;
            card.appendChild(name);

            const roleRow = document.createElement('div');
            roleRow.className = 'alumni-detail';
            roleRow.textContent = person.role || '—';
            card.appendChild(roleRow);
            
            if (person.next_destination) {
              const nextRow = document.createElement('div');
              nextRow.className = 'alumni-detail alumni-next';
              const nextIcon = document.createElement('span');
              nextIcon.className = 'alumni-next-icon';
              nextIcon.textContent = '→';
              const nextValue = document.createElement('span');
              nextValue.textContent = person.next_destination || '—';
              nextRow.appendChild(nextIcon);
              nextRow.appendChild(nextValue);
              card.appendChild(nextRow);
            }
            alumniList.appendChild(card);
          });
        }
      }
    })
    .catch(error => {
      console.error('Error loading team members:', error);
      const teamList = document.getElementById('team-list');
      if (teamList) {
        teamList.innerHTML = '<p>Unable to load team members at this time.</p>';
      }
      const alumniList = document.getElementById('alumni-list');
      if (alumniList) {
        alumniList.innerHTML = '<li>Unable to load alumni at this time.</li>';
      }
    });
}

let publicationCards = [];
const publicationContainer = document.querySelector('.publications-container');
const clearPublicationsButton = document.getElementById('clear-filters');
const filterStatus = document.getElementById('filter-status');

function parseKeys(str) {
  if (!str) return [];
  return String(str).split(/[;,|]/).map(s => s.trim()).filter(Boolean);
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (insideQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        insideQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      insideQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(field.trim());
      field = '';
      continue;
    }

    if (char === '\n' || char === '\r') {
      if (char === '\r' && next === '\n') continue;
      row.push(field.trim());
      field = '';
      if (row.length > 1 || row[0] !== '') {
        rows.push(row);
      }
      row = [];
      continue;
    }

    field += char;
  }

  if (field !== '' || row.length > 0) {
    row.push(field.trim());
    rows.push(row);
  }

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map(header => header.trim());
  return rows.slice(1).map(values => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    return record;
  });
}

function buildPublicationCard(pub) {
  const card = document.createElement('div');
  card.className = 'pub-card';
  // store themes as an array-friendly string
  const themes = parseKeys(pub.theme);
  card.dataset.themes = themes.join('|');
  card.dataset.year = String(pub.year);
  card.dataset.venue = pub.venue;

  const linkEls = [];

  if (pub.paper_link) {
    const label = pub.paper_label || 'PDF';
    linkEls.push(`<a href="${pub.paper_link}" target="_blank" title="${label}"><i class="fas fa-file-pdf"></i> ${label}</a>`);
  }

  if (pub.supplementary_link) {
    const label = pub.supplementary_label || 'Supplementary';
    linkEls.push(`<a href="${pub.supplementary_link}" target="_blank" title="${label}"><i class="fas fa-box-archive"></i> ${label}</a>`);
  }

  card.innerHTML = `
    <img src="${pub.image_path}" alt="${pub.image_alt}" class="pub-img">
    <div class="pub-info">
      <div class="pub-title">${pub.title}</div>
      <div class="pub-authors">${pub.authors}</div>
      <div class="pub-venue">${pub.venue_display || pub.venue}</div>
      <div class="pub-meta">
        <span class="pub-theme">${pub.theme_display || pub.theme}</span>
        <span class="pub-year">${pub.year}</span>
      </div>
      <div class="pub-links">
        ${linkEls.join('')}
      </div>
    </div>
  `;

  return card;
}

function renderPublications(publications) {
  publicationContainer.innerHTML = '';
  publicationCards = publications.map(pub => {
    const card = buildPublicationCard(pub);
    publicationContainer.appendChild(card);
    return card;
  });
}

function updateFilterCounts(publications) {
  const themeCounts = {};
  const yearCounts = {};
  const venueCounts = {};

  publications.forEach(pub => {
    const keys = parseKeys(pub.theme);
    keys.forEach(k => themeCounts[k] = (themeCounts[k] || 0) + 1);
    yearCounts[String(pub.year)] = (yearCounts[String(pub.year)] || 0) + 1;
    venueCounts[pub.venue] = (venueCounts[pub.venue] || 0) + 1;
  });

  document.querySelectorAll('.theme-filter').forEach(cb => {
    const countEl = cb.parentElement.querySelector('.filter-count');
    if (countEl) {
      countEl.textContent = themeCounts[cb.value] || '0';
    }
  });

  document.querySelectorAll('.year-filter').forEach(cb => {
    const countEl = cb.parentElement.querySelector('.filter-count');
    if (countEl) {
      countEl.textContent = yearCounts[cb.value] || '0';
    }
  });

  document.querySelectorAll('.venue-filter').forEach(cb => {
    const countEl = cb.parentElement.querySelector('.filter-count');
    if (countEl) {
      countEl.textContent = venueCounts[cb.value] || '0';
    }
  });
}

function applyPublicationFilters() {
  const activeThemes = Array.from(document.querySelectorAll('.theme-filter')).filter(cb => cb.checked).map(cb => cb.value);
  const activeYears = Array.from(document.querySelectorAll('.year-filter')).filter(cb => cb.checked).map(cb => cb.value);
  const activeVenues = Array.from(document.querySelectorAll('.venue-filter')).filter(cb => cb.checked).map(cb => cb.value);

  let hiddenCount = 0;

  publicationCards.forEach(card => {
    const cardThemes = (card.dataset.themes || '').split('|').filter(Boolean);
    const cardYear = card.dataset.year;
    const cardVenue = card.dataset.venue;

    const matchesTheme = activeThemes.length === 0 || activeThemes.some(t => cardThemes.includes(t));
    const matchesYear = activeYears.length === 0 || activeYears.includes(cardYear);
    const matchesVenue = activeVenues.length === 0 || activeVenues.includes(cardVenue);

    if (matchesTheme && matchesYear && matchesVenue) {
      card.classList.remove('hidden');
    } else {
      card.classList.add('hidden');
      hiddenCount++;
    }
  });

  const totalFiltersActive = activeThemes.length + activeYears.length + activeVenues.length;
  if (filterStatus) {
    if (totalFiltersActive > 0) {
      filterStatus.style.display = 'block';
      filterStatus.innerHTML = `${hiddenCount} of ${publicationCards.length} publications hidden by filters. <a href="#" onclick="document.getElementById('clear-filters').click(); return false;">Clear all</a>`;
    } else {
      filterStatus.style.display = 'none';
    }
  }
}

function slugify(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function buildThemeFilterUI(publications) {
  // find the Research Theme filter-group by heading
  const groups = document.querySelectorAll('.filter-group');
  let themeGroup = null;
  groups.forEach(g => {
    const h = g.querySelector('h4');
    if (h && h.textContent.trim().toLowerCase() === 'research theme') themeGroup = g;
  });
  if (!themeGroup) return;

  // collect themes and optional display labels
  const themeMap = {}; // key -> display
  const counts = {};
  publications.forEach(pub => {
    const keys = parseKeys(pub.theme);
    const displays = parseKeys(pub.theme_display || '');
    keys.forEach((k, i) => {
      const display = (displays[i]) || (pub.theme_display && displays.length === 1 ? displays[0] : k);
      themeMap[k] = themeMap[k] || display || k;
      counts[k] = (counts[k] || 0) + 1;
    });
  });

  const entries = Object.keys(themeMap).sort((a, b) => themeMap[a].localeCompare(themeMap[b]));
  const container = document.createElement('div');
  entries.forEach(key => {
    const id = `filter-${slugify(key)}`;
    const div = document.createElement('div');
    div.className = 'filter-item';
    div.innerHTML = `<input type="checkbox" id="${id}" value="${key}" class="theme-filter">
      <label for="${id}">${themeMap[key]}</label>
      <span class="filter-count">${counts[key] || 0}</span>`;
    container.appendChild(div);
  });

  // Replace existing items (remove h4 and keep heading)
  const heading = themeGroup.querySelector('h4');
  themeGroup.innerHTML = '';
  if (heading) themeGroup.appendChild(heading);
  themeGroup.appendChild(container);

  // attach change handlers
  document.querySelectorAll('.theme-filter').forEach(cb => cb.addEventListener('change', applyPublicationFilters));
}

function buildYearFilterUI(publications) {
  const groups = document.querySelectorAll('.filter-group');
  let yearGroup = null;
  groups.forEach(g => {
    const h = g.querySelector('h4');
    if (h && h.textContent.trim().toLowerCase() === 'year') yearGroup = g;
  });
  if (!yearGroup) return;

  const years = {};
  publications.forEach(pub => {
    const y = String(pub.year || '');
    if (y) years[y] = (years[y] || 0) + 1;
  });

  const entries = Object.keys(years).sort((a, b) => Number(b) - Number(a));
  const container = document.createElement('div');
  entries.forEach(y => {
    const id = `filter-${y}`;
    const div = document.createElement('div');
    div.className = 'filter-item';
    div.innerHTML = `<input type="checkbox" id="${id}" value="${y}" class="year-filter">
      <label for="${id}">${y}</label>
      <span class="filter-count">${years[y] || 0}</span>`;
    container.appendChild(div);
  });

  const heading = yearGroup.querySelector('h4');
  yearGroup.innerHTML = '';
  if (heading) yearGroup.appendChild(heading);
  yearGroup.appendChild(container);

  document.querySelectorAll('.year-filter').forEach(cb => cb.addEventListener('change', applyPublicationFilters));
}

function buildVenueFilterUI(publications) {
  const groups = document.querySelectorAll('.filter-group');
  let venueGroup = null;
  groups.forEach(g => {
    const h = g.querySelector('h4');
    if (h && h.textContent.trim().toLowerCase() === 'venue') venueGroup = g;
  });
  if (!venueGroup) return;

  const venueMap = {};
  publications.forEach(pub => {
    const key = pub.venue || '';
    if (!key) return;
    const display = pub.venue_display || key;
    venueMap[key] = venueMap[key] || { display: display, count: 0 };
    venueMap[key].count += 1;
  });

  const entries = Object.keys(venueMap).sort((a, b) => venueMap[a].display.localeCompare(venueMap[b].display));
  const container = document.createElement('div');
  entries.forEach(key => {
    const id = `filter-${slugify(key)}`;
    const div = document.createElement('div');
    div.className = 'filter-item';
    div.innerHTML = `<input type="checkbox" id="${id}" value="${key}" class="venue-filter">
      <label for="${id}">${venueMap[key].display}</label>
      <span class="filter-count">${venueMap[key].count || 0}</span>`;
    container.appendChild(div);
  });

  const heading = venueGroup.querySelector('h4');
  venueGroup.innerHTML = '';
  if (heading) venueGroup.appendChild(heading);
  venueGroup.appendChild(container);

  document.querySelectorAll('.venue-filter').forEach(cb => cb.addEventListener('change', applyPublicationFilters));
}

function getDataPath(relativePath) {
  const scriptPath = document.currentScript && document.currentScript.src ? document.currentScript.src : '';
  const scriptUrl = new URL(scriptPath || window.location.href, window.location.href);
  const scriptDir = scriptUrl.pathname.includes('/assets/js/') ? '/assets/js/' : '/';
  const basePath = scriptDir === '/assets/js/' ? '../data/' : './data/';
  return `${basePath}${relativePath}`;
}

function loadPublications(csvPath) {
  console.log(`Loading publications from ${csvPath}...`);
  fetch(csvPath)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Unable to load publications from ${csvPath}`);
      }
      return response.text();
    })
    .then(text => {
      const publications = parseCSV(text)
        .map(pub => ({
          ...pub,
          year: Number(pub.year) || 0,
          sort_order: Number(pub.sort_order) || 0,
        }))
        .sort((a, b) => {
          if (b.year !== a.year) return b.year - a.year;
          if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
          return a.title.localeCompare(b.title);
        });

      renderPublications(publications);
      // Build dynamic filter UIs, then update counts and apply filters
      buildThemeFilterUI(publications);
      buildYearFilterUI(publications);
      buildVenueFilterUI(publications);
      updateFilterCounts(publications);
      applyPublicationFilters();
    })
    .catch(error => {
      console.error('Error loading publications:', error);
      publicationContainer.innerHTML = '<p>Unable to load publications at this time.</p>';
    });
}

if (publicationContainer) {
  loadPublications(getDataPath('publications.csv'));

  // Year and venue filters may be static in the HTML; attach listeners dynamically
  document.querySelectorAll('.year-filter').forEach(filter => filter.addEventListener('change', applyPublicationFilters));
  document.querySelectorAll('.venue-filter').forEach(filter => filter.addEventListener('change', applyPublicationFilters));

  if (clearPublicationsButton) {
    clearPublicationsButton.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.theme-filter').forEach(cb => cb.checked = false);
      document.querySelectorAll('.year-filter').forEach(cb => cb.checked = false);
      document.querySelectorAll('.venue-filter').forEach(cb => cb.checked = false);
      if (filterStatus) {
        filterStatus.style.display = 'none';
      }
      applyPublicationFilters();
    });
  }
}

if (document.getElementById('team-list')) {
  loadTeamMembers(getDataPath('people.csv'));
}

function renderNews(items) {
  const newsList = document.querySelector('.news-panel ul');
  if (!newsList) return;

  newsList.innerHTML = '';
  items.forEach(item => {
    const li = document.createElement('li');
    const date = document.createElement('span');
    date.className = 'news-date';
    date.textContent = item.date;
    li.appendChild(date);

    if (item.text_html) {
      const content = document.createElement('span');
      content.className = 'news-text';
      content.innerHTML = item.text_html;
      li.appendChild(content);
    } else if (item.text) {
      const text = document.createElement('span');
      text.textContent = item.text;
      li.appendChild(text);
    }

    newsList.appendChild(li);
  });
}

function loadNews(csvPath) {
  fetch(csvPath)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Unable to load news from ${csvPath}`);
      }
      return response.text();
    })
    .then(text => {
      const rows = parseCSV(text);
      const items = rows
        .map(row => ({
          date: row.date || '',
          text: row.text || '',
          text_html: row.text_html || '',
        }))
        .filter(item => item.date || item.text || item.text_html)
        .slice(0, 5);
      renderNews(items);
    })
    .catch(error => {
      console.error('Error loading news:', error);
    });
}

if (document.querySelector('.news-panel')) {
  loadNews(getDataPath('news.csv'));
}