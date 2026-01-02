import { DataLoaderFactory } from './modules/DataLoader';
import { TimetableManager } from './modules/TimetableManager';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import './styles.css';

// Constants
const STATUS_DISPLAY_TIMEOUT = 5000;

// Initialize managers
const timetableManager = new TimetableManager();

// Get DOM elements
const csvFileInput = document.getElementById('csvFile') as HTMLInputElement;
const icalFileInput = document.getElementById('icalFile') as HTMLInputElement;
const mboxFileInput = document.getElementById('mboxFile') as HTMLInputElement;
const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
const currentDateLabel = document.getElementById('currentDate') as HTMLElement;
const visualization = document.getElementById('visualization') as HTMLElement;
const statusDiv = document.getElementById('status') as HTMLElement;
const dateInput = document.getElementById('dateInput') as HTMLInputElement;
const hoursInput = document.getElementById('hoursInput') as HTMLInputElement;
const setHoursBtn = document.getElementById('setHoursBtn') as HTMLButtonElement;
const hoursList = document.getElementById('hoursList') as HTMLElement;

// Set default date to today
updateCurrentDate(new Date());

// Show status message
function showStatus(message: string, isError: boolean = false) {
  statusDiv.textContent = message;
  statusDiv.className = `status-message ${isError ? 'error' : 'success'}`;
  setTimeout(() => {
    statusDiv.className = 'status-message';
  }, STATUS_DISPLAY_TIMEOUT);
}

// Update visualization
function updateVisualization() {
  const date = dateInput.valueAsDate ?? new Date();
  const activities = timetableManager.getTimetableForDate(date)?.activities ?? [];

  visualization.innerHTML = '';
  if (activities.length === 0) {
    visualization.innerHTML = '<p style="padding: 40px; text-align: center; color: #999;">No activities to display. Import some data to get started!</p>';
    return;
  }

  timetableManager.updateTimelineDisplay(visualization, activities);

  showStatus(`Successfully loaded ${activities.length} activities`);
}

// Update hours display
function updateHoursDisplay() {
  const dates = timetableManager.getAllDates();

  if (dates.length === 0) {
    hoursList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No dates with tracked hours yet.</p>';
    return;
  }

  hoursList.innerHTML = dates
    .map(date => {
      const hours = timetableManager.getHoursWorked(date);
      const dateStr = date.toISOString().split('T')[0]

      return `
        <div class="hours-item" id="hours-item-${dateStr}">
          <span class="date">${dateStr}</span>
          <span class="hours">${hours}h</span>
        </div>
      `;
    })
    .filter(html => html !== '')
    .join('');

  // TODO: refacto (and what's above also) to add elements one by one and add event listeners directly
  const datesStr = dates.map(date => date.toISOString().split('T')[0]);
  for (const dateStr of datesStr) {
    const element = document.getElementById(`hours-item-${dateStr}`) as HTMLElement;
    element.addEventListener('click', handleClickOnHoursItem, { passive: true });
  }

  if (hoursList.innerHTML === '') {
    hoursList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No hours tracked yet.</p>';
  }
}

function updateCurrentDate(date: Date) {
  dateInput.valueAsDate = date;
  currentDateLabel.innerHTML = date.toDateString();
}

// Handle file upload
async function handleFileUpload(file: File, fileType: 'csv' | 'ical' | 'mbox') {
  try {
    const text = await file.text();
    const loader = DataLoaderFactory.getLoader(fileType);
    const activities = await loader.load(text);

    if (activities.length === 0) {
      showStatus('No activities found in the file', true);
      return;
    }

    timetableManager.addActivities(activities);
    updateHoursDisplay()
    updateVisualization();
  } catch (error) {
    console.error('Error loading file:', error);
    showStatus(`Error loading file: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
  }
}

function handleClickOnHoursItem(event: MouseEvent) {
  const target = event.target as HTMLElement;
  let dateStr: string;

  if (target.id.startsWith('hours-item-')) {
    dateStr = target.id.replace('hours-item-', '');
  } else {
    const parent = target.parentElement as HTMLElement;
    dateStr = parent.id.replace('hours-item-', '');
  }

  const date = new Date(dateStr);
  updateCurrentDate(date);

  timetableManager.setCurrentDate(date);
  updateVisualization();
}

// Update hours for the selected date
function updateHoursForCurrentDate() {
  const date = dateInput.valueAsDate;
  const hours = parseFloat(hoursInput.value);

  if (!date) {
    showStatus('Please select a date', true);
    return;
  }

  if (isNaN(hours) || hours < 0 || hours > 24) {
    showStatus('Please enter valid hours (0-24)', true);
    return;
  }

  timetableManager.setHoursWorked(date, hours);
  updateHoursDisplay();
  showStatus(`Set ${hours} hours for ${date.toISOString().split('T')[0]}`);
  hoursInput.value = '';
}

// Event listeners
csvFileInput.addEventListener('change', async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    await handleFileUpload(file, 'csv');
    csvFileInput.value = ''; // Reset input
  }
});

icalFileInput.addEventListener('change', async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    await handleFileUpload(file, 'ical');
    icalFileInput.value = ''; // Reset input
  }
});

mboxFileInput.addEventListener('change', async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    await handleFileUpload(file, 'mbox');
    mboxFileInput.value = ''; // Reset input
  }
});

clearBtn.addEventListener('click', () => {
  timetableManager.clearTimetables();
  visualization.innerHTML = '<p style="padding: 40px; text-align: center; color: #999;">No activities to display. Import some data to get started!</p>';
  hoursList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No hours tracked yet.</p>';
  showStatus('All data cleared');
});

setHoursBtn.addEventListener('click', updateHoursForCurrentDate);

dateInput.addEventListener('change', (event) => {
  const date = dateInput.valueAsDate;

  if (date) {
    updateCurrentDate(date);
    timetableManager.setCurrentDate(date);
    updateVisualization();
  }
});

hoursInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
      updateHoursForCurrentDate();
  }
});

// Initialize
visualization.innerHTML = '<p style="padding: 40px; text-align: center; color: #999;">No activities to display. Import some data to get started!</p>';
updateHoursDisplay();

console.log('Activity Visualizer initialized');
