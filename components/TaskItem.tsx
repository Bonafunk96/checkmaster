
import React, { useState, useRef, useEffect } from 'react';
import { Task } from '../types';
import { ICONS } from '../constants';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateText: (id: string, text: string) => void;
  onReorder: (draggedId: string, targetId: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onUpdateText, onReorder }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [task.text]);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Set a transparent drag image to avoid the standard browser ghosting being too opaque
    const ghost = document.createElement('div');
    ghost.style.display = 'none';
    e.dataTransfer.setDragImage(ghost, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const draggedId = e.dataTransfer.getData('taskId');
    if (draggedId && draggedId !== task.id) {
      onReorder(draggedId, task.id);
    }
  };

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group flex items-start py-3 px-6 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-all duration-200 cursor-move ${
        isDraggingOver ? 'bg-blue-50 border-t-2 border-t-blue-400' : ''
      }`}
    >
      <div className="flex items-start space-x-3 flex-1 min-w-0">
        <button 
          onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
          className="flex items-center pt-1 focus:outline-none cursor-pointer"
        >
          <div className={`h-5 w-5 rounded-md border-2 transition-all flex items-center justify-center ${
            task.completed ? 'bg-blue-500 border-blue-500' : 'border-slate-300 bg-white'
          }`}>
            {task.completed && (
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </button>

        <div className="flex-1 min-w-0 cursor-text">
          <textarea
            ref={textareaRef}
            rows={1}
            value={task.text}
            onChange={(e) => onUpdateText(task.id, e.target.value)}
            className={`w-full bg-transparent border-none focus:ring-0 focus:outline-none text-sm transition-all p-0 m-0 resize-none overflow-hidden block font-medium ${
              task.completed ? 'text-slate-400 line-through' : 'text-slate-700'
            }`}
            placeholder="Item text..."
          />
        </div>
      </div>
      
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(task.id);
        }}
        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all ml-2 cursor-pointer"
        title="Delete"
      >
        <ICONS.Trash className="w-4 h-4" />
      </button>
    </div>
  );
};
