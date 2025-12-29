import { Activity } from './ActivityManager';
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

  // Clear all timetables
  clearTimetables(): void {
    this.dailyTimetables.clear();
    if (this.timeline) {
      this.timeline.destroy();
      this.timeline = null;
    }
  }

  // Initialize timeline visualization
  initializeTimeline(container: HTMLElement, activities: Activity[]): void {
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
    console.log("initializing timetable for date:", this.currentDate);
    const options: TimelineOptions = {
      height: '600px',
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
