import React from 'react';
import { Layers, Eye, Search } from 'lucide-react';
import { useModelInteractions } from '../../hooks/useModelInteractions';

export default function ControlsPanel() {
  const { showSkin, showOrgans, showSkeleton, toggleSkin, toggleOrgans, toggleSkeleton, setSelectedOrgan, searchQuery, setSearchQuery } = useModelInteractions();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Capitalize first letter to match common node names
      const formattedQuery = searchQuery.trim().charAt(0).toUpperCase() + searchQuery.trim().slice(1).toLowerCase();
      setSelectedOrgan(formattedQuery);
    }
  };

  return (
    <div className="controls-panel">
      <div className="controls-header">
        <Layers size={20} className="icon-blue" />
        <h2>View Controls</h2>
      </div>

      <form className="search-box" onSubmit={handleSearch}>
        <Search size={16} className="search-icon" />
        <input 
          type="text" 
          placeholder="Search body part... (e.g. Heart)" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </form>

      <div className="toggle-group">
        <button type="button" className={`toggle-btn ${showSkin ? 'active' : ''}`} onClick={toggleSkin}>
          <Eye size={16} /> <span>Skin & Muscle</span>
        </button>
        <button type="button" className={`toggle-btn ${showOrgans ? 'active' : ''}`} onClick={toggleOrgans}>
          <Eye size={16} /> <span>Internal Organs</span>
        </button>
        <button type="button" className={`toggle-btn ${showSkeleton ? 'active' : ''}`} onClick={toggleSkeleton}>
          <Eye size={16} /> <span>Skeleton</span>
        </button>
      </div>

      <div className="controls-footer">
        <p className="hint-text">Rotate: Left Click + Drag</p>
        <p className="hint-text">Zoom: Scroll</p>
        <p className="hint-text">Hover: See Part Name</p>
      </div>
    </div>
  );
}
