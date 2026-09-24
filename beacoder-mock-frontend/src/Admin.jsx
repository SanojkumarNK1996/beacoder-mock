import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const api = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3010/api/v1/mock';

const formatDate = (value) => value ? new Date(value).toLocaleString() : 'Not completed';

const Brand = () => <div className="brand-lockup admin-brand"><span className="brand-icon">K</span><span><strong>KYROX AI</strong><small>INTELLIGENCE FOR WHAT'S NEXT</small></span></div>;

function AdminCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('createdAt-desc');
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${api}/admin/candidates`)
      .then(({ data }) => setCandidates(data.candidates))
      .catch(() => setError('Unable to load candidate records.'));
  }, []);

  const visibleCandidates = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = candidates.filter((candidate) => [candidate.studentId, candidate.name, candidate.phone, candidate.jobRole].some((value) => String(value || '').toLowerCase().includes(query)));
    const [field, direction] = sort.split('-');
    return filtered.sort((a, b) => {
      const left = String(a[field] || '').toLowerCase();
      const right = String(b[field] || '').toLowerCase();
      return direction === 'asc' ? left.localeCompare(right, undefined, { numeric: true }) : right.localeCompare(left, undefined, { numeric: true });
    });
  }, [candidates, search, sort]);

  return <main className="admin-page"><section className="admin-shell"><Brand /><div className="admin-heading"><div><span className="admin-kicker">ADMIN CONSOLE</span><h1>Candidate Records</h1><p>Search, sort, and review assessment submissions.</p></div><span className="candidate-count">{visibleCandidates.length} records</span></div><div className="admin-toolbar"><input aria-label="Search candidates" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by ID, name, phone, or job role" /><select aria-label="Sort candidates" value={sort} onChange={(event) => setSort(event.target.value)}><option value="createdAt-desc">Newest first</option><option value="createdAt-asc">Oldest first</option><option value="name-asc">Name A-Z</option><option value="name-desc">Name Z-A</option><option value="score-desc">Highest score</option><option value="score-asc">Lowest score</option></select><a className="export-button" href={`${api}/admin/candidates/export`} download>Export Excel</a></div>{error && <div className="error admin-error">{error}</div>}<div className="table-wrap"><table><thead><tr><th>Student ID</th><th>Name</th><th>Phone</th><th>Total Mark</th><th>Job Role</th><th>Completed At</th><th>Action</th></tr></thead><tbody>{visibleCandidates.map((candidate) => <tr key={candidate.studentId}><td><strong>{candidate.studentId}</strong></td><td>{candidate.name}</td><td>{candidate.phone}</td><td>{candidate.score === null ? 'Not submitted' : `${candidate.score}/${candidate.totalQuestions}`}</td><td>{candidate.jobRole}</td><td>{formatDate(candidate.completedAt)}</td><td><Link className="view-link" to={`/admin/candidates/${candidate.studentId}`}>View more</Link></td></tr>)}</tbody></table>{!error && visibleCandidates.length === 0 && <div className="empty-state">No candidate records found.</div>}</div></section></main>;
}

function AdminCandidateDetails() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${api}/admin/candidates/${encodeURIComponent(studentId)}`)
      .then(({ data }) => setCandidate(data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load candidate.'));
  }, [studentId]);

  if (error) return <main className="admin-page"><section className="admin-shell detail-shell"><Brand /><div className="detail-error"><h1>Candidate not found</h1><p>{error}</p><button onClick={() => navigate('/admin/candidates')}>Back to candidates</button></div></section></main>;
  if (!candidate) return <main className="admin-page"><section className="admin-shell"><Brand /><div className="empty-state">Loading candidate details...</div></section></main>;

  return <main className="admin-page"><section className="admin-shell detail-shell"><Brand /><Link className="back-link" to="/admin/candidates">← Back to candidates</Link><div className="detail-heading"><div><span className="admin-kicker">CANDIDATE DETAILS</span><h1>{candidate.name}</h1><p>{candidate.studentId} · {candidate.jobRole}</p></div><span className="status-badge">{candidate.status}</span></div><div className="detail-grid">{[['Student ID', candidate.studentId], ['Company', candidate.companyName], ['Job Role', candidate.jobRole], ['Email', candidate.email], ['Phone', candidate.phone], ['Year of Passing', candidate.yearOfPassing], ['Current Location', candidate.location], ['Preferred Location', candidate.preferredLocation], ['Score', candidate.score === null ? 'Not submitted' : `${candidate.score}/${candidate.totalQuestions}`], ['Total Questions', candidate.totalQuestions], ['Created At', formatDate(candidate.createdAt)], ['Completed At', formatDate(candidate.completedAt)], ['Updated At', formatDate(candidate.updatedAt)]].map(([label, value]) => <div className="detail-item" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><section className="topic-panel"><h2>Topic-wise scores</h2>{Object.keys(candidate.topicScores || {}).length ? <div className="topic-list">{Object.entries(candidate.topicScores).map(([topic, score]) => <div key={topic}><span>{topic}</span><strong>{score}</strong></div>)}</div> : <p>No score submitted yet.</p>}</section></section></main>;
}

export { AdminCandidates, AdminCandidateDetails };
