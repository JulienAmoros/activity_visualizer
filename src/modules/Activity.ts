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
