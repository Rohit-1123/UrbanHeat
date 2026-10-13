import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { submitFeedback } from '../services/api';

const TOPICS = [
  { id: 'heat_risk', label: 'Heat risk score' },
  { id: 'routes', label: 'Cool routes' },
  { id: 'weather', label: 'Weather / temperature' },
  { id: 'other', label: 'Something else' },
];

const FeedbackPage = ({ currentLocation }) => {
  const [isCorrect, setIsCorrect] = useState(null);
  const [topic, setTopic] = useState('heat_risk');
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  const send = async (e) => {
    e.preventDefault();
    if (isCorrect === null) return;
    setStatus('sending');
    try {
      await submitFeedback({
        is_correct: isCorrect,
        topic,
        comment: comment.trim() || null,
        location_name: currentLocation?.name || null,
      });
      setStatus('sent');
    } catch (err) {
      setError(err.friendlyMessage || 'Could not send feedback.');
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <div className="page-container feedback-page">
        <h1 className="page-title">Thank you</h1>
        <p className="page-subtitle">Your feedback helps us make UrbanHeat more accurate.</p>
        <button type="button" className="feedback-submit" onClick={() => { setStatus('idle'); setIsCorrect(null); setComment(''); }}>
          Send another
        </button>
      </div>
    );
  }

  return (
    <div className="page-container feedback-page">
      <h1 className="page-title">Is the information correct?</h1>
      <p className="page-subtitle">Tell us if what UrbanHeat showed matches what you see on the ground.</p>

      <form onSubmit={send}>
        <div className="feedback-verdict" role="radiogroup" aria-label="Was the information correct?">
          <button type="button" role="radio" aria-checked={isCorrect === true}
            className={`feedback-choice ${isCorrect === true ? 'active yes' : ''}`} onClick={() => setIsCorrect(true)}>
            <ThumbsUp size={22} /> Correct
          </button>
          <button type="button" role="radio" aria-checked={isCorrect === false}
            className={`feedback-choice ${isCorrect === false ? 'active no' : ''}`} onClick={() => setIsCorrect(false)}>
            <ThumbsDown size={22} /> Incorrect
          </button>
        </div>

        <label className="feedback-label" htmlFor="fb-topic">About</label>
        <select id="fb-topic" className="feedback-field" value={topic} onChange={(e) => setTopic(e.target.value)}>
          {TOPICS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>

        <label className="feedback-label" htmlFor="fb-comment">Details (optional)</label>
        <textarea id="fb-comment" className="feedback-field" rows={4} maxLength={500} value={comment}
          onChange={(e) => setComment(e.target.value)} placeholder="What looked wrong or right?" />

        {status === 'error' && <p className="feedback-error" role="alert">{error}</p>}

        <button type="submit" className="feedback-submit" disabled={isCorrect === null || status === 'sending'}>
          {status === 'sending' ? <Loader2 size={18} className="animate-spin" /> : 'Send feedback'}
        </button>
      </form>
    </div>
  );
};

export default FeedbackPage;
