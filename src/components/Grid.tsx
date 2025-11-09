// 🎓 LEARNING: Complex State Management
// This component manages the entire grid state and user interactions

import { useState, useCallback, useEffect } from 'react'
import type { Node } from '../types/grid.types'
import { resetGrid, setWall } from '../utils/gridHelpers'
import Cell from './Cell'

interface GridProps {
  rows: number
  cols: number
}

/**
 * Grid Component - Main visualization area
 * Manages the 2D grid of cells and handles all user interactions
 */
const Grid = ({ rows, cols }: GridProps) => {
  // 🎓 LEARNING: Initialize grid state with helper function
  const [grid, setGrid] = useState<Node[][]>(() => resetGrid(rows, cols))
  const [isMousePressed, setIsMousePressed] = useState(false)
  const [isDrawingWall, setIsDrawingWall] = useState(true) // Track if we're adding or removing walls
  
  // Track start and end positions
  const [startPos, setStartPos] = useState({
    row: Math.floor(rows / 2),
    col: Math.floor(cols / 4)
  })
  const [endPos, setEndPos] = useState({
    row: Math.floor(rows / 2),
    col: Math.floor((cols * 3) / 4)
  })
  
  // Track if we're moving start/end nodes
  const [isMovingStart, setIsMovingStart] = useState(false)
  const [isMovingEnd, setIsMovingEnd] = useState(false)
  
  // 🎓 LEARNING: useEffect Hook
  // Reset the grid when rows or cols change
  useEffect(() => {
    const newGrid = resetGrid(rows, cols)
    setGrid(newGrid)
    
    // Recalculate start and end positions
    setStartPos({
      row: Math.floor(rows / 2),
      col: Math.floor(cols / 4)
    })
    setEndPos({
      row: Math.floor(rows / 2),
      col: Math.floor((cols * 3) / 4)
    })
  }, [rows, cols]) // Runs whenever rows or cols change
  
  // 🎓 LEARNING: useCallback Hook
  // Memoizes functions to prevent unnecessary re-renders
  // The function only recreates if dependencies change
  
  /**
   * Handles mouse down on a cell
   * Starts wall drawing or initiates moving start/end node
   */
  const handleMouseDown = useCallback((row: number, col: number) => {
    const node = grid[row][col]
    
    if (node.type === 'start') {
      // Start moving the start node
      setIsMovingStart(true)
      setIsMousePressed(false)
    } else if (node.type === 'end') {
      // Start moving the end node
      setIsMovingEnd(true)
      setIsMousePressed(false)
    } else {
      // Start drawing walls
      // Determine if we're adding or removing walls based on current cell state
      const isWall = node.type !== 'wall'
      setIsDrawingWall(isWall)
      setIsMousePressed(true)
      setIsMovingStart(false)
      setIsMovingEnd(false)
      setGrid(prevGrid => setWall(prevGrid, row, col, isWall))
    }
  }, [grid])
  
  /**
   * Handles mouse enter on a cell (while dragging)
   * Continues wall drawing or moves start/end node
   */
  const handleMouseEnter = useCallback((row: number, col: number) => {
    if (isMovingStart) {
      // Move start node to this position
      setGrid(prevGrid => {
        const newGrid = prevGrid.map(r => r.map(node => ({ ...node })))
        
        // Clear old start
        newGrid[startPos.row][startPos.col].type = 'empty'
        
        // Set new start (unless it's the end node)
        if (newGrid[row][col].type !== 'end') {
          newGrid[row][col].type = 'start'
          setStartPos({ row, col })
        }
        
        return newGrid
      })
    } else if (isMovingEnd) {
      // Move end node to this position
      setGrid(prevGrid => {
        const newGrid = prevGrid.map(r => r.map(node => ({ ...node })))
        
        // Clear old end
        newGrid[endPos.row][endPos.col].type = 'empty'
        
        // Set new end (unless it's the start node)
        if (newGrid[row][col].type !== 'start') {
          newGrid[row][col].type = 'end'
          setEndPos({ row, col })
        }
        
        return newGrid
      })
    } else if (isMousePressed) {
      // Continue drawing walls with the same mode (add or remove)
      setGrid(prevGrid => setWall(prevGrid, row, col, isDrawingWall))
    }
  }, [isMousePressed, isMovingStart, isMovingEnd, startPos, endPos, isDrawingWall])
  
  /**
   * Handles mouse up - stops all interactions
   */
  const handleMouseUp = useCallback(() => {
    setIsMousePressed(false)
    setIsMovingStart(false)
    setIsMovingEnd(false)
  }, [])
  
  // 🎓 LEARNING: Responsive Cell Size Calculation
  // Calculate cell size based on screen size and grid dimensions
  // This ensures the grid fits nicely on all devices
  const calculateCellSize = () => {
    if (typeof window === 'undefined') return 20 // Server-side rendering fallback
    
    const screenWidth = window.innerWidth
    
    // Responsive breakpoints with more aggressive sizing for mobile
    let maxWidth: number
    if (screenWidth < 640) {
      // Mobile: use most of the width minus padding (account for 2x px-3 = 24px total)
      maxWidth = screenWidth - 60 // Leave room for padding and panel borders
    } else if (screenWidth < 1024) {
      // Tablet: use 85% of width
      maxWidth = screenWidth * 0.85
    } else {
      // Desktop: cap at reasonable size
      maxWidth = Math.min(screenWidth * 0.5, 600)
    }
    
    // Calculate cell size based on grid dimensions
    const calculatedSize = Math.floor(maxWidth / cols) // Use cols instead of max(rows, cols)
    
    // Set min and max cell sizes - smaller min for mobile
    const minSize = screenWidth < 640 ? 5 : 8
    const maxSize = screenWidth < 640 ? 20 : 35
    
    return Math.max(Math.min(calculatedSize, maxSize), minSize)
  }
  
  const cellSize = calculateCellSize()
  
  return (
    <div className="flex flex-col items-center w-full">
      {/* Grid Container */}
      <div
        className="border-4 overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
          gap: '1px',
          backgroundColor: 'var(--color-border)',
          borderColor: 'var(--color-border)',
          maxWidth: '100%',
        }}
        // 🎓 LEARNING: Prevent text selection while dragging
        onMouseLeave={handleMouseUp}
      >
        {/* 🎓 LEARNING: Render cells using map
            We flatten the 2D grid into a 1D array for rendering */}
        {grid.map((row, rowIndex) =>
          row.map((node, colIndex) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              row={rowIndex}
              col={colIndex}
              type={node.type}
              onMouseDown={handleMouseDown}
              onMouseEnter={handleMouseEnter}
              onMouseUp={handleMouseUp}
            />
          ))
        )}
      </div>
      
      {/* Grid Control Buttons */}
      <div className="mt-4 flex gap-2 md:gap-3 flex-wrap justify-center w-full">
        <button className="btn-8bit text-xs px-3 py-2">
          🧹 Clear Walls
        </button>
        <button className="btn-8bit text-xs px-3 py-2">
          🔄 Clear Path
        </button>
        <button className="btn-8bit btn-primary text-xs px-3 py-2">
          ♻️ Reset Grid
        </button>
      </div>
    </div>
  )
}

export default Grid
