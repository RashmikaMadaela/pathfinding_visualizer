import { useState, useEffect } from 'react'
import './index.css'
import Grid from './components/Grid'

function App() {
  // 🎓 LEARNING: useState Hook
  // This creates a "state variable" that React tracks. When it changes, React re-renders the component.
  // [darkMode] is the current value, [setDarkMode] is the function to update it
  const [darkMode, setDarkMode] = useState(false)
  
  // State for algorithm selection
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('bfs')
  const [speed, setSpeed] = useState(5)
  const [gridSize, setGridSize] = useState(20)
  const [visualizeTrigger, setVisualizeTrigger] = useState(0)
  const [isVisualizing, setIsVisualizing] = useState(false)

  // 🎓 LEARNING: useEffect Hook
  // Runs side effects (code that affects things outside React) when dependencies change
  // Here we're adding/removing the 'dark' class on the HTML element for Tailwind dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode]) // Only runs when darkMode changes

  // 🎓 LEARNING: Event Handlers
  // Functions that respond to user actions (clicks, changes, etc.)
  const toggleDarkMode = () => {
    setDarkMode(!darkMode) // Toggle between true and false
  }

  return (
    <div className="min-h-screen transition-colors duration-300">
      {/* 🎓 LEARNING: Responsive Layout with Tailwind
          - min-h-screen: minimum height of viewport
          - max-w-7xl: maximum width for large screens (80rem/1280px)
          - w-full: take full width up to max-w
          - Reduced padding for better single-screen fit
          - Container centers content and adds responsive spacing */}
      <div className="max-w-7xl mx-auto w-full px-3 md:px-4 lg:px-6 py-4 md:py-6 lg:py-8">
        
        {/* Header Section */}
        <header className="panel-8bit mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Title */}
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl lg:text-3xl mb-2 leading-tight">
                <span className="animate-pulse">▶</span> PATHFINDING VISUALIZER
              </h1>
              <p className="text-xs md:text-sm opacity-80 leading-relaxed">
                🎮 8-BIT RETRO ALGORITHM EXPLORER
              </p>
            </div>
            
            {/* Dark/Light Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="btn-8bit btn-secondary self-start md:self-center"
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️ LIGHT' : '🌙 DARK'}
            </button>
          </div>
        </header>

        {/* Controls Panel */}
        <div className="panel-8bit mb-4 md:mb-6">
          <h2 className="text-base md:text-lg lg:text-xl border-b-4 border-current" style={{ marginBottom: '1rem', paddingBottom: '0.5rem' }}>
            ⚙️ CONTROLS
          </h2>
          
          {/* 🎓 LEARNING: CSS Grid for Responsive Layout
              - grid-cols-1: 1 column on mobile
              - md:grid-cols-2: 2 columns on medium screens
              - lg:grid-cols-3: 3 columns on large screens
              - gap-3 to gap-4: compact spacing between grid items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
            
            {/* Algorithm Selection */}
            <div className="flex flex-col gap-2">
              <label htmlFor="algorithm-select" className="text-xs md:text-sm">
                🧠 ALGORITHM:
              </label>
              <select
                id="algorithm-select"
                value={selectedAlgorithm}
                onChange={(e) => setSelectedAlgorithm(e.target.value)}
                className="select-8bit w-full"
              >
                <option value="bfs">BFS</option>
                <option value="dfs">DFS</option>
                <option value="uniform-cost">Uniform Cost</option>
                <option value="iterative-deepening">Iterative Deep.</option>
                <option value="greedy-bfs">Greedy BFS</option>
                <option value="astar">A* Search</option>
              </select>
            </div>

            {/* Speed Control */}
            <div className="flex flex-col gap-2">
              <label htmlFor="speed-range" className="text-xs md:text-sm">
                ⚡ SPEED: <span className="font-bold">{speed}</span>
              </label>
              <input
                type="range"
                id="speed-range"
                min="1"
                max="10"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full h-8 cursor-pointer"
                style={{
                  accentColor: 'var(--color-primary)'
                }}
              />
            </div>

            {/* Grid Size Control */}
            <div className="flex flex-col gap-2">
              <label htmlFor="grid-size" className="text-xs md:text-sm">
                📐 GRID SIZE: <span className="font-bold">{gridSize}x{gridSize}</span>
              </label>
              <input
                type="range"
                id="grid-size"
                min="10"
                max="25"
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                className="w-full h-8 cursor-pointer"
                style={{
                  accentColor: 'var(--color-accent)'
                }}
              />
            </div>
          </div>

        </div>

        {/* Grid and Info - Side by side on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4">
          
          {/* Grid Visualization Area with Action Buttons */}
          <div className="panel-8bit lg:col-span-2">
            <h2 className="text-base md:text-lg lg:text-xl border-b-4 border-current" style={{ marginBottom: '1rem', paddingBottom: '0.5rem' }}>
              🗺️ GRID
            </h2>
            
            {/* Action Buttons - Now with Grid */}
            <div className="flex flex-wrap gap-2 md:gap-3 mb-4">
              <button 
                onClick={() => setVisualizeTrigger(prev => prev + 1)}
                disabled={isVisualizing}
                className="btn-8bit btn-primary flex-1 min-w-[100px] text-xs py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVisualizing ? '⏳ RUNNING...' : '▶ START'}
              </button>
              <button 
                disabled={true}
                className="btn-8bit flex-1 min-w-[100px] text-xs py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ⏸ PAUSE
              </button>
              <button 
                onClick={() => setVisualizeTrigger(0)}
                disabled={isVisualizing}
                className="btn-8bit flex-1 min-w-[100px] text-xs py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔄 RESET
              </button>
              <button 
                disabled={true}
                className="btn-8bit btn-secondary flex-1 min-w-[100px] text-xs py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🎲 MAZE
              </button>
            </div>
            
            <div className="flex justify-center items-center">
              {/* 🎓 LEARNING: Pass gridSize as props to Grid component */}
              <Grid 
                rows={gridSize} 
                cols={gridSize}
                selectedAlgorithm={selectedAlgorithm}
                speed={speed}
                visualizeTrigger={visualizeTrigger}
                onVisualizationStart={() => setIsVisualizing(true)}
                onVisualizationEnd={() => setIsVisualizing(false)}
              />
            </div>
          </div>

          {/* Right Side Panel - Legend and Algorithm Info stacked */}
          <div className="lg:col-span-1 flex flex-col gap-4 md:gap-6">
            
            {/* Legend Panel */}
            <div className="panel-8bit">
              <h2 className="text-base md:text-lg lg:text-xl border-b-4 border-current" style={{ marginBottom: '1rem', paddingBottom: '0.5rem' }}>
                📖 LEGEND
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 md:gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-green-500 border-2 border-current"></div>
                  <span>START</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-red-500 border-2 border-current"></div>
                  <span>TARGET</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-gray-800 dark:bg-gray-300 border-2 border-current"></div>
                  <span>WALL</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-blue-400 border-2 border-current"></div>
                  <span>VISITED</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-yellow-400 border-2 border-current"></div>
                  <span>PATH</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-purple-400 border-2 border-current"></div>
                  <span>FRONTIER</span>
                </div>
              </div>
            </div>

            {/* Info Panel */}
            <div className="panel-8bit">
              <h2 className="text-base md:text-lg lg:text-xl border-b-4 border-current" style={{ marginBottom: '1rem', paddingBottom: '0.5rem' }}>
                ℹ️ ALGORITHM INFO
              </h2>
              <div className="text-xs md:text-sm leading-relaxed space-y-2">
            {selectedAlgorithm === 'bfs' && (
              <>
                <p><strong>BREADTH-FIRST SEARCH (BFS)</strong></p>
                <p>✓ Guarantees shortest path (unweighted)</p>
                <p>✓ Explores nodes level by level</p>
                <p>✗ Uses more memory (queue)</p>
              </>
            )}
            {selectedAlgorithm === 'dfs' && (
              <>
                <p><strong>DEPTH-FIRST SEARCH (DFS)</strong></p>
                <p>✓ Uses less memory (stack)</p>
                <p>✓ Good for maze generation</p>
                <p>✗ Does NOT guarantee shortest path</p>
              </>
            )}
            {selectedAlgorithm === 'uniform-cost' && (
              <>
                <p><strong>UNIFORM COST SEARCH</strong></p>
                <p>✓ Guarantees shortest path (weighted)</p>
                <p>✓ Considers edge costs</p>
                <p>✗ Slower than A* with good heuristic</p>
              </>
            )}
            {selectedAlgorithm === 'iterative-deepening' && (
              <>
                <p><strong>ITERATIVE DEEPENING</strong></p>
                <p>✓ Memory efficient like DFS</p>
                <p>✓ Complete like BFS</p>
                <p>✗ Revisits nodes multiple times</p>
              </>
            )}
            {selectedAlgorithm === 'greedy-bfs' && (
              <>
                <p><strong>GREEDY BEST-FIRST SEARCH</strong></p>
                <p>✓ Fast (uses heuristic)</p>
                <p>✓ Often finds a path quickly</p>
                <p>✗ Does NOT guarantee shortest path</p>
              </>
            )}
            {selectedAlgorithm === 'astar' && (
              <>
                <p><strong>A* SEARCH</strong></p>
                <p>✓ Guarantees shortest path</p>
                <p>✓ Very efficient (combines UCS + heuristic)</p>
                <p>✓ Industry standard for pathfinding</p>
              </>
            )}
          </div>
        </div>
          
          </div>

        </div>

        {/* Footer */}
        <footer className="mt-6 text-center text-xs opacity-60">
          <p>MADE WITH ❤️ FOR LEARNING | PRESS START TO CONTINUE</p>
        </footer>
      </div>
    </div>
  )
}

export default App
