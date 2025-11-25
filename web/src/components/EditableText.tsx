import React, { useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '../context/AuthContext';
import './EditableText.css';

interface EditableTextProps {
  text: string;
  textKey: string;
  onEdit: (key: string, value: string) => void;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

const EditableText: React.FC<EditableTextProps> = ({ 
  text, 
  textKey, 
  onEdit, 
  className = '',
  as = 'span'
}) => {
  const { userData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text);

  if (!userData?.isAdmin) {
    const Component = as;
    return <Component className={className}>{text}</Component>;
  }

  const handleSave = () => {
    if (editValue.trim()) {
      onEdit(textKey, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(text);
    setIsEditing(false);
  };

  const Component = as;

  if (isEditing) {
    return (
      <div className="editable-text-container">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSave();
            } else if (e.key === 'Escape') {
              handleCancel();
            }
          }}
          className="editable-text-input"
          autoFocus
        />
      </div>
    );
  }

  return (
    <div className={`editable-text-wrapper ${className.includes('section-title') || className.includes('section-subtitle') ? 'editable-text-block' : ''}`}>
      <Component className={className}>{text}</Component>
      <button
        className="btn-edit-text"
        onClick={() => setIsEditing(true)}
        title="Editar texto"
      >
        <EditIcon style={{ fontSize: '16px' }} />
      </button>
    </div>
  );
};

export default EditableText;

