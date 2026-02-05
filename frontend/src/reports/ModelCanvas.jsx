import React, { useState, useRef } from 'react';
import { Link2, Trash2, Key, Database } from 'lucide-react';

const ModelCanvas = ({ dataModel, onMoveTable, onAddRelationship, onDeleteRelationship }) => {
  const [dragging, setDragging] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [selectedRelationship, setSelectedRelationship] = useState(null);
  const [showCardinalityMenu, setShowCardinalityMenu] = useState(null);
  const canvasRef = useRef(null);

  const handleMouseDown = (e, tableId) => {
    if (e.target.closest('.connect-btn') || e.target.closest('.column-item-interactive')) return;
    
    const table = dataModel.tables.find(t => t.id === tableId);
    if (!table) return;

    setDragging({
      id: tableId,
      startX: e.clientX - table.position.x,
      startY: e.clientY - table.position.y
    });
  };

  const handleMouseMove = (e) => {
    if (dragging) {
      const newX = Math.max(0, e.clientX - dragging.startX);
      const newY = Math.max(0, e.clientY - dragging.startY);
      onMoveTable(dragging.id, newX, newY);
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const startConnection = (tableId, columnName) => {
    setConnecting({ tableId, columnName });
  };

  const completeConnection = (toTableId, toColumnName) => {
    if (connecting && connecting.tableId !== toTableId) {
      setShowCardinalityMenu({
        from: { table: connecting.tableId, column: connecting.columnName },
        to: { table: toTableId, column: toColumnName }
      });
    }
    setConnecting(null);
  };

  const createRelationship = (cardinality) => {
    if (showCardinalityMenu) {
      onAddRelationship(
        showCardinalityMenu.from.table,
        showCardinalityMenu.from.column,
        showCardinalityMenu.to.table,
        showCardinalityMenu.to.column,
        cardinality
      );
    }
    setShowCardinalityMenu(null);
  };

  const getColumnPosition = (tableId, columnName) => {
    const table = dataModel.tables.find(t => t.id === tableId);
    if (!table) return { x: 0, y: 0 };
    
    const columnIndex = table.columns.findIndex(c => c.name === columnName);
    return {
      x: table.position.x + 300,
      y: table.position.y + 50 + (columnIndex * 36)
    };
  };

  const drawRelationships = () => {
    return dataModel.relationships.map(rel => {
      const fromPos = getColumnPosition(rel.from.table, rel.from.column);
      const toPos = getColumnPosition(rel.to.table, rel.to.column);

      const midX = (fromPos.x + toPos.x) / 2;
      const midY = (fromPos.y + toPos.y) / 2;

      const isSelected = selectedRelationship === rel.id;
      const strokeColor = isSelected ? '#F59E0B' : '#3B82F6';
      const strokeWidth = isSelected ? 3 : 2;

      // Determine arrow markers based on cardinality
      let startMarker = '';
      let endMarker = 'url(#arrowhead)';
      
      if (rel.cardinality === 'one-to-one') {
        startMarker = 'url(#one)';
        endMarker = 'url(#one)';
      } else if (rel.cardinality === 'one-to-many') {
        startMarker = 'url(#one)';
        endMarker = 'url(#many)';
      } else if (rel.cardinality === 'many-to-one') {
        startMarker = 'url(#many)';
        endMarker = 'url(#one)';
      } else if (rel.cardinality === 'many-to-many') {
        startMarker = 'url(#many)';
        endMarker = 'url(#many)';
      }

      return (
        <g key={rel.id}>
          <path
            d={`M ${fromPos.x} ${fromPos.y} Q ${midX} ${midY} ${toPos.x} ${toPos.y}`}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            markerStart={startMarker}
            markerEnd={endMarker}
            style={{ cursor: 'pointer' }}
            onClick={() => setSelectedRelationship(isSelected ? null : rel.id)}
          />
          {isSelected && (
            <>
              <circle cx={midX} cy={midY} r="15" fill="white" stroke={strokeColor} strokeWidth="2" />
              <foreignObject x={midX - 12} y={midY - 12} width="24" height="24">
                <button
                  className="delete-relationship-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRelationship(rel.id);
                    setSelectedRelationship(null);
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </foreignObject>
            </>
          )}
        </g>
      );
    });
  };

  return (
    <div
      ref={canvasRef}
      className="model-canvas-interactive"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <svg className="relationship-layer">
        <defs>
          {/* One marker (single line) */}
          <marker
            id="one"
            markerWidth="10"
            markerHeight="10"
            refX="5"
            refY="5"
            orient="auto"
          >
            <line x1="5" y1="0" x2="5" y2="10" stroke="#3B82F6" strokeWidth="2" />
          </marker>
          
          {/* Many marker (crow's foot) */}
          <marker
            id="many"
            markerWidth="15"
            markerHeight="15"
            refX="7"
            refY="7"
            orient="auto"
          >
            <path d="M 0 0 L 7 7 L 0 14" stroke="#3B82F6" strokeWidth="2" fill="none" />
          </marker>
          
          {/* Arrow marker */}
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="5"
            orient="auto"
          >
            <polygon points="0 0, 10 5, 0 10" fill="#3B82F6" />
          </marker>
        </defs>
        {drawRelationships()}
      </svg>

      {dataModel.tables.map((table) => (
        <div
          key={table.id}
          className="model-table-draggable"
          style={{
            position: 'absolute',
            left: table.position.x,
            top: table.position.y
          }}
          onMouseDown={(e) => handleMouseDown(e, table.id)}
        >
          <div className="table-header-powerbi">
            <Database size={16} />
            <h4>{table.name}</h4>
            <span className="column-count">{table.columns.length}</span>
          </div>
          <div className="table-columns-powerbi">
            {table.columns.map((col, colIdx) => (
              <div key={colIdx} className="column-item-interactive">
                <button
                  className="connect-btn"
                  onClick={() => connecting ? completeConnection(table.id, col.name) : startConnection(table.id, col.name)}
                  title={connecting ? 'Click to connect' : 'Create relationship'}
                >
                  <Link2 size={12} />
                </button>
                
                {col.isPrimaryKey && (
                  <Key size={14} className="key-icon" color="#F59E0B" />
                )}
                
                <div className="column-info">
                  <span className="column-name">{col.name}</span>
                </div>
                
                <span className="column-type-badge">{col.type}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {connecting && (
        <div className="connection-hint">
          Creating relationship from <strong>{connecting.columnName}</strong>. Click another column to connect.
        </div>
      )}

      {showCardinalityMenu && (
        <div className="cardinality-menu">
          <h4>Select Relationship Type</h4>
          <button onClick={() => createRelationship('one-to-one')}>
            <span className="cardinality-icon">1 → 1</span>
            One to One
          </button>
          <button onClick={() => createRelationship('one-to-many')}>
            <span className="cardinality-icon">1 → *</span>
            One to Many
          </button>
          <button onClick={() => createRelationship('many-to-one')}>
            <span className="cardinality-icon">* → 1</span>
            Many to One
          </button>
          <button onClick={() => createRelationship('many-to-many')}>
            <span className="cardinality-icon">* → *</span>
            Many to Many
          </button>
          <button className="cancel-btn" onClick={() => setShowCardinalityMenu(null)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default ModelCanvas;
