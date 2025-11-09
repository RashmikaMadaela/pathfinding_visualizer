// 🎓 LEARNING: Utility Functions
// These are "pure functions" - they take inputs and return outputs without side effects
// This makes them easy to test and reuse!

import type { Node, CellType } from '../types/grid.types'

/**
 * Creates a single node with default values
 * 
 * @param row - The row position
 * @param col - The column position
 * @returns A new Node object
 */
export const createNode = (row: number, col: number): Node => {
  return {
    row,
    col,
    type: 'empty',
    isVisited: false,
    distance: Infinity,      // Start with infinite distance
    heuristic: 0,
    previousNode: null,
  }
}

/**
 * Initializes a complete grid with the specified dimensions
 * Sets up start node in top-left area and end node in bottom-right area
 * 
 * @param rows - Number of rows in the grid
 * @param cols - Number of columns in the grid
 * @returns A 2D array of nodes
 */
export const createGrid = (rows: number, cols: number): Node[][] => {
  const grid: Node[][] = []
  
  // 🎓 LEARNING: Nested loops to create 2D array
  // Outer loop creates rows, inner loop creates columns
  for (let row = 0; row < rows; row++) {
    const currentRow: Node[] = []
    for (let col = 0; col < cols; col++) {
      currentRow.push(createNode(row, col))
    }
    grid.push(currentRow)
  }
  
  return grid
}

/**
 * Places start and end nodes in the grid
 * Start: roughly 1/4 from left, middle vertically
 * End: roughly 3/4 from left, middle vertically
 * 
 * @param grid - The grid to modify
 * @param startPos - Position of start node
 * @param endPos - Position of end node
 * @returns Grid with start and end nodes placed
 */
export const placeStartAndEnd = (
  grid: Node[][],
  startPos: { row: number; col: number },
  endPos: { row: number; col: number }
): Node[][] => {
  // 🎓 LEARNING: Deep copy of 2D array
  // We create a new array to avoid mutating the original (React best practice!)
  const newGrid = grid.map(row => row.map(node => ({ ...node })))
  
  // Set start node
  newGrid[startPos.row][startPos.col].type = 'start'
  
  // Set end node
  newGrid[endPos.row][endPos.col].type = 'end'
  
  return newGrid
}

/**
 * Toggles a cell between empty and wall (used when drawing obstacles)
 * 
 * @param grid - Current grid
 * @param row - Row of cell to toggle
 * @param col - Column of cell to toggle
 * @returns New grid with cell toggled
 */
export const toggleWall = (grid: Node[][], row: number, col: number): Node[][] => {
  const newGrid = grid.map(r => r.map(node => ({ ...node })))
  const node = newGrid[row][col]
  
  // 🎓 LEARNING: Don't allow walls on start/end nodes
  if (node.type === 'start' || node.type === 'end') {
    return newGrid
  }
  
  // Toggle between wall and empty
  node.type = node.type === 'wall' ? 'empty' : 'wall'
  
  return newGrid
}

/**
 * Sets a cell to be a wall (doesn't toggle, just sets)
 * Used for continuous wall drawing
 */
export const setWall = (grid: Node[][], row: number, col: number, isWall: boolean): Node[][] => {
  const newGrid = grid.map(r => r.map(node => ({ ...node })))
  const node = newGrid[row][col]
  
  // Don't allow walls on start/end nodes
  if (node.type === 'start' || node.type === 'end') {
    return newGrid
  }
  
  node.type = isWall ? 'wall' : 'empty'
  
  return newGrid
}

/**
 * Clears all walls from the grid
 * 
 * @param grid - Current grid
 * @returns New grid with all walls removed
 */
export const clearWalls = (grid: Node[][]): Node[][] => {
  return grid.map(row =>
    row.map(node => ({
      ...node,
      type: node.type === 'wall' ? 'empty' : node.type,
    }))
  )
}

/**
 * Clears visualization (visited, path, frontier) but keeps walls
 * Useful for running a new algorithm without redrawing walls
 * 
 * @param grid - Current grid
 * @returns New grid with visualization cleared
 */
export const clearPath = (grid: Node[][]): Node[][] => {
  return grid.map(row =>
    row.map(node => ({
      ...node,
      type: ['visited', 'path', 'frontier'].includes(node.type) ? 'empty' : node.type,
      isVisited: false,
      distance: Infinity,
      heuristic: 0,
      previousNode: null,
    }))
  )
}

/**
 * Resets the entire grid to initial state
 * 
 * @param rows - Number of rows
 * @param cols - Number of columns
 * @returns Fresh grid with start and end positioned
 */
export const resetGrid = (rows: number, cols: number): Node[][] => {
  const newGrid = createGrid(rows, cols)
  
  // Calculate default start/end positions
  const startRow = Math.floor(rows / 2)
  const startCol = Math.floor(cols / 4)
  const endRow = Math.floor(rows / 2)
  const endCol = Math.floor((cols * 3) / 4)
  
  return placeStartAndEnd(
    newGrid,
    { row: startRow, col: startCol },
    { row: endRow, col: endCol }
  )
}

/**
 * Gets the color for a cell based on its type
 * Returns actual CSS color values for inline styles
 * 
 * @param type - The cell type
 * @returns CSS color string
 */
export const getCellColor = (type: CellType): string => {
  switch (type) {
    case 'start':
      return '#22c55e'  // green-500
    case 'end':
      return '#ef4444'  // red-500
    case 'wall':
      return '#1f2937'  // gray-800 (will adjust for dark mode separately)
    case 'visited':
      return '#60a5fa'  // blue-400
    case 'path':
      return '#facc15'  // yellow-400
    case 'frontier':
      return '#c084fc'  // purple-400
    default:
      return 'var(--color-surface)'  // Use CSS variable for empty cells
  }
}

/**
 * Gets background color considering dark mode
 * 
 * @param type - The cell type
 * @param isDark - Whether dark mode is active
 * @returns CSS color string
 */
export const getCellBackground = (type: CellType, isDark: boolean): string => {
  if (type === 'wall') {
    return isDark ? '#d1d5db' : '#1f2937'  // gray-300 in dark, gray-800 in light
  }
  return getCellColor(type)
}
