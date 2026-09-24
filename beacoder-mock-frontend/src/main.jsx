import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useParams } from 'react-router-dom';
import axios from 'axios';
import './style.css';

const api = 'http://localhost:3010/api/v1/mock';
const blank = { companyName: '', fullName: '', email: '', phone: '', yearOfPassing: '', location: '', preferredLocation: '' };

function Registration() {
  const { testId } = useParams();
  const [test, setTest] = useState(); const [form, setForm] = useState(blank); const [error, setError] = useState(''); const [saving, setSaving] = useState(false); const [studentId, setStudentId] = useState('');
  const years = useMemo(() => Array.from({ length: 31 }, (_, i) => new Date().getFullYear() + 1 - i), []);
  useEffect(() => { axios.get(`${api}/tests/${encodeURIComponent(testId)}`).then(({ data }) => setTest(data)).catch((e) => setError(e.response?.data?.message || 'Assessment unavailable.')); }, [testId]);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async (e) => { e.preventDefault(); setError(''); setSaving(true); try { const { data } = await axios.post(`${api}/registrations`, { ...form, testId }); sessionStorage.setItem('mockStudentId', data.studentId); sessionStorage.setItem('mockTestId', testId); setStudentId(data.studentId); } catch (err) { setError(err.response?.data?.message || 'Unable to register.'); } finally { setSaving(false); } };
  if (error && !test) return <main className="state"><h1>Assessment unavailable</h1><p>{error}</p></main>;
  if (!test) return <main className="state">Loading assessment...</main>;
  if (studentId) return <main className="state success"><h1>Registration successful</h1><p>Your Student ID is <strong>{studentId}</strong>.</p><p>The assessment page will be connected next.</p></main>;
  return <main className="page"><section className="card"><header><small>BEACODER ASSESSMENT</small><h1>Candidate Registration</h1><p>Complete your details to begin the {test.jobRole} assessment.</p><div className="pill"><b>{test.testId}</b><span>{test.totalQuestions} questions</span></div></header>{error && <div className="error">{error}</div>}<form onSubmit={submit}><div className="grid">{[['companyName','Company Name','Enter company name'],['fullName','Full Name','Enter your full name'],['email','Email Address','you@example.com'],['phone','Indian Mobile Number','10-digit number'],['location','Current Location','e.g. Kochi'],['preferredLocation','Preferred Work Location','e.g. Bangalore']].map(([name,label,placeholder]) => <label key={name}>{label}<input name={name} type={name === 'email' ? 'email' : 'text'} placeholder={placeholder} value={form[name]} onChange={change} required pattern={name === 'phone' ? '[6-9][0-9]{9}' : undefined} maxLength={name === 'phone' ? 10 : undefined} /></label>)}<label>Job Role<input value={test.jobRole} readOnly /></label><label>Year of Passing<select name="yearOfPassing" value={form.yearOfPassing} onChange={change} required><option value="">Select year</option>{years.map((year) => <option key={year}>{year}</option>)}</select></label></div><button disabled={saving}>{saving ? 'Registering...' : 'Register & Start Assessment'}</button></form></section></main>;
}
function App() { return <Registration />; }
createRoot(document.getElementById('root')).render(<StrictMode><BrowserRouter><App /></BrowserRouter></StrictMode>);
