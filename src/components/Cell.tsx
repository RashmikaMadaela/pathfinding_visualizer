// 🎓 LEARNING: React Memo
// React.memo prevents unnecessary re-renders when props haven't changed
// Important for performance when you have hundreds of cells!

import { memo } from 'react'
import type { CellType } from '../types/grid.types'
import { getCellColor } from '../utils/gridHelpers'

interface CellProps {
  row: number
  col: number
  type: CellType
  onMouseDown: (row: number, col: number) => void
  onMouseEnter: (row: number, col: number) => void
  onMouseUp: () => void
}

/**
 * Cell Component - Represents a single grid cell
 * Handles mouse interactions for drawing walls and moving start/end nodes
 */
const Cell = memo(({ row, col, type, onMouseDown, onMouseEnter, onMouseUp }: CellProps) => {
  // Get the background color based on cell type
  const backgroundColor = getCellColor(type)
  
  // 🎓 LEARNING: Event Handlers
  // These functions are called when user interacts with the cell
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    onMouseDown(row, col)
  }
  
  const handleMouseEnter = (e: React.MouseEvent) => {
    e.preventDefault()
    onMouseEnter(row, col)
  }
  
  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault()
    onMouseUp()
  }
  
  return (
    <div
      className="grid-cell cursor-pointer transition-colors duration-75 hover:opacity-80 aspect-square select-none"
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseUp={handleMouseUp}
      // 🎓 LEARNING: Prevent text selection and default drag behavior while dragging
      onDragStart={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      style={{ 
        backgroundColor,
        userSelect: 'none'
      }}
    >
      {/* Show emoji icons for start and end nodes */}
      {type === 'start' && (
        <div className="flex items-center justify-center h-full text-xs">
          🎮
        </div>
      )}
      {type === 'end' && (
        <div className="flex items-center justify-center h-full text-xs">
          🎯
        </div>
      )}
    </div>
  )
})

// 🎓 LEARNING: Display name for debugging
// Helps identify component in React DevTools
Cell.displayName = 'Cell'

export default Cell
