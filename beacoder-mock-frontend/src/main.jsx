import React, { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './style.css';
import Questionnaire from './Questionnaire.jsx';
import { AdminCandidateDetails, AdminCandidates } from './Admin.jsx';

const api = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3010/api/v1/mock';
const blank = { fullName: '', email: '', phone: '', yearOfPassing: '', location: '', preferredLocation: '' };

function Registration() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(); const [form, setForm] = useState(blank); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  const years = useMemo(() => Array.from({ length: 31 }, (_, i) => new Date().getFullYear() + 1 - i), []);
  useEffect(() => { axios.get(`${api}/tests/${encodeURIComponent(testId)}`).then(({ data }) => setTest(data)).catch((e) => setError(e.response?.data?.message || 'Assessment unavailable.')); }, [testId]);
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async (e) => { e.preventDefault(); setError(''); setSaving(true); try { const { data } = await axios.post(`${api}/registrations`, { ...form, companyName: 'KYROX AI', testId }); sessionStorage.setItem('mockStudentId', data.studentId); sessionStorage.setItem('mockTestId', testId); navigate(`/test/${testId}/questions`); } catch (err) { setError(err.response?.data?.message || 'Unable to register.'); } finally { setSaving(false); } };
  if (error && !test) return <main className="state"><h1>Assessment unavailable</h1><p>{error}</p></main>;
  if (!test) return <main className="state">Loading assessment...</main>;
  return <main className="page"><section className="card"><header><div className="brand-lockup"><span className="brand-icon">K</span><span><strong>KYROX AI</strong><small>INTELLIGENCE FOR WHAT'S NEXT</small></span></div><h1>Candidate Registration</h1><p>Take the next step in your journey with the {test.jobRole} assessment.</p><div className="pill"><b>{test.testId}</b><span>{test.totalQuestions} questions</span></div></header>{error && <div className="error">{error}</div>}<form onSubmit={submit}><div className="grid">{[['fullName','Full Name','Enter your full name'],['email','Email Address','you@example.com'],['phone','Indian Mobile Number','10-digit number'],['location','Current Location','e.g. Kochi'],['preferredLocation','Preferred Work Location','e.g. Bangalore']].map(([name,label,placeholder]) => <label key={name}>{label}<input name={name} type={name === 'email' ? 'email' : 'text'} placeholder={placeholder} value={form[name]} onChange={change} required pattern={name === 'phone' ? '[6-9][0-9]{9}' : undefined} maxLength={name === 'phone' ? 10 : undefined} /></label>)}<label>Job Role<input value={test.jobRole} readOnly /></label><label>Year of Passing<select name="yearOfPassing" value={form.yearOfPassing} onChange={change} required><option value="">Select year</option>{years.map((year) => <option key={year}>{year}</option>)}</select></label></div><button disabled={saving}>{saving ? 'Registering...' : 'Register & Start Assessment'}</button></form></section></main>;
}
function App() {
  return <Routes><Route path="/test/:testId" element={<Registration />} /><Route path="/test/:testId/questions" element={<Questionnaire />} /><Route path="/admin/candidates" element={<AdminCandidates />} /><Route path="/admin/candidates/:studentId" element={<AdminCandidateDetails />} /><Route path="*" element={<Registration />} /></Routes>;
}
createRoot(document.getElementById('root')).render(<StrictMode><BrowserRouter><App /></BrowserRouter></StrictMode>);
