import { useState, useCallback, useEffect, useRef } from 'react'
import type { Node } from '../types/grid.types'
import { resetGrid, setWall, clearWalls } from '../utils/gridHelpers'
import Cell from './Cell'
import { bfs, dfs, astar, greedyBFS } from '../algorithms/pathfinding'
import type { PathfindingResult } from '../algorithms/pathfinding'

interface GridProps {
  rows: number
  cols: number
  selectedAlgorithm: string
  speed: number
  onVisualizationStart?: () => void
  onVisualizationEnd?: () => void
  visualizeTrigger?: number // Change this value to trigger visualization
  pauseTrigger?: number // Trigger pause
  stopTrigger?: number // Trigger stop
  onPauseStateChange?: (isPaused: boolean, canPause: boolean) => void
}

/**
 * Grid Component - Main visualization area
 * Manages the 2D grid of cells and handles all user interactions
 */
const Grid = ({ rows, cols, selectedAlgorithm, speed, onVisualizationStart, onVisualizationEnd, visualizeTrigger, pauseTrigger, stopTrigger, onPauseStateChange }: GridProps) => {
  // Grid state
  const [grid, setGrid] = useState<Node[][]>(() => resetGrid(rows, cols))
  const [isMousePressed, setIsMousePressed] = useState(false)
  const [isDrawingWall, setIsDrawingWall] = useState(true) // Track if we're adding or removing walls
  
  // Visualization state
  const [isVisualizing, setIsVisualizing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [canPause, setCanPause] = useState(false)
  const [animationCompleted, setAnimationCompleted] = useState(false)
  const animationTimeouts = useRef<number[]>([])
  const currentAnimationIndex = useRef<number>(0)
  const animationData = useRef<{
    visitedNodes: Node[]
    shortestPath: Node[]
  } | null>(null)
  
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
    currentAnimationIndex.current = 0
    animationData.current = null
  }, [])
  
  /**
   * Stop the current visualization completely
   */
  const stopVisualization = useCallback(() => {
    // Clear all timeouts first
    clearAnimations()
    
    // Reset visualization state
    setIsVisualizing(false)
    setIsPaused(false)
    setCanPause(false)
    
    // Keep the current visualization on screen (don't clear the grid)
    // This way users can see the final state when they stop
    setAnimationCompleted(true)
  }, [clearAnimations])
  
  /**
   * Pause the current visualization
   */
  const pauseVisualization = useCallback(() => {
    if (!canPause || !isVisualizing) return
    setIsPaused(true)
    clearAnimations()
  }, [canPause, isVisualizing, clearAnimations])
  
  /**
   * Resume the paused visualization
   */
  const resumeVisualization = useCallback(() => {
    if (!isPaused || !animationData.current) return
    
    setIsPaused(false)
    setCanPause(true)
    
    const { visitedNodes, shortestPath } = animationData.current
    const startIndex = currentAnimationIndex.current
    
    // Calculate delay based on speed
    const baseDelay = 500
    const delay = baseDelay / speed
    
    // Resume visited nodes animation from where we left off
    for (let i = startIndex; i < visitedNodes.length; i++) {
      const node = visitedNodes[i]
      const timeout = window.setTimeout(() => {
        currentAnimationIndex.current = i + 1
        
        // Get the actual node from the current grid
        setGrid(prevGrid => {
          const newGrid = prevGrid.map(row => row.map(n => ({ ...n })))
          const currentNode = newGrid[node.row][node.col]
          
          // Mark current node as visited if it's not start/end
          if (currentNode.type !== 'start' && currentNode.type !== 'end') {
            currentNode.type = 'visited'
          }
          
          // Clear previous frontiers
          for (const row of newGrid) {
            for (const n of row) {
              if (n.type === 'frontier') {
                n.type = 'empty'
              }
            }
          }
          
          // Show frontier nodes
          const frontierCount = Math.min(8, visitedNodes.length - i - 1)
          for (let j = 1; j <= frontierCount; j++) {
            const nextNode = visitedNodes[i + j]
            if (nextNode) {
              const frontierNode = newGrid[nextNode.row][nextNode.col]
              if (frontierNode.type !== 'start' && frontierNode.type !== 'end' && frontierNode.type !== 'visited') {
                frontierNode.type = 'frontier'
              }
            }
          }
          
          return newGrid
        })
      }, delay * (i - startIndex))
      animationTimeouts.current.push(timeout)
    }
    
    // Clear frontiers before path animation
    const clearFrontiersDelay = delay * (visitedNodes.length - startIndex)
    const clearFrontiersTimeout = window.setTimeout(() => {
      setGrid(prevGrid => {
        const newGrid = prevGrid.map(row => row.map(n => ({ ...n })))
        for (const row of newGrid) {
          for (const node of row) {
            if (node.type === 'frontier') {
              node.type = 'empty'
            }
          }
        }
        return newGrid
      })
    }, clearFrontiersDelay)
    animationTimeouts.current.push(clearFrontiersTimeout)
    
    // Animate shortest path
    const pathDelay = clearFrontiersDelay + 50
    shortestPath.forEach((node, index) => {
      const timeout = window.setTimeout(() => {
        setGrid(prevGrid => {
          const newGrid = prevGrid.map(row => row.map(n => ({ ...n })))
          const pathNode = newGrid[node.row][node.col]
          if (pathNode.type !== 'start' && pathNode.type !== 'end') {
            pathNode.type = 'path'
          }
          return newGrid
        })
      }, pathDelay + delay * index * 3)
      animationTimeouts.current.push(timeout)
    })
    
    // Complete animation
    const finalTimeout = window.setTimeout(() => {
      setIsVisualizing(false)
      setIsPaused(false)
      setCanPause(false)
      animationData.current = null
      setAnimationCompleted(true)
      currentAnimationIndex.current = 0
      onVisualizationEnd?.()
    }, pathDelay + delay * shortestPath.length * 3 + 100)
    animationTimeouts.current.push(finalTimeout)
  }, [isPaused, speed, onVisualizationEnd])
  
  /**
   * Get the appropriate algorithm function based on selection
   */
  const getAlgorithmFunction = useCallback(() => {
    switch (selectedAlgorithm) {
      case 'bfs': return bfs
      case 'dfs': return dfs
      case 'astar': return astar
      case 'greedy-bfs': return greedyBFS
      default: return bfs
    }
  }, [selectedAlgorithm])
  
  /**
   * Animate the algorithm visualization with frontier display
   */
  const animateAlgorithm = useCallback((visitedNodesInOrder: Node[], shortestPath: Node[]) => {
    // Store animation data for pause/resume
    animationData.current = {
      visitedNodes: visitedNodesInOrder,
      shortestPath: shortestPath
    }
    
    // Calculate delay based on speed (1 = slowest, 10 = fastest)
    const baseDelay = 500 // milliseconds
    const delay = baseDelay / speed
    
    setCanPause(true)
    
    // Animate visited nodes with frontier preview
    visitedNodesInOrder.forEach((node, index) => {
      const timeout = window.setTimeout(() => {
        currentAnimationIndex.current = index
        
        // Mark current node as visited
        if (node.type !== 'start' && node.type !== 'end') {
          setGrid(prevGrid => {
            const newGrid = prevGrid.map(row => row.map(n => ({ ...n })))
            newGrid[node.row][node.col].type = 'visited'
            
            // Show frontier nodes (next nodes to be explored)
            // Clear previous frontiers
            for (const row of newGrid) {
              for (const n of row) {
                if (n.type === 'frontier') {
                  n.type = 'empty'
                }
              }
            }
            
            // Mark upcoming nodes as frontier (next 5-10 nodes)
            const frontierCount = Math.min(8, visitedNodesInOrder.length - index - 1)
            for (let i = 1; i <= frontierCount; i++) {
              const nextNode = visitedNodesInOrder[index + i]
              if (nextNode && nextNode.type !== 'start' && nextNode.type !== 'end' && nextNode.type !== 'visited') {
                newGrid[nextNode.row][nextNode.col].type = 'frontier'
              }
            }
            
            return newGrid
          })
        }
      }, delay * index)
      animationTimeouts.current.push(timeout)
    })
    
    // Clear frontiers before animating path
    const clearFrontiersTimeout = window.setTimeout(() => {
      setGrid(prevGrid => {
        const newGrid = prevGrid.map(row => row.map(n => ({ ...n })))
        for (const row of newGrid) {
          for (const node of row) {
            if (node.type === 'frontier') {
              node.type = 'empty'
            }
          }
        }
        return newGrid
      })
    }, delay * visitedNodesInOrder.length)
    animationTimeouts.current.push(clearFrontiersTimeout)
    
    // Animate shortest path after visited nodes
    const pathDelay = delay * visitedNodesInOrder.length + 50
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
      setIsPaused(false)
      setCanPause(false)
      animationData.current = null
      setAnimationCompleted(true)
      onVisualizationEnd?.()
    }, pathDelay + delay * shortestPath.length * 3 + 100)
    animationTimeouts.current.push(finalTimeout)
  }, [speed, onVisualizationEnd])
  
  /**
   * Run the selected pathfinding algorithm
   */
  const visualizeAlgorithm = useCallback(() => {
    // Prevent starting a new visualization if one is running or the last one completed
    if (isVisualizing || animationCompleted) return
    
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
  }, [isVisualizing, clearAnimations, grid, startPos, endPos, getAlgorithmFunction, animateAlgorithm, onVisualizationStart, animationCompleted])
  
  /**
   * Handle Clear Walls button
   */
  const handleClearWalls = useCallback(() => {
    clearAnimations()
    setIsVisualizing(false)
    setIsPaused(false)
    setCanPause(false)
    setAnimationCompleted(false)
    setGrid(prevGrid => clearWalls(prevGrid))
  }, [clearAnimations])
  
  /**
   * Handle Reset Grid button
   */
  const handleReset = useCallback(() => {
    clearAnimations()
    setIsVisualizing(false)
    setIsPaused(false)
    setCanPause(false)
    setAnimationCompleted(false)
    
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
  
  // Watch for pause trigger
  useEffect(() => {
    if (pauseTrigger && pauseTrigger > 0) {
      if (isPaused) {
        resumeVisualization()
      } else {
        pauseVisualization()
      }
    }
  }, [pauseTrigger, isPaused, pauseVisualization, resumeVisualization])
  
  // Watch for stop trigger
  useEffect(() => {
    if (stopTrigger && stopTrigger > 0) {
      stopVisualization()
    }
  }, [stopTrigger, stopVisualization])
  
  // Notify parent of pause state changes
  useEffect(() => {
    onPauseStateChange?.(isPaused, canPause)
  }, [isPaused, canPause, onPauseStateChange])
  
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
  clearWalls: () => void
}

export default Grid
