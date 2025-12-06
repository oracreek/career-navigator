/**
 * API Client
 * Handles all API requests to the backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class APIClient {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Positions
  async getPositions() {
    return this.request('/positions');
  }

  async getPosition(id) {
    return this.request(`/positions/${id}`);
  }

  async createPosition(data) {
    return this.request('/positions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePosition(id, data) {
    return this.request(`/positions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePosition(id) {
    return this.request(`/positions/${id}`, {
      method: 'DELETE',
    });
  }

  // Applications
  async getApplications() {
    return this.request('/applications');
  }

  async getApplication(id) {
    return this.request(`/applications/${id}`);
  }

  async createApplication(data) {
    return this.request('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateApplication(id, data) {
    return this.request(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteApplication(id) {
    return this.request(`/applications/${id}`, {
      method: 'DELETE',
    });
  }

  // Summaries
  async generateSummary(applicationId) {
    return this.request('/summaries/generate', {
      method: 'POST',
      body: JSON.stringify({ application_id: applicationId }),
    });
  }

  async getSummaries(applicationId) {
    return this.request(`/summaries/application/${applicationId}`);
  }

  // Resumes
  async getResumes(applicationId) {
    return this.request(`/resumes/application/${applicationId}`);
  }

  async getResume(id) {
    return this.request(`/resumes/${id}`);
  }

  async saveResume(applicationId, content) {
    return this.request('/resumes', {
      method: 'POST',
      body: JSON.stringify({ application_id: applicationId, content }),
    });
  }

  async finalizeResume(id) {
    return this.request(`/resumes/${id}/finalize`, {
      method: 'POST',
    });
  }

  // Interviews
  async generatePracticeInterview(applicationId) {
    return this.request('/interviews/generate', {
      method: 'POST',
      body: JSON.stringify({ application_id: applicationId }),
    });
  }

  async getPracticeInterview(applicationId) {
    return this.request(`/interviews/practice/${applicationId}`);
  }

  async createInterviewNote(data) {
    return this.request('/interviews/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInterviewNote(id, data) {
    return this.request(`/interviews/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getInterviewNotes(applicationId) {
    return this.request(`/interviews/notes/application/${applicationId}`);
  }

  // Prompts
  async getPrompts() {
    return this.request('/prompts');
  }

  async getPrompt(id) {
    return this.request(`/prompts/${id}`);
  }

  async createPrompt(data) {
    return this.request('/prompts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePrompt(id, data) {
    return this.request(`/prompts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePrompt(id) {
    return this.request(`/prompts/${id}`, {
      method: 'DELETE',
    });
  }

  async testPrompt(id, testVariables) {
    return this.request(`/prompts/${id}/test`, {
      method: 'POST',
      body: JSON.stringify({ test_variables: testVariables }),
    });
  }

  // Search
  async searchApplications(params) {
    const queryParams = new URLSearchParams(params).toString();
    return this.request(`/search?${queryParams}`);
  }

  // Perspectives
  async getPerspectives() {
    return this.request('/perspectives');
  }

  async createPerspective(data) {
    return this.request('/perspectives', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePerspective(id, data) {
    return this.request(`/perspectives/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePerspective(id) {
    return this.request(`/perspectives/${id}`, {
      method: 'DELETE',
    });
  }
}

export default new APIClient();
