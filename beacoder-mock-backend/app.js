const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const dataDir = path.join(__dirname, 'data');
const testsFile = path.join(dataDir, 'tests.json');
const candidatesFile = path.join(dataDir, 'candidates.json');
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

app.get('/api/v1/mock/tests/:testId', async (req, res) => {
  const { tests } = await readJson(testsFile, { tests: [] });
  const test = tests.find((item) => item.testId === req.params.testId);
  if (!test) return res.status(404).json({ message: 'Invalid test ID.' });
  return res.json(test);
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

const port = process.env.PORT || 3010;
app.listen(port, () => console.log(`beacoder-mock backend running on port ${port}`));
