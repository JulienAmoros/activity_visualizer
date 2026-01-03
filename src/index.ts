import { DataLoaderFactory } from './modules/DataLoader';
import { TrelloApi } from './modules/TrelloApi';
import { TimetableManager } from './modules/TimetableManager';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import './styles.css';

// Constants
const STATUS_DISPLAY_TIMEOUT = 5000;
const DEFAULT_HOURS_PER_DAY = 7.7;

// Initialize managers
const timetableManager = new TimetableManager();

// Get DOM elements
const csvFileInput = document.getElementById('csvFile') as HTMLInputElement;
const trelloImportBtn = document.getElementById('trelloImportBtn') as HTMLButtonElement;
const icalFileInput = document.getElementById('icalFile') as HTMLInputElement;
const mboxFileInput = document.getElementById('mboxFile') as HTMLInputElement;
const mboxFileLabel = document.getElementById('mboxFileLabel') as HTMLLabelElement;
const jsonFileInput = document.getElementById('jsonFile') as HTMLInputElement;
const mboxImportDetails = document.getElementById('mboxImportOptions') as HTMLDetailsElement;
const trelloImportDetails = document.getElementById('trelloImportOptions') as HTMLDetailsElement;
const trelloApiKeyInput = document.getElementById('trelloApiKey') as HTMLInputElement;
const trelloAuthTokenInput = document.getElementById('trelloAuthToken') as HTMLInputElement;
const trelloUsernameInput = document.getElementById('trelloUsername') as HTMLInputElement;
const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
const emailInput = document.getElementById('emailInput') as HTMLInputElement;
const dayBeforeBtn = document.getElementById('dayBefore') as HTMLButtonElement;
const currentDateLabel = document.getElementById('currentDate') as HTMLElement;
const dayAfterBtn = document.getElementById('dayAfter') as HTMLButtonElement;
const visualization = document.getElementById('visualization') as HTMLElement;
const statusDiv = document.getElementById('status') as HTMLElement;
const dateInput = document.getElementById('dateInput') as HTMLInputElement;
const hoursInput = document.getElementById('hoursInput') as HTMLInputElement;
const setHoursBtn = document.getElementById('setHoursBtn') as HTMLButtonElement;
const setDayOffBtn = document.getElementById('setDayOffBtn') as HTMLButtonElement;
const exportBtn = document.getElementById('exportBtn') as HTMLButtonElement;
const yearsList = document.getElementById('yearsList') as HTMLElement;

// Set default date to today
updateCurrentDate(new Date());
mboxFileInput.disabled = true;
mboxFileLabel.className = 'file-label disabled';
trelloImportBtn.className = 'import-btn disabled';

// Show status message
function showStatus(message: string, isError: boolean = false) {
  statusDiv.textContent = message;
  statusDiv.className = `status-message ${isError ? 'error' : 'success'}`;
  setTimeout(() => {
    statusDiv.className = 'status-message';
    statusDiv.textContent = '';
  }, STATUS_DISPLAY_TIMEOUT);
}

