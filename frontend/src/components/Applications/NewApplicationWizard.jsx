import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './NewApplicationWizard.css';

const STEPS = [
  { id: 1, name: 'Job Details', description: 'Enter job information' },
  { id: 2, name: 'Perspective', description: 'Select focus areas' },
  { id: 3, name: 'Summary', description: 'Generate experience summary' },
  { id: 4, name: 'Resume', description: 'Build your resume' },
];

function NewApplicationWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [perspectives, setPerspectives] = useState([]);
  const [applicationId, setApplicationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    company: '',
    position_title: '',
    job_description: '',
    job_url: '',
    perspective_focus: [],
  });

  const [generatedSummary, setGeneratedSummary] = useState('');
  const [resumeContent, setResumeContent] = useState('');

  useEffect(() => {
    loadPerspectives();
  }, []);

  async function loadPerspectives() {
    try {
      const data = await api.getPerspectives();
      setPerspectives(data);
    } catch (err) {
      setError('Failed to load perspectives');
    }
  }

  function updateFormData(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  function togglePerspective(tag) {
    setFormData((prev) => {
      const current = prev.perspective_focus;
      if (current.includes(tag)) {
        return {
          ...prev,
          perspective_focus: current.filter((t) => t !== tag),
        };
      } else {
        return {
          ...prev,
          perspective_focus: [...current, tag],
        };
      }
    });
  }

  async function handleStep1Next() {
    if (!formData.company || !formData.position_title || !formData.job_description) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const application = await api.createApplication({
        ...formData,
        perspective_focus: formData.perspective_focus,
        status: 'researching',
      });
      setApplicationId(application.id);
      setCurrentStep(2);
    } catch (err) {
      setError('Failed to create application: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2Next() {
    if (formData.perspective_focus.length === 0) {
      setError('Please select at least one perspective');
      return;
    }

    setLoading(true);
    try {
      // Update application with selected perspectives
      await api.updateApplication(applicationId, {
        ...formData,
      });
      setCurrentStep(3);
    } catch (err) {
      setError('Failed to update application: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateSummary() {
    setLoading(true);
    setError(null);
    try {
      const result = await api.generateSummary(applicationId);
      setGeneratedSummary(result.summary);
      setResumeContent(result.summary); // Use summary as resume starting point
    } catch (err) {
      setError('Failed to generate summary: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveResume() {
    setLoading(true);
    try {
      await api.saveResume(applicationId, resumeContent);
      setCurrentStep(4);
    } catch (err) {
      setError('Failed to save resume: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFinalize() {
    setLoading(true);
    try {
      const resumes = await api.getResumes(applicationId);
      const latestResume = resumes[0];
      
      if (latestResume) {
        await api.finalizeResume(latestResume.id);
        // Generate practice interview in background
        api.generatePracticeInterview(applicationId).catch(console.error);
        
        navigate(`/applications/${applicationId}`);
      }
    } catch (err) {
      setError('Failed to finalize resume: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wizard">
      <div className="page-header">
        <h1>New Application</h1>
        <p>Create a targeted application with AI assistance</p>
      </div>

      {/* Progress Steps */}
      <div className="wizard-steps">
        {STEPS.map((step) => (
          <div
            key={step.id}
            className={`wizard-step ${currentStep === step.id ? 'active' : ''} ${
              currentStep > step.id ? 'completed' : ''
            }`}
          >
            <div className="step-number">{step.id}</div>
            <div className="step-info">
              <div className="step-name">{step.name}</div>
              <div className="step-description">{step.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Step Content */}
      <div className="wizard-content">
        {currentStep === 1 && (
          <div className="card">
            <h2>Job Details</h2>
            <div className="form-group">
              <label>Company *</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => updateFormData('company', e.target.value)}
                placeholder="e.g., Dropbox"
              />
            </div>

            <div className="form-group">
              <label>Position Title *</label>
              <input
                type="text"
                value={formData.position_title}
                onChange={(e) => updateFormData('position_title', e.target.value)}
                placeholder="e.g., Senior Technical Program Manager"
              />
            </div>

            <div className="form-group">
              <label>Job Description *</label>
              <textarea
                rows={10}
                value={formData.job_description}
                onChange={(e) => updateFormData('job_description', e.target.value)}
                placeholder="Paste the full job description here..."
              />
              <small className="text-muted">
                Paste the complete job description for best AI analysis
              </small>
            </div>

            <div className="form-group">
              <label>Job URL (Optional)</label>
              <input
                type="url"
                value={formData.job_url}
                onChange={(e) => updateFormData('job_url', e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="wizard-actions">
              <button onClick={handleStep1Next} className="btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="card">
            <h2>Select Perspectives</h2>
            <p className="text-muted mb-3">
              Choose how you want to frame your experience for this role. You can select multiple
              perspectives, and they'll be ranked in the order you select them.
            </p>

            <div className="perspectives-grid">
              {perspectives.map((perspective) => (
                <div
                  key={perspective.id}
                  className={`perspective-card ${
                    formData.perspective_focus.includes(perspective.tag) ? 'selected' : ''
                  }`}
                  onClick={() => togglePerspective(perspective.tag)}
                >
                  <div className="perspective-header">
                    <input
                      type="checkbox"
                      checked={formData.perspective_focus.includes(perspective.tag)}
                      onChange={() => {}}
                    />
                    <h3>{perspective.display_name}</h3>
                  </div>
                  {perspective.description && (
                    <p className="perspective-description">{perspective.description}</p>
                  )}
                  {formData.perspective_focus.includes(perspective.tag) && (
                    <div className="perspective-rank">
                      Rank: {formData.perspective_focus.indexOf(perspective.tag) + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="wizard-actions">
              <button onClick={() => setCurrentStep(1)} className="btn-outline">
                Back
              </button>
              <button onClick={handleStep2Next} className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="card">
            <h2>Generate Experience Summary</h2>
            {!generatedSummary ? (
              <>
                <p className="text-muted mb-3">
                  Click the button below to generate a targeted summary of your experience based on
                  the job description and your selected perspectives.
                </p>
                <button
                  onClick={handleGenerateSummary}
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading"></span>
                      Generating Summary...
                    </>
                  ) : (
                    'Generate Summary'
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="generated-content">
                  <h3>Generated Summary</h3>
                  <div className="markdown-preview">{generatedSummary}</div>
                </div>

                <div className="wizard-actions">
                  <button onClick={() => setCurrentStep(2)} className="btn-outline">
                    Back
                  </button>
                  <button onClick={() => setCurrentStep(4)} className="btn-primary">
                    Continue to Resume
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {currentStep === 4 && (
          <div className="card">
            <h2>Build Your Resume</h2>
            <p className="text-muted mb-3">
              Edit the resume content below. It will auto-save as you type. Use Markdown formatting.
            </p>

            <div className="form-group">
              <textarea
                rows={20}
                value={resumeContent}
                onChange={(e) => setResumeContent(e.target.value)}
                placeholder="# Your Name\n\n## Experience\n\n..."
                className="resume-textarea"
              />
              <small className="text-muted">
                Supports Markdown formatting: **bold**, *italic*, ## headings, - lists
              </small>
            </div>

            <div className="wizard-actions">
              <button onClick={() => setCurrentStep(3)} className="btn-outline">
                Back
              </button>
              <button onClick={handleSaveResume} className="btn-secondary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Draft'}
              </button>
              <button onClick={handleFinalize} className="btn-primary" disabled={loading}>
                {loading ? 'Finalizing...' : 'Finalize & Generate Interview'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NewApplicationWizard;
