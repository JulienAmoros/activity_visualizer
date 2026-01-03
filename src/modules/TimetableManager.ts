import { Activity } from './Activity';
import { Timeline, TimelineOptions, DataSet } from 'vis-timeline/standalone';

// Timetable data structure
export interface DailyTimetable {
  date: Date;
  activities: Activity[];
  hoursWorked: number;
}

type Years = { years: Map<number, Weeks> };
type Weeks = { weeks: Map<number, WeeklyTimetables> };
type WeeklyTimetables = {
  weeklyHoursWorked: number;
  timetables: Map<string, DailyTimetable>;
};

// TimetableManager class
export class TimetableManager {
  private timetables: Years = { years: new Map() };
  private timeline: Timeline | null = null;
  private currentDate: Date = new Date();

  // Get date key for map
  private getDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Print all daily timetables (for debugging)
  printHoursByWeekByYear(): void {
    console.log("=== Daily Timetables ===");
    this.timetables.years.forEach(({ weeks }, year) => {
      console.log(`=> Year: ${year}`);
      weeks.forEach((weeklyTimetables, week) => {
      console.log(`==> Week: ${week} (Hours Worked: ${weeklyTimetables.weeklyHoursWorked})`);
        weeklyTimetables.timetables.forEach(timetable => {
          console.log(`Date: ${timetable.date}, Hours Worked: ${timetable.hoursWorked}, Activities: ${timetable.activities.length}`);
        });
      });
    });
  }

  // Initialize daily timetable for a specific date
  private initDailyTimetable(date: Date): DailyTimetable {
    const key = this.getDateKey(date);
    const yearNumber = date.getFullYear();
    const weekNumber = this.getDateWeek(date);

    if (! this.timetables.years.get(yearNumber)) {
      this.timetables.years.set(yearNumber, { weeks: new Map<number, WeeklyTimetables>() });
    }
    const year = this.timetables.years.get(yearNumber)!;

    if (! year.weeks.get(weekNumber)) {
      year.weeks.set(weekNumber, { weeklyHoursWorked: 0, timetables: new Map<string, DailyTimetable>() });
    }
    const weekMap = year.weeks.get(weekNumber)!;

    if (! weekMap.timetables.get(key)) {
      weekMap.timetables.set(key, { date, activities: [], hoursWorked: 0 });
    }

    return weekMap.timetables.get(key)!;
  }

  // Set hours worked for a specific date
  setHoursWorked(date: Date, hours: number): void {
    const dailyTimetable = this.getTimetableForDate(date) || this.initDailyTimetable(date);

    dailyTimetable.hoursWorked = hours;

    this.refreshWeeklyHoursWorked(date);
  }

  private refreshWeeklyHoursWorked(date: Date) {
    const yearNumber = date.getFullYear();
    const weekNumber = this.getDateWeek(date);
    const weekMap = this.timetables.years.get(yearNumber)?.weeks.get(weekNumber)!;

    let totalHours = 0;
    weekMap.timetables.forEach(timetable => {
      totalHours += timetable.hoursWorked;
    });
    weekMap.weeklyHoursWorked = totalHours;
  }

  // Add activities to timetable
  addActivities(activities: Activity[]): void {
    activities.forEach(activity => {
      const dailyTimetable = this.getTimetableForDate(activity.start) || this.initDailyTimetable(activity.start);
      const week = this.getWeek(activity.start)!;

      dailyTimetable.activities.push(activity);
    });
  }

  // Get timetable for a specific date
  getTimetableForDate(date: Date): DailyTimetable | undefined {
    const yearNumber = date.getFullYear();
    const weekNumber = this.getDateWeek(date);

    return this.timetables.years.get(yearNumber)?.weeks.get(weekNumber)?.timetables.get(this.getDateKey(date));
  }

  // Get all dates with timetables
  // TODO: refacto to simplify where it's used
  getAllDates(): Date[] {
    const dates: Date[] = [];

    this.timetables.years.forEach(({ weeks }) => {
      weeks.forEach((weeklyTimetables) => {
        weeklyTimetables.timetables.forEach((dailyTimetable) => {
          dates.push(dailyTimetable.date);
        });
      });
    });

    return dates.sort((a, b) => a.getTime() - b.getTime());
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
    this.timetables.years.clear();
    if (this.timeline) {
      this.timeline.destroy();
      this.timeline = null;
    }
  }

  // Update timeline visualization
  updateTimelineDisplay(container: HTMLElement, activities: Activity[]): void {
    const items = new DataSet(
      activities.map(activity => ({
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

  //
  // IMPORT / EXPORT
  //
  // Export timetables to JSON
  exportTimetables(): string {
    return JSON.stringify(this.timetables, replacer);

    function replacer(key: any, value: any) {
      if(value instanceof Map) {
        return {
          dataType: 'Map',
          value: Array.from(value.entries()),
        };
      } else {
        return value;
      }
    }
  }

  //
  //  GETTERS / SETTERS
  //
  // Get timeline instance
  getTimeline(): Timeline | null {
    return this.timeline;
  }

  // Set current date in timeline
  setCurrentDate(date: Date): void {
    date.setHours(12, 0, 0, 0);
    this.currentDate = date;
  }

  // Get current date in timeline
  getCurrentDate(): Date {
    return new Date(this.currentDate);
  }

  // Get start time of current date
  getCurrentDateStartTime(): Date {
    const startOfDay = this.getCurrentDate();
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay;
  }

  // Get end time of current date
  getCurrentDateEndTime(): Date {
    const endOfDay = this.getCurrentDate();
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  }

  // Get hours worked for a specific date
  getHoursWorked(date: Date): number {
    const dailyTimetable = this.getTimetableForDate(date);

    return dailyTimetable?.hoursWorked || 0;
  }

  // Get timetables
  getAllTimetables(): Years {
    return this.timetables;
  }

  // Get hoursByWeekByYear
  getWeek(date: Date): WeeklyTimetables | undefined {
    const year = date.getFullYear();
    const week = this.getDateWeek(date);
    return this.timetables.years.get(year)?.weeks.get(week);
  }

  // Get hours worked for a specific date
  getWeeklyHoursWorked(year: number, week: number): number {
    const weekMap = this.timetables.years.get(year)?.weeks.get(week);

    return weekMap?.weeklyHoursWorked || 0;
  }
}
