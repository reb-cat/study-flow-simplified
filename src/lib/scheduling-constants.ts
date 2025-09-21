// Family Pattern Scheduling - Core Constants
// Based on Charlotte Mason's "change is as good as a rest" principle

export const FAMILY_PATTERNS = {
  "Abigail": {
    "Monday": ["Analytical", "Humanities", "Composition"],
    "Tuesday": ["Analytical", "Humanities", "Composition", "Creative", "Analytical", "Humanities"],
    "Wednesday": ["Analytical", "Humanities", "Composition", "Creative", "Analytical"],
    "Thursday": ["Study Hall"], // During co-op
    "Friday": ["Analytical", "Humanities", "Composition", "Creative", "Analytical", "Humanities", "Composition"]
  },
  "Khalil": {
    "Monday": ["Analytical", "Humanities", "Composition"],
    "Tuesday": ["Analytical", "Humanities", "Composition", "Creative", "Analytical"],
    "Wednesday": ["Analytical", "Humanities", "Composition", "Creative", "Analytical"],
    "Thursday": ["Study Hall", "Study Hall"], // During co-op
    "Friday": ["Analytical", "Humanities", "Composition", "Creative", "Analytical"]
  }
};

export const COURSE_FAMILY_MAP: Record<string, string> = {
  "Algebra 1": "Analytical",
  "Geometry": "Analytical",
  "Earth Science": "Analytical",
  "Science": "Analytical",
  "English Fundamentals": "Composition",
  "English Composition": "Composition",
  "Grammar": "Composition",
  "American History": "Humanities",
  "American Literature": "Humanities",
  "Literature": "Humanities",
  "Art": "Creative",
  "Photography": "Creative",
  "Baking": "Creative",
  "Forensics": "Analytical",
  "Health": "Humanities"
};

export const FALLBACKS = {
  "Creative": [
    { title: "Sketch a map from today's history reading", minutes: 20 },
    { title: "Draw and label a science diagram", minutes: 20 },
    { title: "Create a narration sketch", minutes: 15 }
  ],
  "Analytical": { title: "Review math problems", minutes: 20 },
  "Humanities": { title: "Free reading", minutes: 30 },
  "Composition": { title: "Journal entry", minutes: 15 }
};

export const FAMILY_COLORS = {
  "Analytical": "hsl(var(--primary))",
  "Humanities": "hsl(var(--success))", 
  "Composition": "hsl(var(--timer))",
  "Creative": "hsl(220 14% 46%)",
  "Study Hall": "hsl(var(--muted-foreground))"
};

export type Family = "Analytical" | "Humanities" | "Composition" | "Creative" | "Study Hall";
export type Student = "Abigail" | "Khalil";
export type WeekDay = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";