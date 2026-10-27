// A block of time worked. GTA entries have a course (project) and a period; ResLife ones have neither.
export interface TimeEntry {
	id: string;
	roleId: string;
	projectId: string;   // course, '' = none
	typeId: string;      // task type id, '' = none
	periodId: string;    // GTA period it is submitted in, '' = none
	date: string;        // "YYYY-MM-DD"
	start: string;       // "HH:mm", '' = only a duration was entered
	end: string;         // "HH:mm", '' = only a duration was entered
	minutes: number;
	note: string;
	submittedOn: string; // timesheet roles: day it was handed in, '' = not yet
}

// A semester with an hours cap, shared by all the periods in it.
export interface Semester {
	id: string;
	name: string;
	limitHours: number;
}

// A window in which hours are submitted, e.g. "Sep/Oct" submitted between 26 Oct and 3 Nov.
export interface Period {
	id: string;
	roleId: string;
	semesterId: string;
	name: string;
	from: string;      // first day to submit, "YYYY-MM-DD"
	to: string;        // last day to submit
	taskId: string;    // id of the "submit hours" task made for this period
	submitted: boolean; // that task has been completed
}

// 'periods' = hours per course, submitted in windows. 'timesheet' = one list, handed in every 7-10 days.
export type TimeKind = 'periods' | 'timesheet';

// How one role tracks its time.
export interface TimeRole {
	roleId: string;
	kind: TimeKind;
	taskText: string;      // description of the reminder task, e.g. "Submit {period} hours between {from}-{to}"
	remindDays: number;    // timesheet: days after the last submission to remind
	lastSubmitted: string; // timesheet: "YYYY-MM-DD", '' = never
	taskId: string;        // timesheet: id of the current reminder task
}

// What a fresh install tracks.
export const DEFAULT_TIME_ROLES: TimeRole[] = [
	{ roleId: 'gta', kind: 'periods', taskText: 'Submit {period} hours between {from}-{to}', remindDays: 0, lastSubmitted: '', taskId: '' },
	{ roleId: 'reslife', kind: 'timesheet', taskText: 'Submit timesheet to Evalu8 - last submitted on {last}', remindDays: 10, lastSubmitted: '', taskId: '' },
];
