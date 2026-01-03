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
const dayBeforeBtn = document.getElementById('dayBefore') as HTMLButtonElement;
const currentDateLabel = document.getElementById('currentDate') as HTMLElement;
const dayAfterBtn = document.getElementById('dayAfter') as HTMLButtonElement;
const visualization = document.getElementById('visualization') as HTMLElement;
const statusDiv = document.getElementById('status') as HTMLElement;
const dateInput = document.getElementById('dateInput') as HTMLInputElement;
const hoursInput = document.getElementById('hoursInput') as HTMLInputElement;
const setHoursBtn = document.getElementById('setHoursBtn') as HTMLButtonElement;
const yearsList = document.getElementById('yearsList') as HTMLElement;

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

// Update hours for a specific date
function updateHoursForDate(date: Date, hours: number) {
  const dateYear = date.getFullYear();
  const dateWeek = timetableManager.getDateWeek(date);
  const hourItem = document.getElementById(`hours-item-${date.toISOString().split('T')[0]}`);

  timetableManager.setHoursWorked(date, hours);

  if (hourItem) {
    const weekSection = document.getElementById(`year-${dateYear}-week-${dateWeek}`)! as HTMLDetailsElement;
    weekSection.open = true;

    const hourLabel = hourItem.querySelector('.hours') as HTMLElement;
    const hoursClass = hours > 0 ? 'has-hours' : 'no-hours';
    hourLabel.className = `hours ${hoursClass}`;
    hourLabel.textContent = `${hours}h`;
  } else {
    refreshHoursDisplay();
  }
}

// Hard refresh hours display
function refreshHoursDisplay() {
  const currentDate = dateInput.valueAsDate!;
  const currentDateWeek = timetableManager.getDateWeek(currentDate);
  const currentDateYear = currentDate.getFullYear();
  const dates = timetableManager.getAllDates();
  const datesByWeeks = timetableManager.getAllDatesByWeek();

  if (dates.length === 0) {
    discardHoursList();
    return;
  } else {
    yearsList.innerHTML = '';
  }

  // Create a section for each years
  datesByWeeks.forEach((value, year) => {
    const yearSection = document.createElement('details');
    yearSection.classList.add('year-section');
    yearSection.open = year === currentDateYear;
    yearSection.id = `year-${year}`;
    const yearSummary = document.createElement('summary');
    yearSummary.textContent = `Year ${year} ( days)`;
    yearSection.appendChild(yearSummary);

    // Create a section for each week in year where there's a know date
    value.forEach((dates, week) => {
      const weekSection = document.createElement('details');
      weekSection.classList.add('week-section');
      weekSection.open = year === currentDateYear && week === currentDateWeek;
      weekSection.id = `year-${year}-week-${week}`;
      const weekSummary = document.createElement('summary');
      const hoursList = document.createElement('div');
      hoursList.classList.add('hours-list');
      const weekNumber = timetableManager.getDateWeek(dates[0]);
      const firstWeekDateStr = formatDate(timetableManager.getWeekStartDate(year, week));
      const lastWeekDateStr = formatDate(timetableManager.getWeekEndDate(year, week));
      weekSummary.textContent = `Week ${weekNumber} (${firstWeekDateStr} - ${lastWeekDateStr})`;

      // Create date card for each date in week
      dates.forEach(date => {
        const hours = timetableManager.getHoursWorked(date);
        const hourItem = document.createElement('div');
        hourItem.classList.add('hours-item');
        hourItem.id = `hours-item-${formatDate(date)}`;
        const dateLabel = document.createElement('span');
        dateLabel.classList.add('date');
        dateLabel.textContent = formatDate(date);
        const hourLabel = document.createElement('span');
        const hoursClass = hours > 0 ? 'has-hours' : 'no-hours';
        hourLabel.classList.add('hours');
        hourLabel.classList.add(hoursClass);
        hourLabel.textContent = `${hours}h`;

        hourItem.appendChild(dateLabel);
        hourItem.appendChild(hourLabel);
        hoursList.appendChild(hourItem);

        hourItem.addEventListener('click', handleClickOnHoursItem, { passive: true });
      });

      weekSection.appendChild(weekSummary);
      weekSection.appendChild(hoursList);
      yearSection.appendChild(weekSection);
    });

    yearsList.appendChild(yearSection);
  });

  function discardHoursList() {
      yearsList.innerHTML = '<p class="empty-list">No hours tracked yet.</p>';
  }

  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

// Function that update the current date everywhere it's needed
function updateCurrentDate(newDate: Date) {
  updateDatePickerDate(newDate)
  updateCurrentDateLabel(newDate);
  updateTimetableCurrentDate(newDate);
  updateVisualization(newDate);

  function updateDatePickerDate(date: Date) {
    dateInput.valueAsDate = date;
  }

  function updateCurrentDateLabel(date: Date) {
    currentDateLabel.innerHTML = date.toDateString();
  }

  function updateTimetableCurrentDate(date: Date) {
    timetableManager.setCurrentDate(date);
  }
}

// Update visualization
function updateVisualization(date: Date = new Date()) {
  const activities = timetableManager.getTimetableForDate(date)?.activities ?? [];

  visualization.innerHTML = '';
  if (activities.length === 0) {
    discardVisualizationContent();
    return;
  }

  timetableManager.updateTimelineDisplay(visualization, activities);

  showStatus(`Successfully loaded ${activities.length} activities`);

  function discardVisualizationContent() {
    visualization.innerHTML = '<p class="empty-viz">No activities to display. Import some data to get started!</p>';
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

    timetableManager.addActivities(activities);
    refreshHoursDisplay();
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

  updateHoursForDate(date, hours);
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
  updateVisualization();
  refreshHoursDisplay();
  showStatus('All data cleared');
});

setHoursBtn.addEventListener('click', updateHoursForCurrentDate);

dateInput.addEventListener('change', (event) => {
  const date = dateInput.valueAsDate;

  if (date) {
    updateCurrentDate(date);
  }
});

hoursInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
      updateHoursForCurrentDate();
  }
});

dayBeforeBtn.addEventListener('click', () => {
  const currentDate = dateInput.valueAsDate ?? new Date();
  const newDate = new Date(currentDate);

  newDate.setDate(currentDate.getDate() - 1);

  updateCurrentDate(newDate);
});

dayAfterBtn.addEventListener('click', () => {
  const currentDate = dateInput.valueAsDate ?? new Date();
  const newDate = new Date(currentDate);

  newDate.setDate(currentDate.getDate() + 1);

  updateCurrentDate(newDate);
});

// Initialize
updateVisualization();
refreshHoursDisplay();

console.log('Activity Visualizer initialized');
