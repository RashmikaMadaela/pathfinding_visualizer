// 🎓 LEARNING: Pathfinding Algorithms Implementation
// This file contains 6 different pathfinding algorithms

import type { Node } from '../types/grid.types'

/**
 * Result structure returned by all pathfinding algorithms
 */
export interface PathfindingResult {
  visitedNodesInOrder: Node[]
  shortestPath: Node[]
  success: boolean
}

/**
 * BREADTH-FIRST SEARCH (BFS)
 * Guarantees shortest path in unweighted graphs
 * Uses a queue (FIFO) to explore nodes level by level
 */
export function bfs(grid: Node[][], startNode: Node, endNode: Node): PathfindingResult {
  const visitedNodesInOrder: Node[] = []
  const queue: Node[] = [startNode]
  startNode.isVisited = true
  startNode.distance = 0

  while (queue.length > 0) {
    const currentNode = queue.shift()!
    
    // Skip walls
    if (currentNode.type === 'wall') continue
    
    visitedNodesInOrder.push(currentNode)
    
    // Found the target!
    if (currentNode === endNode) {
      return {
        visitedNodesInOrder,
        shortestPath: reconstructPath(endNode),
        success: true
      }
    }
    
    // Explore neighbors
    const neighbors = getNeighbors(currentNode, grid)
    for (const neighbor of neighbors) {
      if (!neighbor.isVisited && neighbor.type !== 'wall') {
        neighbor.isVisited = true
        neighbor.previousNode = currentNode
        neighbor.distance = currentNode.distance + 1
        queue.push(neighbor)
      }
    }
  }
  
  // No path found
  return {
    visitedNodesInOrder,
    shortestPath: [],
    success: false
  }
}

/**
 * DEPTH-FIRST SEARCH (DFS)
 * Does NOT guarantee shortest path
 * Uses a stack (LIFO) to explore as deep as possible
 */
export function dfs(grid: Node[][], startNode: Node, endNode: Node): PathfindingResult {
  const visitedNodesInOrder: Node[] = []
  const stack: Node[] = [startNode]
  startNode.isVisited = true

  while (stack.length > 0) {
    const currentNode = stack.pop()!
    
    // Skip walls
    if (currentNode.type === 'wall') continue
    
    visitedNodesInOrder.push(currentNode)
    
    // Found the target!
    if (currentNode === endNode) {
      return {
        visitedNodesInOrder,
        shortestPath: reconstructPath(endNode),
        success: true
      }
    }
    
    // Explore neighbors (in reverse to maintain consistent direction)
    const neighbors = getNeighbors(currentNode, grid).reverse()
    for (const neighbor of neighbors) {
      if (!neighbor.isVisited && neighbor.type !== 'wall') {
        neighbor.isVisited = true
        neighbor.previousNode = currentNode
        stack.push(neighbor)
      }
    }
  }
  
  // No path found
  return {
    visitedNodesInOrder,
    shortestPath: [],
    success: false
  }
}

/**
 * A* SEARCH ALGORITHM
 * Guarantees shortest path with optimal heuristic
 * Uses f(n) = g(n) + h(n) where:
 * - g(n) = distance from start
 * - h(n) = heuristic estimate to end (Manhattan distance)
 */
export function astar(grid: Node[][], startNode: Node, endNode: Node): PathfindingResult {
  const visitedNodesInOrder: Node[] = []
  const openSet: Node[] = [startNode]
  
  startNode.distance = 0
  startNode.heuristic = manhattanDistance(startNode, endNode)
  
  while (openSet.length > 0) {
    // Sort by f(n) = g(n) + h(n)
    openSet.sort((a, b) => {
      const fA = a.distance + a.heuristic
      const fB = b.distance + b.heuristic
      return fA - fB
    })
    
    const currentNode = openSet.shift()!
    
    // Skip walls
    if (currentNode.type === 'wall') continue
    
    // Skip if already visited
    if (currentNode.isVisited) continue
    
    currentNode.isVisited = true
    visitedNodesInOrder.push(currentNode)
    
    // Found the target!
    if (currentNode === endNode) {
      return {
        visitedNodesInOrder,
        shortestPath: reconstructPath(endNode),
        success: true
      }
    }
    
    // Explore neighbors
    const neighbors = getNeighbors(currentNode, grid)
    for (const neighbor of neighbors) {
      if (neighbor.isVisited || neighbor.type === 'wall') continue
      
      const tentativeDistance = currentNode.distance + 1
      
      // Found a better path to this neighbor
      if (tentativeDistance < neighbor.distance) {
        neighbor.distance = tentativeDistance
        neighbor.heuristic = manhattanDistance(neighbor, endNode)
        neighbor.previousNode = currentNode
        
        // Add to open set if not already there
        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor)
        }
      }
    }
  }
  
  // No path found
  return {
    visitedNodesInOrder,
    shortestPath: [],
    success: false
  }
}

/**
 * GREEDY BEST-FIRST SEARCH
 * Does NOT guarantee shortest path
 * Only uses heuristic h(n) to guide search
 */
