import React from "react";
import PlacesService, {
    GoogleMap,
    useLoadScript,
    Marker,
    InfoWindow,
} from "@react-google-maps/api";

import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";
import "@reach/combobox/styles.css";
import mapStyles from "./mapStyles";

const libraries = ["places"];
const mapContainerStyle = {
  width: "100vw",
  height: "100vh",
};

let service;
const center = {
  lat: 33.350690,
  lng: -111.822610,
};
const options = {
  styles: mapStyles,
  disableDefaultUI: true,
  zoomControl: true,
}

export default function App() {
    const {isLoaded, loadError} = useLoadScript({
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
        libraries,
    });

    const mapRef = React.useRef();
    const onMapLoad = React.useCallback(map => {
       mapRef.current = map;
    }, []);

    let infowindows = [];

    const panTo = React.useCallback(({ lat, lng }) => {
      mapRef.current.panTo({ lat, lng });
      mapRef.current.setZoom(12);
      let map = mapRef.current;
  
      let request = {
        location: { lat, lng },
        radius: "10000",
        type: ["restaurant"]
      };

      service = new window.google.maps.places.PlacesService(mapRef.current);
      service.nearbySearch(request, callback);
      function callback(results, status) {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          for (let i = 0; i < results.length; i++) {
            let place = results[i];
            // Log what we get back from google
            console.log(place);
            // Make a info bubble for marker
            const infowindow = new window.google.maps.InfoWindow({
              content: place.name,
            });
            // Place marker on map
            const marker = new window.google.maps.Marker({
              position: place.geometry.location,
              map
            });
            infowindows.push(infowindow);
            // Hover over da map to see food place title
            marker.addListener("mouseover", ()=> {
              infowindow.open(map, marker);
            });
            marker.addListener("mouseout", ()=> {
              infowindow.close();
            });
          }
        }
      }
    }, []);

    if (loadError) return "Error Loading Maps";
    if (!isLoaded) return "Loading Maps"

    return (
      <div>
        <h1>
          Where To Eat{" "}
          <span role="img" aria-label="hamburger">
            🍔
          </span>
        </h1>
        <Search panTo={panTo}/>
        <GoogleMap
         id="map"
         mapContainerStyle={mapContainerStyle} 
         zoom={13}
         center={center}
         options={options}
         onLoad={onMapLoad}
         onClick={(event) => {}}
         >
         </GoogleMap>
      </div>
    )
}

function Search({ panTo }) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions
  } = usePlacesAutocomplete({
    requestOptions: {
      /* Define search scope here */
      // radius: 200 * 1000,
    },
    debounce: 300
  });

  const handleInput = e => {
    // Update the keyword of the input element
    setValue(e.target.value);
  };

  const handleSelect = ({ description }) => () => {
    // When user selects a place, we can replace the keyword without request data from API
    // by setting the second parameter to "false"
    setValue(description, false);
    clearSuggestions();

    // Get latitude and longitude via utility functions
    getGeocode({ address: description })
      .then(results => getLatLng(results[0]))
      .then(({ lat, lng }) => {
        panTo({ lat, lng });
      })
      .catch(error => {
        console.log("😱 Error: ", error);
      });
  };

  const renderSuggestions = () =>
    data.map(suggestion => {
      const {
        place_id,
        structured_formatting: { main_text, secondary_text }
      } = suggestion;

      return (
        <li key={place_id} onClick={handleSelect(suggestion)}>
          <strong>{main_text}</strong> <small>{secondary_text}</small>
        </li>
      );
    });

  return (
    <div className="search">
      <input
        value={value}
        onChange={handleInput}
        disabled={!ready}
        placeholder="Where are you going?"
      />
      {/* We can use the "status" to decide whether we should display the dropdown or not */}
      {status === "OK" && <ul>{renderSuggestions()}</ul>}
    </div>
  );
}