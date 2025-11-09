// 🎓 LEARNING: TypeScript Interfaces
// Interfaces define the "shape" of our data - what properties objects should have
// This helps catch bugs early and provides autocomplete in your editor!

/**
 * CellType defines what kind of cell we're dealing with
 */
export type CellType = 
  | 'empty'      // Normal walkable cell
  | 'wall'       // Obstacle that blocks pathfinding
  | 'start'      // Starting point for pathfinding
  | 'end'        // Goal/target point
  | 'visited'    // Cell that has been explored by algorithm
  | 'path'       // Cell that's part of the final shortest path
  | 'frontier'   // Cell currently in the algorithm's queue/stack

/**
 * Node represents a single cell in our grid
 * Each cell knows its position, type, and properties for pathfinding
 */
export interface Node {
  row: number           // Y coordinate in grid (0-indexed)
  col: number           // X coordinate in grid (0-indexed)
  type: CellType        // What kind of cell this is
  
  // Pathfinding properties (will be used by algorithms later)
  isVisited: boolean    // Has this been explored?
  distance: number      // Distance from start (for algorithms like Dijkstra)
  heuristic: number     // Estimated distance to goal (for A*)
  previousNode: Node | null  // Parent node to reconstruct path
}

/**
 * GridState manages the entire grid and interaction state
 */
export interface GridState {
  grid: Node[][]              // 2D array of nodes
  startNode: { row: number; col: number }  // Position of start
  endNode: { row: number; col: number }    // Position of end
  isMousePressed: boolean      // Are we currently drawing?
  isMovingStart: boolean       // Are we dragging the start node?
  isMovingEnd: boolean         // Are we dragging the end node?
}
