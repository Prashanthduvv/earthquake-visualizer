import React from 'react'
import EarthquakeMap from './components/EarthquakeMap'

export default function App() {
  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Earthquake Visualizer</h1>
        <p className="subtitle">Live earthquakes (past day) — data from USGS</p>
      </header>
      <main className="app-main">
        <EarthquakeMap />
      </main>
      <footer className="app-footer">
        Built for Casey — Geography student. Data: USGS Earthquake API.
      </footer>
    </div>
  )
}