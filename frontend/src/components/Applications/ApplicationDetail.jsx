import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import './ApplicationDetail.css';

const TABS = [
  { id: 'summary', name: 'Summary', icon: '📋' },
  { id: 'resume', name: 'Resume', icon: '📄' },
  { id: 'interview', name: 'Practice Interview', icon: '💬' },
  { id: 'notes', name: 'Interview Notes', icon: '📝' },
];

function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Application data
  const [application, setApplication] = useState(null);
  const [summaries, setSummaries] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [practiceInterview, setPracticeInterview] = useState(null);
  const [interviewNotes, setInterviewNotes] = useState([]);

  // UI states
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadApplicationData();
  }, [id]);

  async function loadApplicationData() {
    setLoading(true);
    setError(null);
    try {
      const [app, sums, resms, notes] = await Promise.all([
        api.getApplication(id),
        api.getSummaries(id),
        api.getResumes(id),
        api.getInterviewNotes(id),
      ]);

      setApplication(app);
      setSummaries(sums);
      setResumes(resms);
      setInterviewNotes(notes);

      // Try to load practice interview
      try {
        const interview = await api.getPracticeInterview(id);
        setPracticeInterview(interview);
      } catch (err) {
        // Interview might not exist yet
        console.log('No practice interview yet');
      }
    } catch (err) {
      setError('Failed to load application: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus) {
    try {
      await api.updateApplication(id, { status: newStatus });
      setApplication((prev) => ({ ...prev, status: newStatus }));
    } catch (err) {
      setError('Failed to update status: ' + err.message);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this application?')) {
      return;
    }

    try {
      await api.deleteApplication(id);
      navigate('/');
    } catch (err) {
      setError('Failed to delete application: ' + err.message);
    }
  }

  if (loading) {
    return (
      <div className="page-header">
        <h1>Loading...</h1>
        <div className="loading"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-header">
        <h1>Error</h1>
        <div className="error-message">{error}</div>
        <Link to="/" className="btn-outline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="page-header">
        <h1>Application Not Found</h1>
        <Link to="/" className="btn-outline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="application-detail">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div>
            <h1>{application.position_title}</h1>
            <p className="company-name">{application.company}</p>
          </div>
          <div className="header-actions">
            <select
              value={application.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="status-select"
            >
              <option value="researching">Researching</option>
              <option value="applying">Applying</option>
              <option value="applied">Applied</option>
              <option value="interviewing">Interviewing</option>
              <option value="offered">Offered</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
            <button onClick={handleDelete} className="btn-outline btn-danger">
              Delete
            </button>
          </div>
        </div>

        {application.job_url && (
          <a
            href={application.job_url}
            target="_blank"
            rel="noopener noreferrer"
            className="job-link"
          >
            View Job Posting →
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-name">{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'summary' && (
          <SummaryTab
            application={application}
            summaries={summaries}
            onRefresh={loadApplicationData}
          />
        )}

        {activeTab === 'resume' && (
          <ResumeTab
            applicationId={id}
            resumes={resumes}
            onRefresh={loadApplicationData}
            onSave={setLastSaved}
            saving={saving}
            setSaving={setSaving}
          />
        )}

        {activeTab === 'interview' && (
          <InterviewTab
            applicationId={id}
            practiceInterview={practiceInterview}
            onGenerate={async () => {
              setGenerating(true);
              try {
                const interview = await api.generatePracticeInterview(id);
                setPracticeInterview(interview);
              } catch (err) {
                setError('Failed to generate interview: ' + err.message);
              } finally {
                setGenerating(false);
              }
            }}
            generating={generating}
          />
        )}

        {activeTab === 'notes' && (
          <NotesTab
            applicationId={id}
            notes={interviewNotes}
            practiceInterview={practiceInterview}
            onRefresh={loadApplicationData}
          />
        )}
      </div>

      {/* Save indicator */}
      {lastSaved && (
        <div className="save-indicator">
          Last saved: {lastSaved.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

// Summary Tab Component
function SummaryTab({ application, summaries, onRefresh }) {
  const latestSummary = summaries[0];

  return (
    <div className="card">
      <div className="section-header">
        <h2>Experience Summary</h2>
        {summaries.length > 0 && (
          <span className="text-muted">
            Generated {new Date(latestSummary.created_at).toLocaleString()}
          </span>
        )}
      </div>

      {latestSummary ? (
        <div className="summary-content">
          <div className="markdown-preview">
            {latestSummary.summary_content}
          </div>

          {summaries.length > 1 && (
            <details className="previous-summaries">
              <summary>View Previous Versions ({summaries.length - 1})</summary>
              {summaries.slice(1).map((summary) => (
                <div key={summary.id} className="previous-summary">
                  <div className="summary-date">
                    {new Date(summary.created_at).toLocaleString()}
                  </div>
                  <div className="markdown-preview">{summary.summary_content}</div>
                </div>
              ))}
            </details>
          )}
        </div>
      ) : (
        <div className="empty-state">
          <p>No summary generated yet</p>
          <p className="text-muted">
            Return to the New Application wizard to generate a summary
          </p>
        </div>
      )}

      <div className="section mt-4">
        <h3>Job Description</h3>
        <div className="job-description">{application.job_description}</div>
      </div>

      {application.perspective_focus && application.perspective_focus.length > 0 && (
        <div className="section mt-4">
          <h3>Selected Perspectives</h3>
          <div className="perspective-tags">
            {application.perspective_focus.map((tag, index) => (
              <span key={tag} className="perspective-tag">
                {index + 1}. {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Resume Tab Component
function ResumeTab({ applicationId, resumes, onRefresh, onSave, saving, setSaving }) {
  const [content, setContent] = useState('');
  const [selectedResume, setSelectedResume] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (resumes.length > 0) {
      const latest = resumes[0];
      setSelectedResume(latest);
      setContent(latest.content);
    }
  }, [resumes]);

  // Auto-save with debounce
  useEffect(() => {
    if (!content || !selectedResume) return;

    const timeoutId = setTimeout(() => {
      saveResume();
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [content]);

  async function saveResume() {
    if (!content.trim()) return;

    setSaving(true);
    try {
      await api.saveResume(applicationId, content);
      onSave(new Date());
      await onRefresh();
    } catch (error) {
      console.error('Failed to save resume:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleFinalize() {
    if (!selectedResume) return;

    if (!confirm('Finalize this resume? This will convert it to HTML format.')) {
      return;
    }

    try {
      await api.finalizeResume(selectedResume.id);
      await onRefresh();
    } catch (error) {
      console.error('Failed to finalize resume:', error);
    }
  }

  if (resumes.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <p>No resume created yet</p>
          <p className="text-muted">
            Complete the New Application wizard to create your first resume
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="resume-editor">
      <div className="editor-header">
        <div className="editor-controls">
          <label>
            Resume Version:
            <select
              value={selectedResume?.id || ''}
              onChange={(e) => {
                const resume = resumes.find((r) => r.id === parseInt(e.target.value));
                setSelectedResume(resume);
                setContent(resume.content);
              }}
            >
              {resumes.map((resume, index) => (
                <option key={resume.id} value={resume.id}>
                  Version {resumes.length - index} - {resume.is_finalized ? 'Finalized' : 'Draft'}
                </option>
              ))}
            </select>
          </label>

          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="btn-outline"
          >
            {previewMode ? 'Edit' : 'Preview'}
          </button>

          {!selectedResume?.is_finalized && (
            <button onClick={handleFinalize} className="btn-primary">
              Finalize Resume
            </button>
          )}
        </div>

        <div className="save-status">
          {saving && <span className="saving">Saving...</span>}
        </div>
      </div>

      {previewMode ? (
        <div className="card resume-preview">
          <div className="markdown-preview">{content}</div>
        </div>
      ) : (
        <div className="card">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="# Your Name&#10;&#10;## Professional Summary&#10;&#10;## Experience&#10;&#10;..."
            className="resume-textarea"
            disabled={selectedResume?.is_finalized}
          />
          <small className="text-muted mt-2">
            {selectedResume?.is_finalized
              ? 'This resume is finalized and cannot be edited. Create a new version to make changes.'
              : 'Supports Markdown formatting. Auto-saves every 3 seconds.'}
          </small>
        </div>
      )}

      {selectedResume?.is_finalized && selectedResume?.html_content && (
        <div className="section mt-4">
          <h3>HTML Preview</h3>
          <div
            className="card html-preview"
            dangerouslySetInnerHTML={{ __html: selectedResume.html_content }}
          />
        </div>
      )}
    </div>
  );
}

// Practice Interview Tab Component
function InterviewTab({ applicationId, practiceInterview, onGenerate, generating }) {
  if (!practiceInterview) {
    return (
      <div className="card">
        <div className="empty-state">
          <h3>No Practice Interview Generated</h3>
          <p className="text-muted">
            Generate a practice interview with common questions and suggested answers
          </p>
          <button onClick={onGenerate} className="btn-primary" disabled={generating}>
            {generating ? (
              <>
                <span className="loading"></span>
                Generating Interview...
              </>
            ) : (
              'Generate Practice Interview'
            )}
          </button>
        </div>
      </div>
    );
  }

  const interview = JSON.parse(practiceInterview.interview_data);

  return (
    <div className="practice-interview">
      {interview.questions && interview.questions.length > 0 && (
        <div className="card mb-4">
          <h2>Practice Questions</h2>
          <div className="questions-list">
            {interview.questions.map((q, index) => (
              <div key={index} className="question-item">
                <div className="question-header">
                  <span className="question-number">Q{index + 1}</span>
                  <h3>{q.question}</h3>
                </div>
                {q.category && (
                  <span className="question-category">{q.category}</span>
                )}
                {q.suggested_answer && (
                  <div className="suggested-answer">
                    <h4>Suggested Answer:</h4>
                    <p>{q.suggested_answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {interview.gap_analysis && (
        <div className="card mb-4">
          <h2>Gap Analysis</h2>
          <div className="gap-analysis">{interview.gap_analysis}</div>
        </div>
      )}

      {interview.cultural_insights && (
        <div className="card">
          <h2>Cultural Insights</h2>
          <div className="cultural-insights">{interview.cultural_insights}</div>
        </div>
      )}

      <div className="section mt-4">
        <button onClick={onGenerate} className="btn-outline" disabled={generating}>
          {generating ? 'Regenerating...' : 'Regenerate Interview'}
        </button>
      </div>
    </div>
  );
}

// Interview Notes Tab Component
function NotesTab({ applicationId, notes, practiceInterview, onRefresh }) {
  const [noteContent, setNoteContent] = useState('');
  const [interviewers, setInterviewers] = useState('');
  const [followUpItems, setFollowUpItems] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (notes.length > 0 && !selectedNote) {
      const latest = notes[0];
      setSelectedNote(latest);
      setNoteContent(latest.notes || '');
      setInterviewers(latest.interviewer_names?.join(', ') || '');
      setFollowUpItems(latest.follow_up_items || '');
    }
  }, [notes]);

  // Auto-save with debounce
  useEffect(() => {
    if (!noteContent && !interviewers && !followUpItems) return;

    const timeoutId = setTimeout(() => {
      saveNotes();
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [noteContent, interviewers, followUpItems]);

  async function saveNotes() {
    setSaving(true);
    try {
      const data = {
        application_id: applicationId,
        notes: noteContent,
        interviewer_names: interviewers.split(',').map((s) => s.trim()).filter(Boolean),
        follow_up_items: followUpItems,
      };

      if (selectedNote) {
        await api.updateInterviewNote(selectedNote.id, data);
      } else {
        const newNote = await api.createInterviewNote(data);
        setSelectedNote(newNote);
      }
      await onRefresh();
    } catch (error) {
      console.error('Failed to save notes:', error);
    } finally {
      setSaving(false);
    }
  }

  const interview = practiceInterview
    ? JSON.parse(practiceInterview.interview_data)
    : null;

  return (
    <div className="interview-notes">
      <div className="grid grid-2">
        {/* Practice Interview Reference */}
        {interview && (
          <div className="card practice-reference">
            <h3>Practice Questions Reference</h3>
            <div className="questions-reference">
              {interview.questions?.map((q, index) => (
                <details key={index} className="question-ref">
                  <summary>
                    <span className="question-number">Q{index + 1}</span>
                    {q.question}
                  </summary>
                  {q.suggested_answer && (
                    <div className="suggested-answer-small">
                      <strong>Suggested Answer:</strong>
                      <p>{q.suggested_answer}</p>
                    </div>
                  )}
                </details>
              ))}
            </div>
          </div>
        )}

        {/* Notes Editor */}
        <div className="notes-editor">
          <div className="card">
            <div className="section-header">
              <h3>Interview Notes</h3>
              {saving && <span className="saving-indicator">Saving...</span>}
            </div>

            <div className="form-group">
              <label>Interviewer(s)</label>
              <input
                type="text"
                value={interviewers}
                onChange={(e) => setInterviewers(e.target.value)}
                placeholder="John Doe, Jane Smith"
              />
              <small className="text-muted">Comma-separated names</small>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Take notes during or after the interview...&#10;&#10;- Key points discussed&#10;- Impressions&#10;- Questions asked&#10;- Concerns or highlights"
                rows={15}
              />
            </div>

            <div className="form-group">
              <label>Follow-up Items</label>
              <textarea
                value={followUpItems}
                onChange={(e) => setFollowUpItems(e.target.value)}
                placeholder="- Send thank you email&#10;- Provide code sample&#10;- Schedule next interview"
                rows={5}
              />
            </div>

            <small className="text-muted">Auto-saves every 3 seconds</small>
          </div>

          {notes.length > 1 && (
            <div className="card mt-4">
              <h4>Previous Notes</h4>
              <div className="previous-notes">
                {notes.slice(1).map((note) => (
                  <button
                    key={note.id}
                    className="previous-note-item"
                    onClick={() => {
                      setSelectedNote(note);
                      setNoteContent(note.notes || '');
                      setInterviewers(note.interviewer_names?.join(', ') || '');
                      setFollowUpItems(note.follow_up_items || '');
                    }}
                  >
                    {new Date(note.created_at).toLocaleDateString()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ApplicationDetail;