// Update hours for a specific date
function updateHoursForDate(date: Date, hours: number) {
  const dateYear = date.getFullYear();
  const dateWeek = timetableManager.getDateWeek(date);
  const hourItem = document.getElementById(`hours-item-${formatDate(date)}`);

  timetableManager.setHoursWorked(date, hours);

  if (hourItem) {
    const weekSection = document.getElementById(`year-${dateYear}-week-${dateWeek}`)! as HTMLDetailsElement;
    weekSection.open = true;
    const timetableWeek = timetableManager.getWeek(date)!;
    const firstWeekDateStr = formatDate(timetableManager.getWeekStartDate(dateYear, dateWeek));
    const lastWeekDateStr = formatDate(timetableManager.getWeekEndDate(dateYear, dateWeek));
    const weekSummary = weekSection.querySelector('summary') as HTMLElement;
    weekSummary.textContent = `Week ${dateWeek} (${firstWeekDateStr} - ${lastWeekDateStr}) => ${timetableWeek.weeklyHoursWorked} hours worked`;

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
  // const dates = timetableManager.getAllDates();
  // const datesByWeeks = timetableManager.getAllDatesByWeek();
  const timetables = timetableManager.getAllTimetables();

  yearsList.innerHTML = '';

  // Create a section for each years
  const yearsMap = timetables.years;
  Array.from(yearsMap.entries())
    .sort((e1, e2) => e2[0] - e1[0])
    .forEach(([yearNumber, { weeks }]) => {
    const yearSection = document.createElement('details');
    yearSection.classList.add('year-section');
    yearSection.open = yearNumber === currentDateYear;
    yearSection.id = `year-${yearNumber}`;
    const yearSummary = document.createElement('summary');
    yearSummary.textContent = `Year ${yearNumber} ( days)`;
    yearSection.appendChild(yearSummary);

    // Create a section for each week in year where there's a know date
    Array.from(weeks.entries())
      .sort((e1, e2) => e2[0] - e1[0])
      .forEach(([weekNumber, weeklyTimetables]) => {
      const weekSection = document.createElement('details');
      weekSection.classList.add('week-section');
      weekSection.open = yearNumber === currentDateYear && weekNumber === currentDateWeek;
      weekSection.id = `year-${yearNumber}-week-${weekNumber}`;
      const weekSummary = document.createElement('summary');
      const hoursList = document.createElement('div');
      hoursList.classList.add('hours-list');
      const firstWeekDateStr = formatDate(timetableManager.getWeekStartDate(yearNumber, weekNumber));
      const lastWeekDateStr = formatDate(timetableManager.getWeekEndDate(yearNumber, weekNumber));
      weekSummary.textContent = `Week ${weekNumber} (${firstWeekDateStr} - ${lastWeekDateStr}) => ${weeklyTimetables.weeklyHoursWorked} hours worked`;

      // Create date card for each date in week
      weeklyTimetables.timetables.forEach((dailyTimetable) => {
        const date = dailyTimetable.date;
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
async function handleFileUpload(file: File, fileType: 'csv' | 'ical' | 'mbox', options?: { emailFilter?: string }) {
  try {
    const text = await file.text();
    const loader = DataLoaderFactory.getLoader(fileType);
    const activities = await loader.load(text, options);

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

function handleTrelloCredentialsChange() {
  const apiKey = trelloApiKeyInput.value.trim();
  const authToken = trelloAuthTokenInput.value.trim();
  const username = trelloUsernameInput.value.trim();

  const credentialsProvided = apiKey !== '' && authToken !== '' && username !== '';

  if (credentialsProvided) {
    trelloImportBtn.className = 'import-btn';
  } else {
    trelloImportBtn.className = 'import-btn disabled';
  }
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
  showStatus(`Set ${hours} hours for ${formatDate(date)}`);
  hoursInput.value = '';
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Event listeners
csvFileInput.addEventListener('change', async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    await handleFileUpload(file, 'csv');
    csvFileInput.value = ''; // Reset input
  }
});

trelloImportBtn.addEventListener('click', async () => {
  const apiKey = trelloApiKeyInput.value.trim();
  const authToken = trelloAuthTokenInput.value.trim();
  const username = trelloUsernameInput.value.trim();

  if (apiKey === '' || authToken === '' || username === '') {
    showStatus('Please enter your Trello API Key, Auth Token, and Username', true);
    trelloImportDetails.open = true;
  } else {
    const trello = new TrelloApi(
      apiKey,
      authToken,
      username
    );

    const activities = await trello.fetchActivities();

    timetableManager.addActivities(activities);
    refreshHoursDisplay();
    updateVisualization();
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
    await handleFileUpload(file, 'mbox', { emailFilter: emailInput.value });
    mboxFileInput.value = ''; // Reset input
  }
});

mboxFileLabel.addEventListener('click', () => {
  if (! emailInput.value.includes('@')) {
    mboxImportDetails.open = true;
    showStatus("You need to enter your email before importing an MBOX file", true);
  }
});

emailInput.addEventListener('change', (e) => {
  if (emailInput.value.includes('@')) {
    mboxFileInput.disabled = false;
    mboxFileLabel.className = 'file-label';
    emailInput.value = emailInput.value.trim();
  }
});

trelloApiKeyInput.addEventListener('change', handleTrelloCredentialsChange);
trelloAuthTokenInput.addEventListener('change', handleTrelloCredentialsChange);
trelloUsernameInput.addEventListener('change', handleTrelloCredentialsChange);

jsonFileInput.addEventListener('change', async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];

  if (file) {
    timetableManager.clearTimetables();

    try {
      const text = await file.text();
      timetableManager.importTimetables(text);
      refreshHoursDisplay();
      updateVisualization();
      showStatus('Successfully imported timetables from JSON');
    } catch (error) {
      console.error('Error importing JSON file:', error);
      showStatus(`Error importing JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    }
    jsonFileInput.value = ''; // Reset input
  }
});

clearBtn.addEventListener('click', () => {
  timetableManager.clearTimetables();
  updateVisualization();
  refreshHoursDisplay();
  showStatus('All data cleared');
});

setHoursBtn.addEventListener('click', updateHoursForCurrentDate);

setDayOffBtn.addEventListener('click', () => {
  hoursInput.value = DEFAULT_HOURS_PER_DAY.toString();

  updateHoursForCurrentDate();
});

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

exportBtn.addEventListener('click', () => {
  const json = timetableManager.exportTimetables();

  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(json);
  var dlAnchorElem = document.getElementById('downloadAnchorElem')!;
  dlAnchorElem.setAttribute("href", dataStr);
  dlAnchorElem.setAttribute("download", "timetable_export.json");
  dlAnchorElem.click();
});

// Initialize
updateVisualization();
refreshHoursDisplay();

console.log('Activity Visualizer initialized');
