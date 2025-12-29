import { ActivityManager } from './modules/ActivityManager';
import { DataLoaderFactory } from './modules/DataLoader';
import { TimetableManager } from './modules/TimetableManager';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import './styles.css';

// Constants
const STATUS_DISPLAY_TIMEOUT = 5000;

// Initialize managers
const activityManager = new ActivityManager();
const timetableManager = new TimetableManager();

// Get DOM elements
const csvFileInput = document.getElementById('csvFile') as HTMLInputElement;
const icalFileInput = document.getElementById('icalFile') as HTMLInputElement;
const mboxFileInput = document.getElementById('mboxFile') as HTMLInputElement;
const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
const visualization = document.getElementById('visualization') as HTMLElement;
const statusDiv = document.getElementById('status') as HTMLElement;
const dateInput = document.getElementById('dateInput') as HTMLInputElement;
const hoursInput = document.getElementById('hoursInput') as HTMLInputElement;
const setHoursBtn = document.getElementById('setHoursBtn') as HTMLButtonElement;
const hoursList = document.getElementById('hoursList') as HTMLElement;

// Set default date to today
dateInput.valueAsDate = new Date();

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
  const activities = activityManager.getActivities();

  if (activities.length === 0) {
    visualization.innerHTML = '<p style="padding: 40px; text-align: center; color: #999;">No activities to display. Import some data to get started!</p>';
    return;
  }

  timetableManager.clearTimetables();
  timetableManager.addActivities(activities);
  timetableManager.initializeTimeline(visualization, activities);

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
      if (hours === 0) return '';

      return `
        <div class="hours-item">
          <span class="date">${date.toLocaleDateString()}</span>
          <span class="hours">${hours}h</span>
        </div>
      `;
    })
    .filter(html => html !== '')
    .join('');

  if (hoursList.innerHTML === '') {
    hoursList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No hours tracked yet.</p>';
  }
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

    activityManager.addActivities(activities);
    updateVisualization();
  } catch (error) {
    console.error('Error loading file:', error);
    showStatus(`Error loading file: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
  }
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
  activityManager.clearActivities();
  timetableManager.clearTimetables();
  visualization.innerHTML = '<p style="padding: 40px; text-align: center; color: #999;">No activities to display. Import some data to get started!</p>';
  hoursList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No hours tracked yet.</p>';
  showStatus('All data cleared');
});

setHoursBtn.addEventListener('click', () => {
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
  showStatus(`Set ${hours} hours for ${date.toLocaleDateString()}`);
  hoursInput.value = '';
});

// Initialize
visualization.innerHTML = '<p style="padding: 40px; text-align: center; color: #999;">No activities to display. Import some data to get started!</p>';
updateHoursDisplay();

console.log('Activity Visualizer initialized');
