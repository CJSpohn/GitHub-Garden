import React, { useEffect, useState } from 'react';
import './GitHubActivityMap.css';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
const dotEnv = require('dotenv').config();


const GitHubActivityMap = (props) => {

  const [events, setEvents] = useState([]);
  const [locations, setLocations] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [ghError, setGhError] = useState('');
  const [individualError, setIndividualError] = useState('');
  const [geoErrors, setGeoErrors] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const result = await fetch('https://api.github.com/events', {
          headers: {
            authorization: `token ${process.env.REACT_APP_GH_KEY}`
          }
        })
        const data = await result.json()
        setEvents(data)
      } catch (err) {
        setGhError(err)
      }
    }
    fetchEvents()
  }, [])

  useEffect(() => {
    //fetch user data
    const fetchLocations = async () => {
      const userLocations = await Promise.all(
        events.map(async (item) => {
          try {
            const result = await fetch(item.actor.url, {
              headers: {
                authorization: `token ${process.env.REACT_APP_GH_KEY}`
              }
            })
            const data = await result.json();
            return data
          } catch (err) {
            setIndividualError(err)
          }
      }))

    //get locations from geosearch
      const places = userLocations.filter(loc => loc.location).map(loc => loc.location);
      const coords = await Promise.all(
        places.map(async place => {
          try {
            const result = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${place}&key=${process.env.REACT_APP_GEO_KEY}`)
            const data = await result.json();
            return {
              ...data.results[0].geometry,
            }
          } catch(err) {
            setGeoErrors([...geoErrors, `No coordinates for ${place}` ])
          }
        })
      )
      setLocations(coords)
    }
    fetchLocations();
  }, [events])

  useEffect(() => {

    const markers = locations.filter(location => location).map((location, index) => {
      return (
      <Circle
        className="circle-marker"
        key={index}
        center={[location.lat, location.lng]}
      >
      </Circle>
    )
    })
    setMarkers(markers)
  }, [locations])

  return (
    <div className='github-activity-map-container'>
      { props.error && props.error }
      {!props.error &&
        <MapContainer center={[51.505, -0.09]} zoom={1.5} scrollWheelZoom={false} style={{height : '100%'}}>
          <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers.length && markers}
        </MapContainer>
      }
    </div>
  )
}
export default GitHubActivityMap;
