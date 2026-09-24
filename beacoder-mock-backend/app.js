const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const XLSX = require('xlsx');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const dataDir = path.join(__dirname, 'data');
const testsFile = path.join(dataDir, 'tests.json');
const candidatesFile = path.join(dataDir, 'candidates.json');
const questionsDir = path.join(__dirname, 'questions');
let writeQueue = Promise.resolve();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

const readJson = async (file, fallback) => {
  await fs.mkdir(dataDir, { recursive: true });
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch { await fs.writeFile(file, JSON.stringify(fallback, null, 2)); return fallback; }
};
const writeCandidates = (data) => {
  writeQueue = writeQueue.then(async () => {
    const temporaryFile = `${candidatesFile}.tmp`;
    await fs.writeFile(temporaryFile, JSON.stringify(data, null, 2));
    await fs.rename(temporaryFile, candidatesFile);
  });
  return writeQueue;
};
const normalize = (value) => String(value || '').trim().toLowerCase();
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
const blockedEmail = (value) => ['mailinator.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'yopmail.com'].includes(normalize(value).split('@')[1]);
const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
const readQuestions = async (topic) => readJson(path.join(questionsDir, `${topic}.json`), []);

const getConfiguredQuestions = async (test) => {
  const selected = [];
  for (const [topic, count] of Object.entries(test.topics)) {
    const questions = shuffle(await readQuestions(topic)).slice(0, count);
    selected.push(...questions.map((question) => ({ ...question, topic })));
  }
  return shuffle(selected);
};

app.get('/api/v1/mock/tests/:testId', async (req, res) => {
  const { tests } = await readJson(testsFile, { tests: [] });
  const test = tests.find((item) => item.testId === req.params.testId);
  if (!test) return res.status(404).json({ message: 'Invalid test ID.' });
  return res.json(test);
});

app.get('/api/v1/mock/tests/:testId/questions', async (req, res) => {
  const { tests } = await readJson(testsFile, { tests: [] });
  const test = tests.find((item) => item.testId === req.params.testId);
  if (!test) return res.status(404).json({ message: 'Invalid test ID.' });
  const questions = await getConfiguredQuestions(test);
  return res.json({ testId: test.testId, jobRole: test.jobRole, totalQuestions: questions.length, questions: questions.map(({ correctAnswer, ...question }) => question) });
});

app.post('/api/v1/mock/registrations', async (req, res) => {
  const { testId, companyName, fullName, email, phone, yearOfPassing, location, preferredLocation } = req.body;
  const values = { testId, companyName, fullName, email, phone, yearOfPassing, location, preferredLocation };
  if (Object.values(values).some((value) => !String(value ?? '').trim())) return res.status(400).json({ message: 'All fields are required.' });
  if (!validEmail(email) || blockedEmail(email)) return res.status(400).json({ message: 'Enter a valid, non-temporary email address.' });
  const normalizedPhone = String(phone).replace(/\s|-/g, '');
  if (!/^[6-9]\d{9}$/.test(normalizedPhone)) return res.status(400).json({ message: 'Enter a valid 10-digit Indian mobile number.' });
  const { tests } = await readJson(testsFile, { tests: [] });
  const test = tests.find((item) => item.testId === testId);
  if (!test) return res.status(404).json({ message: 'Invalid test ID.' });
  const data = await readJson(candidatesFile, { candidates: [] });
  if (data.candidates.some((item) => normalize(item.email) === normalize(email) || item.phone === normalizedPhone)) return res.status(409).json({ message: 'This email or mobile number is already registered.' });
  const year = new Date().getFullYear();
  const prefix = `STU${year}`;
  const last = data.candidates.filter((item) => item.studentId?.startsWith(prefix)).map((item) => Number(item.studentId.slice(7))).filter(Number.isFinite).reduce((max, value) => Math.max(max, value), 0);
  const now = new Date().toISOString();
  const candidate = { studentId: `${prefix}${String(last + 1).padStart(4, '0')}`, testId, jobRole: test.jobRole, companyName: String(companyName).trim(), name: String(fullName).trim(), email: String(email).trim(), phone: normalizedPhone, yearOfPassing: Number(yearOfPassing), location: String(location).trim(), preferredLocation: String(preferredLocation).trim(), score: null, totalQuestions: test.totalQuestions, topicScores: {}, status: 'Under Review', createdAt: now, updatedAt: now, completedAt: null };
  data.candidates.push(candidate);
  await writeCandidates(data);
  return res.status(201).json({ studentId: candidate.studentId, testId, jobRole: test.jobRole });
});

app.post('/api/v1/mock/submissions', async (req, res) => {
  const { studentId, testId, answers } = req.body;
  if (!studentId || !testId || !answers || typeof answers !== 'object') return res.status(400).json({ message: 'Student ID, test ID, and answers are required.' });
  const { tests } = await readJson(testsFile, { tests: [] });
  const test = tests.find((item) => item.testId === testId);
  if (!test) return res.status(404).json({ message: 'Invalid test ID.' });
  const data = await readJson(candidatesFile, { candidates: [] });
  const candidate = data.candidates.find((item) => item.studentId === studentId && item.testId === testId);
  if (!candidate) return res.status(404).json({ message: 'Candidate registration not found.' });
  if (candidate.completedAt) return res.status(409).json({ message: 'This assessment has already been submitted.' });
  const questions = (await Promise.all(Object.keys(test.topics).map(readQuestions))).flat();
  let score = 0;
  const topicScores = {};
  for (const [topic, count] of Object.entries(test.topics)) {
    const topicQuestions = questions.filter((question) => question.id.startsWith(`${topic}-`));
    const topicScore = topicQuestions.reduce((total, question) => total + (Number(answers[question.id]) === question.correctAnswer ? 1 : 0), 0);
    score += topicScore;
    topicScores[topic] = `${topicScore}/${count}`;
  }
  const now = new Date().toISOString();
  candidate.score = score;
  candidate.topicScores = topicScores;
  candidate.updatedAt = now;
  candidate.completedAt = now;
  await writeCandidates(data);
  return res.json({ score, totalQuestions: test.totalQuestions, topicScores, status: candidate.status });
});

app.get('/api/v1/mock/admin/candidates', async (req, res) => {
  const data = await readJson(candidatesFile, { candidates: [] });
  return res.json({ candidates: data.candidates });
});

app.get('/api/v1/mock/admin/candidates/export', async (req, res) => {
  const data = await readJson(candidatesFile, { candidates: [] });
  const rows = data.candidates.map((candidate) => ({
    'Student ID': candidate.studentId,
    Name: candidate.name,
    Email: candidate.email,
    Phone: candidate.phone,
    Company: candidate.companyName,
    'Job Role': candidate.jobRole,
    'Test ID': candidate.testId,
    'Year of Passing': candidate.yearOfPassing,
    'Current Location': candidate.location,
    'Preferred Location': candidate.preferredLocation,
    Score: candidate.score === null ? '' : candidate.score,
    'Total Questions': candidate.totalQuestions,
    Status: candidate.status,
    'Created At': candidate.createdAt || '',
    'Completed At': candidate.completedAt || '',
    'Updated At': candidate.updatedAt || '',
    'Topic Scores': Object.entries(candidate.topicScores || {}).map(([topic, score]) => `${topic}: ${score}`).join(' | ')
  }));
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = Object.keys(rows[0] || { 'Student ID': '' }).map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidate Results');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="kyrox-candidate-results.xlsx"');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  return res.send(buffer);
});

app.get('/api/v1/mock/admin/candidates/:studentId', async (req, res) => {
  const data = await readJson(candidatesFile, { candidates: [] });
  const candidate = data.candidates.find((item) => item.studentId === req.params.studentId);
  if (!candidate) return res.status(404).json({ message: 'Candidate not found.' });
  return res.json(candidate);
});

const port = process.env.PORT || 3010;
app.listen(port, () => console.log(`beacoder-mock backend running on port ${port}`));
