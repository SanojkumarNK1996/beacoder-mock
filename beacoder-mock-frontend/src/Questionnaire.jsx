import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const api = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3010/api/v1/mock';

function Questionnaire() {
  const { testId } = useParams();
  const studentId = sessionStorage.getItem('mockStudentId');
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!studentId) {
      setError('Please complete registration before starting the assessment.');
      setLoading(false);
      return;
    }
    axios.get(`${api}/tests/${encodeURIComponent(testId)}/questions`)
      .then(({ data }) => setTest(data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load questions.'))
      .finally(() => setLoading(false));
  }, [studentId, testId]);

  const answerQuestion = (questionId, optionIndex) => {
    setAnswers((current) => ({ ...current, [questionId]: optionIndex }));
  };

  const submitTest = async () => {
    setError('');
    setSubmitting(true);
    try {
      const { data } = await axios.post(`${api}/submissions`, { studentId, testId, answers });
      setResult(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to submit the assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <main className="state">Loading your assessment...</main>;
  if (error && !test) return <main className="state"><h1>Assessment unavailable</h1><p>{error}</p></main>;
  if (result) return <main className="page"><section className="result-card"><div className="brand-lockup"><span className="brand-icon">K</span><span><strong>KYROX AI</strong><small>INTELLIGENCE FOR WHAT'S NEXT</small></span></div><h1>Assessment submitted</h1><p className="result-score">{result.score}<span>/{result.totalQuestions}</span></p><p>If you are selected for the next stage, the KYROX AI team will contact you.</p><div className="result-topics">{Object.entries(result.topicScores).map(([topic, score]) => <div key={topic}><span>{topic}</span><strong>{score}</strong></div>)}</div></section></main>;

  const allAnswered = test.questions.length > 0 && test.questions.every((question) => answers[question.id] !== undefined);
  return <main className="page questionnaire-page"><section className="questionnaire-card"><header><div className="brand-lockup"><span className="brand-icon">K</span><span><strong>KYROX AI</strong><small>INTELLIGENCE FOR WHAT'S NEXT</small></span></div><div className="questionnaire-title"><div><h1>{test.jobRole} Assessment</h1><p>Answer all questions before submitting.</p></div><span className="question-count">{test.totalQuestions} QUESTIONS</span></div></header>{error && <div className="submission-error" role="alert">{error}</div>}<div className="question-list">{test.questions.map((question, index) => <article className="question-card" key={question.id}><div className="question-meta"><span>QUESTION {String(index + 1).padStart(2, '0')}</span><b>{question.topic}</b></div><h2>{question.question}</h2><div className="options">{question.options.map((option, optionIndex) => <label className={`option ${answers[question.id] === optionIndex ? 'selected' : ''}`} key={option}><input type="radio" name={question.id} checked={answers[question.id] === optionIndex} onChange={() => answerQuestion(question.id, optionIndex)} /><span className="option-marker">{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span></label>)}</div></article>)}</div><div className="submit-area"><span>{Object.keys(answers).length} of {test.questions.length} answered</span><button onClick={submitTest} disabled={!allAnswered || submitting}>{submitting ? 'Submitting...' : 'Submit Test'}</button></div></section></main>;
}

export default Questionnaire;
