import React, { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, LayersControl } from 'react-leaflet'
import L from 'leaflet'
import { format } from 'date-fns'

const USGS_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson'

function FitBounds({ features }) {
  const map = useMap()
  useEffect(() => {
    if (!features || features.length === 0) return
    const latlngs = features.map(f => [f.geometry.coordinates[1], f.geometry.coordinates[0]])
    const bounds = L.latLngBounds(latlngs)
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [features, map])
  return null
}

export default function EarthquakeMap() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [minMag, setMinMag] = useState(0)
  const [selectedType, setSelectedType] = useState('all')
  const fetchedAtRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(USGS_URL)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok')
        fetchedAtRef.current = new Date()
        return res.json()
      })
      .then(json => {
        if (cancelled) return
        setData(json.features || [])
        setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        setError(err.message)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = data.filter(f => {
    const mag = f.properties.mag ?? 0
    if (mag < minMag) return false
    if (selectedType === 'all') return true
    return f.properties.type === selectedType
  })

  function colorForDepth(depth) {
    if (depth < 10) return '#2DC937'
    if (depth < 30) return '#99C140'
    if (depth < 70) return '#E7B416'
    if (depth < 150) return '#DB7B2B'
    return '#CC3232'
  }

  function radiusForMag(mag) {
    if (mag <= 0) return 4
    return Math.min(20, 4 + mag * 3)
  }

  return (
    <div className="map-wrapper">
      <aside className="controls">
        <h3>Filters</h3>
        <label>Minimum Magnitude: <strong>{minMag}</strong></label>
        <input type="range" min="0" max="8" step="0.1" value={minMag}
          onChange={e => setMinMag(parseFloat(e.target.value))} />

        <label>Event type</label>
        <select value={selectedType} onChange={e => setSelectedType(e.target.value)}>
          <option value="all">All</option>
          <option value="earthquake">Earthquake</option>
          <option value="quarry blast">Quarry Blast</option>
          <option value="explosion">Explosion</option>
        </select>

        <div className="meta">
          <p>Events (filtered): <strong>{filtered.length}</strong></p>
          <p>Fetched at: <strong>{fetchedAtRef.current ? format(fetchedAtRef.current, 'PPpp') : '—'}</strong></p>
          {loading && <p>Loading latest events...</p>}
          {error && <p className="error">Error: {error}</p>}
        </div>

        <div className="legend">
          <h4>Legend (by depth km)</h4>
          <ul>
            <li><span className="swatch" style={{ background: '#2DC937' }} /> &lt; 10</li>
            <li><span className="swatch" style={{ background: '#99C140' }} /> 10–30</li>
            <li><span className="swatch" style={{ background: '#E7B416' }} /> 30–70</li>
            <li><span className="swatch" style={{ background: '#DB7B2B' }} /> 70–150</li>
            <li><span className="swatch" style={{ background: '#CC3232' }} /> &gt; 150</li>
          </ul>
        </div>
      </aside>

      <div className="map-container">
        <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds features={filtered} />

          {filtered.map(feature => {
            const [lon, lat, depth] = feature.geometry.coordinates
            const mag = feature.properties.mag ?? 0
            const place = feature.properties.place
            const time = feature.properties.time
            return (
              <CircleMarker
                key={feature.id}
                center={[lat, lon]}
                radius={radiusForMag(mag)}
                pathOptions={{ color: colorForDepth(depth), fillOpacity: 0.7, weight: 1 }}
              >
                <Popup>
                  <div style={{ minWidth: 200 }}>
                    <strong>{place}</strong>
                    <div>Magnitude: <strong>{mag}</strong></div>
                    <div>Depth: {depth} km</div>
                    <div>Time: {format(new Date(time), 'PPpp')}</div>
                    <div><a href={feature.properties.url} target="_blank" rel="noreferrer">USGS event page</a></div>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}