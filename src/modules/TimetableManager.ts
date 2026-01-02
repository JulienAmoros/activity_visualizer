import { Activity } from './Activity';
import { Timeline, TimelineOptions, DataSet } from 'vis-timeline/standalone';

// Timetable data structure
export interface DailyTimetable {
  date: Date;
  activities: Activity[];
  hoursWorked: number;
}

// TimetableManager class
export class TimetableManager {
  private dailyTimetables: Map<string, DailyTimetable> = new Map();
  private timeline: Timeline | null = null;
  private currentDate: Date = new Date();

  // Get date key for map
  private getDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Print all daily timetables (for debugging)
  printDailyTimetables(): void {
    console.log("=== Daily Timetables ===");
    this.dailyTimetables.forEach((timetable, key) => {
      console.log(`Date: ${key}, Hours Worked: ${timetable.hoursWorked}, Activities: ${timetable.activities.length}`);
    });
  }

  // Set hours worked for a specific date
  setHoursWorked(date: Date, hours: number): void {
    const key = this.getDateKey(date);
    const timetable = this.dailyTimetables.get(key) || {
      date: new Date(date),
      activities: [],
      hoursWorked: 0
    };
    timetable.hoursWorked = hours;
    this.dailyTimetables.set(key, timetable);
  }

  // Get hours worked for a specific date
  getHoursWorked(date: Date): number {
    const key = this.getDateKey(date);
    return this.dailyTimetables.get(key)?.hoursWorked || 0;
  }

  // Add activities to timetable
  addActivities(activities: Activity[]): void {
    activities.forEach(activity => {
      const key = this.getDateKey(activity.start);
      const timetable = this.dailyTimetables.get(key) || {
        date: new Date(activity.start),
        activities: [],
        hoursWorked: 0
      };
      timetable.activities.push(activity);
      this.dailyTimetables.set(key, timetable);
    });
  }

  // Get timetable for a specific date
  getTimetableForDate(date: Date): DailyTimetable | undefined {
    return this.dailyTimetables.get(this.getDateKey(date));
  }

  // Get all dates with timetables
  getAllDates(): Date[] {
    return Array.from(this.dailyTimetables.values())
      .map(t => t.date)
      .sort((a, b) => a.getTime() - b.getTime());
  }

  // Get all dates with timetables grouped by week
  getAllDatesByWeek(): Map<number, Map<number, Date[]>> {
    const dates = this.getAllDates();
    const weeksByYears: Map<number, Map<number, Date[]>> = new Map();

    dates.forEach(date => {
      const year = date.getFullYear();
      const week = this.getDateWeek(date);

      if (! weeksByYears.has(year)) {
        weeksByYears.set(year, new Map());
      }

      const datesByWeek = weeksByYears.get(year)!;

      if (! datesByWeek.has(week)) {
        datesByWeek.set(week, []);
      }

      datesByWeek.get(week)!.push(date);
    });

    return weeksByYears;
  }

  getDateWeek(date: Date) {
    const firstDay = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - firstDay.getTime()) / (24 * 60 * 60 * 1000));

    return Math.ceil((days + firstDay.getDay() + 1) / 7);
  }

  getWeekStartDate(year: number, week: number): Date {
    const firstDayOfYear = new Date(year, 0, 1, 12);
    const daysOffset = (week - 1) * 7;
    const weekStartDate = new Date(firstDayOfYear.getTime() + daysOffset * 24 * 60 * 60 * 1000);

    // Adjust to the first day of the week (assuming week starts on Sunday)
    const dayOfWeek = weekStartDate.getDay();
    weekStartDate.setDate(weekStartDate.getDate() - dayOfWeek);

    return weekStartDate;
  }

  getWeekEndDate(year: number, week: number): Date {
    const weekStartDate = this.getWeekStartDate(year, week);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);

    return weekEndDate;
  }

  // Clear all timetables
  clearTimetables(): void {
    this.dailyTimetables.clear();
    if (this.timeline) {
      this.timeline.destroy();
      this.timeline = null;
    }
  }

  // Update timeline visualization
  updateTimelineDisplay(container: HTMLElement, activities: Activity[]): void {
    // Prepare items for timeline
    const filteredActivities = activities.filter(activity => {
      const endedAtCurrentDate = activity.end >= this.getCurrentDateStartTime() && activity.end <= this.getCurrentDateEndTime();
      const startedAtCurrentDate = activity.start >= this.getCurrentDateStartTime() && activity.start <= this.getCurrentDateEndTime();
      return endedAtCurrentDate || startedAtCurrentDate;
    });
    const items = new DataSet(
      filteredActivities.map(activity => ({
        id: activity.id,
        content: activity.title,
        start: activity.start,
        end: activity.end,
        title: `${activity.title}\n${activity.description || ''}`,
        className: `activity-${activity.source}`
      }))
    );

    // Timeline options
    const options: TimelineOptions = {
      height: '300px',
      margin: {
        item: 10,
        axis: 5
      },
      max: this.getCurrentDateEndTime(),
      min: this.getCurrentDateStartTime(),
      orientation: 'top',
      stack: true,
      zoomMin: 4 * 1000 * 60 * 60, // 4 hours
      zoomMax: 1000 * 60 * 60 * 24, // 1 day
    };

    // Create timeline
    if (this.timeline) {
      this.timeline.destroy();
    }
    this.timeline = new Timeline(container, items, options);
  }

  // Get timeline instance
  getTimeline(): Timeline | null {
    return this.timeline;
  }

  // Get current date in timeline
  getCurrentDate(): Date | null {
    return this.currentDate;
  }

  // Get start time of current date
  getCurrentDateStartTime(): Date {
    const startOfDay = new Date(this.currentDate);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay;
  }

  // Get end time of current date
  getCurrentDateEndTime(): Date {
    const endOfDay = new Date(this.currentDate);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  }

  // Set current date in timeline
  setCurrentDate(date: Date): void {
    this.currentDate = date;
  }
}
