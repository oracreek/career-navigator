// ApplicationsList.jsx
export function ApplicationsList() {
  return (
    <div>
      <div className="page-header">
        <h1>Applications</h1>
        <p>All job applications</p>
      </div>
      <div className="card">
        <p>Applications List - To be implemented</p>
      </div>
    </div>
  );
}

// ApplicationDetail.jsx
export function ApplicationDetail() {
  return (
    <div>
      <div className="page-header">
        <h1>Application Detail</h1>
      </div>
      <div className="card">
        <p>Application Detail with tabs - To be implemented</p>
      </div>
    </div>
  );
}

// SearchView.jsx
export function SearchView() {
  return (
    <div>
      <div className="page-header">
        <h1>Search</h1>
        <p>Find applications</p>
      </div>
      <div className="card">
        <p>Search View - To be implemented</p>
      </div>
    </div>
  );
}

// SettingsView.jsx
export function SettingsView() {
  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage prompts and perspectives</p>
      </div>
      <div className="card">
        <p>Settings View - To be implemented</p>
      </div>
    </div>
  );
}

export default {
  ApplicationsList,
  ApplicationDetail,
  SearchView,
  SettingsView,
};
