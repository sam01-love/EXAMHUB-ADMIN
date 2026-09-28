// Mirrors src/data/mockData.js in the student app (examhub). Keep the subject
// id list in sync with that file — these ids are what the student app's
// `fetchQuestions(subjectId, count)` queries the `questions` table with.

export const subjectMeta = {
  english: { name: 'Use of English', short: 'English' },
  mathematics: { name: 'Mathematics', short: 'Maths' },
  physics: { name: 'Physics', short: 'Physics' },
  chemistry: { name: 'Chemistry', short: 'Chemistry' },
  biology: { name: 'Biology', short: 'Biology' },
  literature: { name: 'Literature-in-English', short: 'Literature' },
  government: { name: 'Government', short: 'Government' },
  crs: { name: 'Christian Religious Studies', short: 'CRS' },
  history: { name: 'History', short: 'History' },
  economics: { name: 'Economics', short: 'Economics' },
  commerce: { name: 'Commerce', short: 'Commerce' },
  accounts: { name: 'Financial Accounting', short: 'Accounts' },
}

export const subjectIds = Object.keys(subjectMeta)

export const streams = [
  { id: 'science', name: 'Science' },
  { id: 'arts', name: 'Arts' },
  { id: 'commercial', name: 'Commercial' },
]

export function subjectQuestionCount(subjectId) {
  return subjectId === 'english' ? 60 : 40
}
