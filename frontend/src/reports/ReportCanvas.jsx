import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Move, Copy, Maximize2 } from 'lucide-react';
import VisualRenderer from './VisualRenderer';

const ReportCanvas = ({ visuals, selectedVisualId, dataset, onSelectVisual, onMoveVisual, onResizeVisual, onDeleteVisual }) => {
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const canvasRef = useRef(null);

  const snapToGrid = (value, gridSize = 10) => {
    return Math.round(value / gridSize) * gridSize;
  };

  const handleMouseDown = (e, visualId, action) => {
    e.stopPropagation();
    onSelectVisual(visualId);
    
    const visual = visuals.find(v => v.id === visualId);
    if (!visual) return;

    if (action === 'move') {
      setDragging({
        id: visualId,
        startX: e.clientX - visual.position.x,
        startY: e.clientY - visual.position.y
      });
    } else if (action === 'resize') {
      setResizing({
        id: visualId,
        startX: e.clientX,
        startY: e.clientY,
        startW: visual.position.w,
        startH: visual.position.h
      });
    }
  };

  const handleMouseMove = (e) => {
    if (dragging) {
      const newX = snapToGrid(Math.max(0, e.clientX - dragging.startX));
      const newY = snapToGrid(Math.max(0, e.clientY - dragging.startY));
      onMoveVisual(dragging.id, newX, newY);
    } else if (resizing) {
      const deltaX = e.clientX - resizing.startX;
      const deltaY = e.clientY - resizing.startY;
      const newW = snapToGrid(Math.max(250, resizing.startW + deltaX));
      const newH = snapToGrid(Math.max(200, resizing.startH + deltaY));
      onResizeVisual(resizing.id, newW, newH);
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setResizing(null);
  };

  const handleContextMenu = (e, visualId) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      visualId
    });
  };

  const handleDuplicate = (visualId) => {
    const visual = visuals.find(v => v.id === visualId);
    if (visual) {
      // This would need to be implemented in the parent component
      console.log('Duplicate visual:', visualId);
    }
    setContextMenu(null);
  };

  useEffect(() => {
    if (dragging || resizing) {
      document.body.style.cursor = dragging ? 'move' : 'nwse-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }, [dragging, resizing]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  return (
    <div
      ref={canvasRef}
      className="report-canvas"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={() => onSelectVisual(null)}
      style={{ position: 'relative', minHeight: '800px', background: '#F9FAFB' }}
    >
      {visuals.length === 0 && (
        <div className="canvas-empty">
          <p>Click a visualization from the gallery to add it to the canvas</p>
        </div>
      )}

      {visuals.map(visual => (
        <div
          key={visual.id}
          className={`visual-container ${selectedVisualId === visual.id ? 'selected' : ''}`}
          style={{
            position: 'absolute',
            left: visual.position.x,
            top: visual.position.y,
            width: visual.position.w,
            height: visual.position.h
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelectVisual(visual.id);
          }}
        >
          <div
            className="visual-header"
            onMouseDown={(e) => handleMouseDown(e, visual.id, 'move')}
            onContextMenu={(e) => handleContextMenu(e, visual.id)}
          >
            <Move size={14} color="#9CA3AF" />
            <span>{visual.styleConfig.title}</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                className="icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDuplicate(visual.id);
                }}
                title="Duplicate"
              >
                <Copy size={14} />
              </button>
              <button
                className="icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onResizeVisual(visual.id, 600, 400);
                }}
                title="Maximize"
              >
                <Maximize2 size={14} />
              </button>
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteVisual(visual.id);
                }}
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="visual-content">
            <VisualRenderer visual={visual} dataset={dataset} />
          </div>

          {selectedVisualId === visual.id && (
            <div
              className="resize-handle"
              onMouseDown={(e) => handleMouseDown(e, visual.id, 'resize')}
            />
          )}
        </div>
      ))}

      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '150px'
          }}
        >
          <button
            onClick={() => handleDuplicate(contextMenu.visualId)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Copy size={14} />
            Duplicate
          </button>
          <button
            onClick={() => {
              onDeleteVisual(contextMenu.visualId);
              setContextMenu(null);
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#EF4444'
            }}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportCanvas;