export function greedyBFS(grid: Node[][], startNode: Node, endNode: Node): PathfindingResult {
  const visitedNodesInOrder: Node[] = []
  const openSet: Node[] = [startNode]
  
  startNode.heuristic = manhattanDistance(startNode, endNode)
  
  while (openSet.length > 0) {
    // Sort by heuristic only
    openSet.sort((a, b) => a.heuristic - b.heuristic)
    
    const currentNode = openSet.shift()!
    
    // Skip walls
    if (currentNode.type === 'wall') continue
    
    // Skip if already visited
    if (currentNode.isVisited) continue
    
    currentNode.isVisited = true
    visitedNodesInOrder.push(currentNode)
    
    // Found the target!
    if (currentNode === endNode) {
      return {
        visitedNodesInOrder,
        shortestPath: reconstructPath(endNode),
        success: true
      }
    }
    
    // Explore neighbors
    const neighbors = getNeighbors(currentNode, grid)
    for (const neighbor of neighbors) {
      if (neighbor.isVisited || neighbor.type === 'wall') continue
      
      if (neighbor.heuristic === Infinity) {
        neighbor.heuristic = manhattanDistance(neighbor, endNode)
        neighbor.previousNode = currentNode
        openSet.push(neighbor)
      }
    }
  }
  
  // No path found
  return {
    visitedNodesInOrder,
    shortestPath: [],
    success: false
  }
}

/**
 * UNIFORM COST SEARCH
 * Guarantees shortest path for weighted graphs
 * Similar to Dijkstra's algorithm
 */
export function uniformCostSearch(grid: Node[][], startNode: Node, endNode: Node): PathfindingResult {
  const visitedNodesInOrder: Node[] = []
  const openSet: Node[] = [startNode]
  
  startNode.distance = 0
  
  while (openSet.length > 0) {
    // Sort by cost (distance from start)
    openSet.sort((a, b) => a.distance - b.distance)
    
    const currentNode = openSet.shift()!
    
    // Skip walls
    if (currentNode.type === 'wall') continue
    
    // Skip if already visited
    if (currentNode.isVisited) continue
    
    currentNode.isVisited = true
    visitedNodesInOrder.push(currentNode)
    
    // Found the target!
    if (currentNode === endNode) {
      return {
        visitedNodesInOrder,
        shortestPath: reconstructPath(endNode),
        success: true
      }
    }
    
    // Explore neighbors
    const neighbors = getNeighbors(currentNode, grid)
    for (const neighbor of neighbors) {
      if (neighbor.isVisited || neighbor.type === 'wall') continue
      
      const tentativeDistance = currentNode.distance + 1 // Cost is 1 for each step
      
      if (tentativeDistance < neighbor.distance) {
        neighbor.distance = tentativeDistance
        neighbor.previousNode = currentNode
        
        if (!openSet.includes(neighbor)) {
          openSet.push(neighbor)
        }
      }
    }
  }
  
  // No path found
  return {
    visitedNodesInOrder,
    shortestPath: [],
    success: false
  }
}

/**
 * ITERATIVE DEEPENING DEPTH-FIRST SEARCH (IDDFS)
 * Memory efficient like DFS, complete like BFS
 * Repeatedly performs depth-limited DFS with increasing depth limits
 */
export function iterativeDeepening(grid: Node[][], startNode: Node, endNode: Node): PathfindingResult {
  const allVisitedNodes: Node[] = []
  
  // Try increasing depth limits
  for (let maxDepth = 0; maxDepth < grid.length * grid[0].length; maxDepth++) {
    // Reset visited status for each iteration
    for (const row of grid) {
      for (const node of row) {
        node.isVisited = false
        node.previousNode = null
      }
    }
    
    const result = depthLimitedSearch(grid, startNode, endNode, maxDepth, allVisitedNodes)
    
    if (result.success) {
      return {
        visitedNodesInOrder: allVisitedNodes,
        shortestPath: reconstructPath(endNode),
        success: true
      }
    }
  }
  
  // No path found
  return {
    visitedNodesInOrder: allVisitedNodes,
    shortestPath: [],
    success: false
  }
}

/**
 * Helper function for Iterative Deepening
 * Performs DFS with a depth limit
 */
function depthLimitedSearch(
  grid: Node[][],
  currentNode: Node,
  endNode: Node,
  maxDepth: number,
  visitedNodes: Node[],
  depth: number = 0
): { success: boolean } {
  if (currentNode.type === 'wall') return { success: false }
  
  currentNode.isVisited = true
  visitedNodes.push(currentNode)
  
  if (currentNode === endNode) {
    return { success: true }
  }
  
  if (depth >= maxDepth) {
    return { success: false }
  }
  
  const neighbors = getNeighbors(currentNode, grid)
  for (const neighbor of neighbors) {
    if (!neighbor.isVisited && neighbor.type !== 'wall') {
      neighbor.previousNode = currentNode
      const result = depthLimitedSearch(grid, neighbor, endNode, maxDepth, visitedNodes, depth + 1)
      if (result.success) return { success: true }
    }
  }
  
  return { success: false }
}

/**
 * Get all valid neighbors of a node (up, right, down, left)
 */
function getNeighbors(node: Node, grid: Node[][]): Node[] {
  const neighbors: Node[] = []
  const { row, col } = node
  
  // Up
  if (row > 0) neighbors.push(grid[row - 1][col])
  // Right
  if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1])
  // Down
  if (row < grid.length - 1) neighbors.push(grid[row + 1][col])
  // Left
  if (col > 0) neighbors.push(grid[row][col - 1])
  
  return neighbors
}

/**
 * Manhattan distance heuristic for A* and Greedy BFS
 * Returns the L1 distance between two nodes
 */
function manhattanDistance(nodeA: Node, nodeB: Node): number {
  return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col)
}

/**
 * Reconstruct the shortest path by following previousNode pointers
 */
function reconstructPath(endNode: Node): Node[] {
  const path: Node[] = []
  let currentNode: Node | null = endNode
  
  while (currentNode !== null) {
    path.unshift(currentNode)
    currentNode = currentNode.previousNode
  }
  
  return path
}
