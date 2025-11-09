// 🎓 LEARNING: Complex State Management
// This component manages the entire grid state and user interactions

import { useState, useCallback, useEffect, useRef } from 'react'
import type { Node } from '../types/grid.types'
import { resetGrid, setWall, clearWalls, clearPath } from '../utils/gridHelpers'
import Cell from './Cell'
import { bfs, dfs, astar, greedyBFS, uniformCostSearch, iterativeDeepening } from '../algorithms/pathfinding'
import type { PathfindingResult } from '../algorithms/pathfinding'

interface GridProps {
  rows: number
  cols: number
  selectedAlgorithm: string
  speed: number
  onVisualizationStart?: () => void
  onVisualizationEnd?: () => void
  visualizeTrigger?: number // Change this value to trigger visualization
}

/**
 * Grid Component - Main visualization area
 * Manages the 2D grid of cells and handles all user interactions
 */
const Grid = ({ rows, cols, selectedAlgorithm, speed, onVisualizationStart, onVisualizationEnd, visualizeTrigger }: GridProps) => {
  // 🎓 LEARNING: Initialize grid state with helper function
  const [grid, setGrid] = useState<Node[][]>(() => resetGrid(rows, cols))
  const [isMousePressed, setIsMousePressed] = useState(false)
  const [isDrawingWall, setIsDrawingWall] = useState(true) // Track if we're adding or removing walls
  
  // Visualization state
  const [isVisualizing, setIsVisualizing] = useState(false)
  const animationTimeouts = useRef<number[]>([])
  
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
  
  /**
   * Clear all pending animation timeouts
   */
  const clearAnimations = useCallback(() => {
    animationTimeouts.current.forEach(timeout => clearTimeout(timeout))
    animationTimeouts.current = []
  }, [])
  
  /**
   * Get the appropriate algorithm function based on selection
   */
  const getAlgorithmFunction = useCallback(() => {
    switch (selectedAlgorithm) {
      case 'bfs': return bfs
      case 'dfs': return dfs
      case 'astar': return astar
      case 'greedy-bfs': return greedyBFS
      case 'uniform-cost': return uniformCostSearch
      case 'iterative-deepening': return iterativeDeepening
      default: return bfs
    }
  }, [selectedAlgorithm])
  
  /**
   * Animate the algorithm visualization
   */
  const animateAlgorithm = useCallback((visitedNodesInOrder: Node[], shortestPath: Node[]) => {
    // Calculate delay based on speed (1 = slowest, 10 = fastest)
    const baseDelay = 500 // milliseconds
    const delay = baseDelay / speed
    
    // Animate visited nodes
    visitedNodesInOrder.forEach((node, index) => {
      const timeout = window.setTimeout(() => {
        if (node.type !== 'start' && node.type !== 'end') {
          setGrid(prevGrid => {
            const newGrid = prevGrid.map(row => row.map(n => ({ ...n })))
            newGrid[node.row][node.col].type = 'visited'
            return newGrid
          })
        }
      }, delay * index)
      animationTimeouts.current.push(timeout)
    })
    
    // Animate shortest path after visited nodes
    const pathDelay = delay * visitedNodesInOrder.length
    shortestPath.forEach((node, index) => {
      const timeout = window.setTimeout(() => {
        if (node.type !== 'start' && node.type !== 'end') {
          setGrid(prevGrid => {
            const newGrid = prevGrid.map(row => row.map(n => ({ ...n })))
            newGrid[node.row][node.col].type = 'path'
            return newGrid
          })
        }
      }, pathDelay + delay * index * 3) // 3x slower for path animation
      animationTimeouts.current.push(timeout)
    })
    
    // Mark visualization as complete
    const finalTimeout = window.setTimeout(() => {
      setIsVisualizing(false)
      onVisualizationEnd?.()
    }, pathDelay + delay * shortestPath.length * 3 + 100)
    animationTimeouts.current.push(finalTimeout)
  }, [speed, onVisualizationEnd])
  
  /**
   * Run the selected pathfinding algorithm
   */
  const visualizeAlgorithm = useCallback(() => {
    if (isVisualizing) return
    
    // Clear previous animations
    clearAnimations()
    
    // Reset visualization state
    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => 
        row.map(node => ({
          ...node,
          isVisited: false,
          distance: Infinity,
          heuristic: Infinity,
          previousNode: null,
          type: node.type === 'visited' || node.type === 'path' ? 'empty' : node.type
        }))
      )
      return newGrid
    })
    
    setIsVisualizing(true)
    onVisualizationStart?.()
    
    // Small delay to let the grid reset render
    setTimeout(() => {
      // Get start and end nodes
      const startNode = grid[startPos.row][startPos.col]
      const endNode = grid[endPos.row][endPos.col]
      
      // Run the algorithm
      const algorithmFunction = getAlgorithmFunction()
      const result: PathfindingResult = algorithmFunction(grid, startNode, endNode)
      
      // Animate the results
      animateAlgorithm(result.visitedNodesInOrder, result.shortestPath)
    }, 50)
  }, [isVisualizing, clearAnimations, grid, startPos, endPos, getAlgorithmFunction, animateAlgorithm, onVisualizationStart])
  
  /**
   * Handle Clear Walls button
   */
  const handleClearWalls = useCallback(() => {
    clearAnimations()
    setGrid(prevGrid => clearWalls(prevGrid))
    setIsVisualizing(false)
  }, [clearAnimations])
  
  /**
   * Handle Clear Path button
   */
  const handleClearPath = useCallback(() => {
    clearAnimations()
    setGrid(prevGrid => clearPath(prevGrid))
    setIsVisualizing(false)
  }, [clearAnimations])
  
  /**
   * Handle Reset Grid button
   */
  const handleReset = useCallback(() => {
    clearAnimations()
    const newGrid = resetGrid(rows, cols)
    setGrid(newGrid)
    
    // Reset start/end positions
    setStartPos({
      row: Math.floor(rows / 2),
      col: Math.floor(cols / 4)
    })
    setEndPos({
      row: Math.floor(rows / 2),
      col: Math.floor((cols * 3) / 4)
    })
    
    setIsVisualizing(false)
  }, [rows, cols, clearAnimations])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAnimations()
    }
  }, [clearAnimations])
  
  // Watch for visualization trigger from parent
  useEffect(() => {
    if (visualizeTrigger && visualizeTrigger > 0) {
      visualizeAlgorithm()
    }
  }, [visualizeTrigger, visualizeAlgorithm])
  
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
        <button 
          onClick={handleClearWalls}
          disabled={isVisualizing}
          className="btn-8bit text-xs px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🧹 Clear Walls
        </button>
        <button 
          onClick={handleClearPath}
          disabled={isVisualizing}
          className="btn-8bit text-xs px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🔄 Clear Path
        </button>
        <button 
          onClick={handleReset}
          disabled={isVisualizing}
          className="btn-8bit btn-primary text-xs px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ♻️ Reset Grid
        </button>
      </div>
    </div>
  )
}

// Export both the component and the type for external control
export type GridHandle = {
  visualize: () => void
  reset: () => void
  clearPath: () => void
  clearWalls: () => void
}

export default Grid
