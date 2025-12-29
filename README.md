# Activity Visualizer

A frontend single-page application built with TypeScript for importing and visualizing activities from multiple sources.

## Features

- **Multiple Import Formats**: Support for CSV, iCal (.ics), and MBOX email files
- **Interactive Timeline**: Visual timeline powered by vis-timeline library
- **Daily Hours Tracking**: Track and manage hours worked for each day
- **Modular Architecture**: Clean separation of concerns with dedicated modules

## Architecture

The application consists of three main modules:

1. **Data Loader Module** (`src/modules/DataLoader.ts`)
   - Handles parsing of different file formats (CSV, iCal, MBOX)
   - Provides a unified interface through DataLoaderFactory
   - Converts various formats into a common Activity structure

2. **Activity Manager** (`src/modules/ActivityManager.ts`)
   - Manages activity lifecycle (CRUD operations)
   - Filters activities by date
   - Maintains the collection of all imported activities

3. **Timetable Manager** (`src/modules/TimetableManager.ts`)
   - Organizes activities into daily timetables
   - Tracks hours worked per day
   - Integrates with vis-timeline for visualization

## Installation

```bash
npm install
```

## Usage

### Development Server

Start the development server with hot reloading:

```bash
npm run dev
```

The application will open automatically at http://localhost:9000

### Production Build

Build the application for production:

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Using the Application

1. **Import Activities**
   - Click on "Import CSV", "Import iCal", or "Import MBOX" buttons
   - Select your file to import activities
   - Activities will be displayed in the timeline

2. **View Timeline**
   - The timeline shows all imported activities
   - Zoom in/out and pan to navigate
   - Activities are color-coded by source (CSV=blue, iCal=purple, MBOX=green)

3. **Track Hours**
   - Select a date using the date picker
   - Enter hours worked for that day
   - Click "Set Hours" to save
   - View all tracked hours in the "Hours Worked by Date" section

4. **Clear Data**
   - Click "Clear All" to remove all imported activities and tracked hours

## Sample Data

Sample data files are provided in the `examples/` directory:

- `sample_activities.csv` - Sample CSV activities
- `sample_calendar.ics` - Sample iCal calendar events
- `sample_emails.mbox` - Sample email messages

## File Format Requirements

### CSV Format
```csv
title,start,end,description,location
Meeting,2025-01-15T09:00:00,2025-01-15T10:00:00,Team meeting,Room A
```

### iCal Format
Standard iCalendar format (.ics files) with VEVENT components.

### MBOX Format
Standard MBOX email format with Date and Subject headers.

## Dependencies

- **ical.js**: iCalendar format parsing (browser-compatible)
- **vis-timeline**: Timeline visualization

Note: CSV and MBOX parsing are implemented with custom parsers for browser compatibility.

## Development Dependencies

- TypeScript
- Webpack
- ts-loader
- html-webpack-plugin
- webpack-dev-server

## License

See LICENSE file for details.
