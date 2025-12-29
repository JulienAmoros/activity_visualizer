// Activity data structure
export interface Activity {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  source?: 'mbox' | 'ical' | 'csv';
}

// ActivityManager class to manage activities
export class ActivityManager {
  private activities: Activity[] = [];

  // Add a new activity
  addActivity(activity: Activity): void {
    this.activities.push(activity);
  }

  // Add multiple activities
  addActivities(activities: Activity[]): void {
    this.activities.push(...activities);
  }

  // Get all activities
  getActivities(): Activity[] {
    return this.activities;
  }

  // Get activities for a specific date
  getActivitiesForDate(date: Date): Activity[] {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.activities.filter(activity => {
      return activity.start >= startOfDay && activity.start <= endOfDay;
    });
  }

  // Clear all activities
  clearActivities(): void {
    this.activities = [];
  }

  // Remove activity by id
  removeActivity(id: string): void {
    this.activities = this.activities.filter(activity => activity.id !== id);
  }

  // Update an activity
  updateActivity(id: string, updates: Partial<Activity>): boolean {
    const index = this.activities.findIndex(activity => activity.id === id);
    if (index === -1) return false;
    this.activities[index] = { ...this.activities[index], ...updates };
    return true;
  }
}
