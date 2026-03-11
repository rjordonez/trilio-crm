import React, { useState } from 'react';
import './SectionDetail.css';

function SectionDetail({ section, formData, onBack }) {
  const [items, setItems] = useState(section.items || []);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState('');
  const [highlightedItems, setHighlightedItems] = useState(new Set());
  const [newItemText, setNewItemText] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditText(items[index]);
  };

  const handleSaveEdit = (index) => {
    if (editText.trim()) {
      const newItems = [...items];
      newItems[index] = editText.trim();
      setItems(newItems);
    }
    setEditingIndex(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditText('');
  };

  const handleDelete = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);

    // Update highlighted items set
    const newHighlighted = new Set();
    highlightedItems.forEach(i => {
      if (i < index) newHighlighted.add(i);
      else if (i > index) newHighlighted.add(i - 1);
    });
    setHighlightedItems(newHighlighted);
  };

  const handleToggleHighlight = (index) => {
    const newHighlighted = new Set(highlightedItems);
    if (newHighlighted.has(index)) {
      newHighlighted.delete(index);
    } else {
      newHighlighted.add(index);
    }
    setHighlightedItems(newHighlighted);
  };

  const handleAddItem = () => {
    if (newItemText.trim()) {
      setItems([...items, newItemText.trim()]);
      setNewItemText('');
      setShowAddInput(false);
    }
  };

  const handleCancelAdd = () => {
    setNewItemText('');
    setShowAddInput(false);
  };

  return (
    <div className="section-detail">
      <div className="detail-container">
        <button className="back-button" onClick={onBack}>← Back</button>

        <h1>{section.title}</h1>
        <p className="detail-subtitle">
          {formData.firstName} {formData.lastName} • {formData.situation}
        </p>

        <div className="items-container">
          {items.map((item, index) => (
            <div
              key={index}
              className={`detail-item ${highlightedItems.has(index) ? 'highlighted' : ''}`}
            >
              {editingIndex === index ? (
                <div className="edit-mode">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="edit-textarea"
                    autoFocus
                    rows={3}
                  />
                  <div className="edit-actions">
                    <button
                      className="save-edit-btn"
                      onClick={() => handleSaveEdit(index)}
                    >
                      Save
                    </button>
                    <button
                      className="cancel-edit-btn"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="item-text" onClick={() => handleEdit(index)}>
                    {item}
                  </div>
                  <div className="item-actions">
                    <button
                      className={`highlight-btn ${highlightedItems.has(index) ? 'active' : ''}`}
                      onClick={() => handleToggleHighlight(index)}
                      title="Highlight"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                      </svg>
                    </button>
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(index)}
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                      </svg>
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(index)}
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {showAddInput ? (
            <div className="add-item-form">
              <textarea
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Enter new item..."
                className="add-textarea"
                autoFocus
                rows={3}
              />
              <div className="add-actions">
                <button
                  className="save-add-btn"
                  onClick={handleAddItem}
                >
                  Add
                </button>
                <button
                  className="cancel-add-btn"
                  onClick={handleCancelAdd}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className="add-item-btn"
              onClick={() => setShowAddInput(true)}
            >
              + Add New Item
            </button>
          )}
        </div>

        <div className="detail-footer">
          <button className="done-btn" onClick={onBack}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default SectionDetail;
