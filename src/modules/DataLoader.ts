import { Activity } from './ActivityManager';
import ICAL from 'ical.js';

// Base interface for all loaders
export interface DataLoader {
  load(data: string): Promise<Activity[]>;
}

// CSV Loader
export class CSVLoader implements DataLoader {
  async load(data: string): Promise<Activity[]> {
    const activities: Activity[] = [];
    const lines = data.split('\n');

    // Skip header if present
    const startIndex = lines[0]?.toLowerCase().includes('title') ||
                       lines[0]?.toLowerCase().includes('start') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = this.parseCSVLine(line);
      if (parts.length < 3) continue;

      const [title, startStr, endStr, description, location] = parts;

      activities.push({
        id: `csv-${Date.now()}-${i}`,
        title: title || 'Untitled',
        start: new Date(startStr),
        end: new Date(endStr || startStr),
        description: description || '',
        location: location || '',
        source: 'csv'
      });
    }

    return activities;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        // Handle escaped quotes ("") within quoted fields
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip the next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }
}

// iCal Loader
export class ICalLoader implements DataLoader {
  async load(data: string): Promise<Activity[]> {
    const activities: Activity[] = [];

    try {
      const jcalData = ICAL.parse(data);
      const comp = new ICAL.Component(jcalData);
      const vevents = comp.getAllSubcomponents('vevent');

      vevents.forEach((vevent: any) => {
        const event = new ICAL.Event(vevent);

        activities.push({
          id: `ical-${event.uid || Date.now()}`,
          title: event.summary || 'Untitled Event',
          start: event.startDate.toJSDate(),
          end: event.endDate.toJSDate(),
          description: event.description || '',
          location: event.location || '',
          source: 'ical'
        });
      });
    } catch (error) {
      console.error('Error parsing iCal data:', error);
    }

    return activities;
  }
}

// MBOX Loader (simplified - extracts date and subject from emails)
export class MBOXLoader implements DataLoader {
  private readonly DEFAULT_EMAIL_DURATION_MINUTES = 10;

  async load(data: string): Promise<Activity[]> {
    const activities: Activity[] = [];

    // Split mbox into individual messages
    const messages = data.split('\nFrom ');

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      if (!message.trim()) continue;

      const subjectMatch = message.match(/^Subject:\s*(.+)$/m);
      const dateMatch = message.match(/^Date:\s*(.+)$/m);
      const fromMatch = message.match(/^From:\s*(.+)$/m);

      if (subjectMatch && dateMatch) {
        const date = new Date(dateMatch[1]);
        const startDate = new Date(date);
        startDate.setMinutes(date.getMinutes() - this.DEFAULT_EMAIL_DURATION_MINUTES);

        activities.push({
          id: `mbox-${Date.now()}-${i}`,
          title: subjectMatch[1].trim(),
          start: startDate,
          end: date,
          description: fromMatch ? `From: ${fromMatch[1]}` : '',
          location: 'Email',
          source: 'mbox'
        });
      }
    }

    return activities;
  }
}

// Unified DataLoader factory
export class DataLoaderFactory {
  static getLoader(fileType: 'csv' | 'ical' | 'mbox'): DataLoader {
    switch (fileType) {
      case 'csv':
        return new CSVLoader();
      case 'ical':
        return new ICalLoader();
      case 'mbox':
        return new MBOXLoader();
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  }
}
