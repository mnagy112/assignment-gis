import React, { Component } from 'react';
import {Map, TileLayer, Marker, Tooltip, Circle, GeoJSON} from 'react-leaflet';
import {Button, Collapse, FormGroup, Input, Label} from 'reactstrap';
import hash from 'object-hash';

import 'react-rangeslider/lib/index.css';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import MapboxLayer from "../MapboxLayer";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('../../icons/blue.png')
});

let LeafIcon = L.Icon.extend({
  options: {
    iconSize: [25, 41], 
    iconAnchor: [12, 41],
    popupAnchor: [0, -33],
    tooltipAnchor: [0, -33]
  }
});

const greenMarker = new LeafIcon({
  iconUrl: require('../../icons/green.png')
});

const redMarker = new LeafIcon({
  iconUrl: require('../../icons/red.png')
});

const yellowMarker = new LeafIcon({
  iconUrl: require('../../icons/yellow.png')
});

const greyMarker = new LeafIcon({
  iconUrl: require('../../icons/darkgrey.png')
});

export default class Home extends Component {

  constructor(...props) {
    super(...props);

    this.state = {
      lat: 48.148598,
      lon: 17.107748,
      zoom: 13,
      scenarioSet: 0,
      bicycleStations: [],
      cycleWays: [],
      administrativeBorders: [],
      useDistanceFromMe: false,
      distanceFromMe: 1,
      showWays: false,
      showStations: false,
      slovnaftBajk: false,
      whiteBikes: false
    };
    
    this.loadStationsData = this.loadStationsData.bind(this);
    this.loadWaysData = this.loadWaysData.bind(this);
    this.getMyLocation = this.getMyLocation.bind(this);
    this.changeMarkerPosition = this.changeMarkerPosition.bind(this);
    this.fetchWaysNearStation = this.fetchWaysNearStation.bind(this);
    this.setScenario = this.setScenario.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleOptionChange = this.handleOptionChange.bind(this);
    this.getBikeStationPopupStyle = this.getBikeStationPopupStyle.bind(this);
    this.pointToLayer = this.pointToLayer.bind(this);
    this.fetchStationsAndWaysInsideArea = this.fetchStationsAndWaysInsideArea.bind(this);
    this.onEachFeature = this.onEachFeature.bind(this);
    this.loadAdministrativeBorders = this.loadAdministrativeBorders.bind(this);
    this.fetchStatisticsInArea = this.fetchStatisticsInArea.bind(this);
  }
  
  loadAdministrativeBorders (filtered) {
    fetch(`api/BAjkStations/GetAdministrativeBorders${filtered ? "Filtered" : ""}`)
      .then(response => response.json())
      .then(response => {
        console.log(response);
        this.setState({
          ...this.state,
          administrativeBorders: response
        })
      }, error => {
        console.log(error);
      });
  }

  loadWaysData (lat, lon, distance) {
    
    let opts = {
      lat: lat ? lat : this.state.lat,
      lon: lon ? lon : this.state.lon,
      distance: distance && this.state.useDistanceFromMe ? distance : this.state.useDistanceFromMe ? this.state.distanceFromMe : -1
    };
    
    fetch(`api/BAjkStations/GetCycleWays?lat=${opts.lat}&lon=${opts.lon}&distance=${opts.distance}`)
      .then(response => response.json())
      .then(response => {
        this.setState({
          ...this.state,
          cycleWays: response
        })
      }, error => {
        console.log(error);
      });
  }

  loadStationsData (lat, lon, slovnaftBajk, whiteBikes, distance) {

    let opts = {
      lat: lat ? lat : this.state.lat,
      lon: lon ? lon : this.state.lon,
      slovnaftBajk: slovnaftBajk !== undefined ? slovnaftBajk : this.state.slovnaftBajk,
      whiteBikes: whiteBikes !== undefined ? whiteBikes : this.state.whiteBikes,
      distance: distance && this.state.useDistanceFromMe ? distance : this.state.useDistanceFromMe ? this.state.distanceFromMe : -1
    };
    
    fetch(`api/BAjkStations/GetStations?lat=${opts.lat}&lon=${opts.lon}&slovnaftBAjk=${opts.slovnaftBajk}&whiteBikes=${opts.whiteBikes}&distance=${opts.distance}`)
      .then(response => response.json())
      .then(response => {
        this.setState({
          ...this.state,
          bicycleStations: response
        });
      }, error => {
        console.log(error);
      });
  }
  
  fetchWaysNearStation(id) {
    fetch(`api/BAjkStations/GetNearbyCycleWays?stationId=${id}&distance=${this.state.distanceFromStation}`)
      .then(response => response.json())
      .then(response => {
        this.setState({
          ...this.state,
          cycleWays: response
        });
      }, error => {
        console.log(error);
      })
  }

  fetchStationsAndWaysInsideArea(id) {
    fetch(`api/BAjkStations/GetStationsAndWaysInsideArea?areaId=${id}`)
      .then(response => response.json())
      .then(response => {
        this.setState({
          ...this.state,
          cycleWays: response.ways,
          bicycleStations: response.stations
        });
      }, error => {
        console.log(error);
      })
  }

  fetchStatisticsInArea() {
    fetch(`api/BAjkStations/GetStatisticsForAreas`)
      .then(response => response.json())
      .then(response => {
        this.setState({
          ...this.state,
          administrativeBorders: response,
          cycleWays: [],
          bicycleStations: [] 
        });
      }, error => {
        console.log(error);
      })
  }

  getMyLocation () {
    if ("geolocation" in navigator) {

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.setState({
            ...this.state,
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          if(this.state.showStations)
            this.loadStationsData(position.coords.latitude, position.coords.longitude);
          if(this.state.showWays)
            this.loadWaysData(position.coords.latitude, position.coords.longitude);
        },
        (error_message) => {
          alert('An error has occured' + error_message)
        }
      );
    }
    else {
      alert("Geolocation is not supported by your browser");
    }
  }
  
  changeMarkerPosition(e) {
    let pos = e.target._latlng;
    
    this.setState({
      ...this.state,
      lat: pos.lat,
      lon: pos.lng
    });

    if(this.state.showStations)
      this.loadStationsData(pos.lat, pos.lng);
    if(this.state.showWays)
      this.loadWaysData(pos.lat, pos.lng);
  }

  setScenario(id) {    
    let scenario = this.state.scenarioSet === id ? -1 : id;
    
    if (scenario === 1)
      this.loadAdministrativeBorders();

    if (scenario === 2)
      this.fetchStatisticsInArea();

    this.setState({
      ...this.state,
      scenarioSet: scenario,
      administrativeBorders: [],
      cycleWays: [],
      bicycleStations: []
    });
  }

  handleChange(name, e) {
    let val = e.target ? e.target.type === 'checkbox' ? e.target.checked : e.target.value : e;
    
    this.setState({
      ...this.state,
      [name]: val
    });

    if(name === "showStations" && val)
      this.loadStationsData();
    else if(name === "showWays" && val)
      this.loadWaysData();
  }

  handleOptionChange(e) {
    let value = e.target.value;
    
    switch (value) {
      case "SlovnaftBAjk":
        this.setState({
          ...this.state,
          slovnaftBajk: true,
          whiteBikes: false
        });
        if(this.state.showStations)
          this.loadStationsData(undefined, undefined, true, false);
        break;
      case "WhiteBikes":
        this.setState({
          ...this.state,
          slovnaftBajk: false,
          whiteBikes: true
        });
        if(this.state.showStations)
          this.loadStationsData(undefined, undefined, false, true);
        break;
      default:
        this.setState({
          ...this.state,
          slovnaftBajk: false,
          whiteBikes: false
        });
        if(this.state.showStations)
          this.loadStationsData(undefined, undefined, false, false);
        break;
    }
  }

  pointToLayer(feature, latlng) {
    let station = feature.properties;
    
    return L.marker(latlng, {
      icon: station.Type === 1 ? greyMarker : station.Ready <= station.Size / 5 ? redMarker : station.Ready >= station.Size * 4 / 5 ? greenMarker : yellowMarker,
      ...feature.properties
    })
      .bindTooltip(this.getBikeStationPopupStyle(station), {direction: "top"})
      .on("click", () => this.fetchWaysNearStation(station.Id));
  }

  static getLineStyle(feature) {
    return feature.properties.IsDesignated ? {color: "green"} : {color: "red"};
  }
  
  getBikeStationPopupStyle(station) {
    return `
    <div style="text-align: center">
      <b>${station.Name}</b>
      <table class="PopupTable">
        <tbody>
          <tr>
            <th>Provider</th>
            <td>${station.Type === 0 ? "Slovnaft" : "WhiteBikes"}</td>
          </tr>
        </tbody>
      </table>
      ${station.Type === 0 ?
        `<table class="PopupTable">
          <tbody>
            <tr>
              <th>Free bikes</th>
              <td>${station.Ready}</td>
            </tr>
            <tr>
              <th>Free docks</th>
              <td>${station.Size - station.Ready}</td>
            </tr>
            <tr>
              <th>Station size</th>
              <td>${station.Size}</td>
            </tr>
          </tbody>
        </table>`
        : ""
      }
      <div style="margin-top: 10px; text-align: center">
        Click on marker to search for<br/>cycle paths near this point
      </div>
    </div>`
  }

  getAreaPopupStyle(area) {
    return `
    <div style="text-align: center">
      <b>${area.Name}</b>
      <table class="PopupTable">
          <tbody>
            <tr>
              <th>Size</th>
              <td>${area.Size}km<sup>2</sup></td>
            </tr>
            <tr>
              <th>Bicycle stations</th>
              <td>${area.StationCount}</td>
            </tr>
            <tr>
              <th>Bicycle Ways</th>
              <td>${area.WayCount}</td>
            </tr>
          </tbody>
        </table>
    </div>`
  }

  onEachFeature(feature, layer) {    
    layer
      .bindTooltip(this.state.scenarioSet === 1 ? feature.properties.Name : this.getAreaPopupStyle(feature.properties), {direction: "top"})
      .on("mouseover", () => 
        layer.setStyle({
          color: 'blue'
        })
      )
      .on("mouseout", () =>
        layer.setStyle({
          color: 'black'
        })
      )
      .on("click", () => {
        if(this.state.scenarioSet === 1)
          this.fetchStationsAndWaysInsideArea(feature.properties.Id);
      })
  }

  render() {

    let position = [this.state.lat, this.state.lon];
   
    return (
      <React.Fragment>
        <aside>
          <div className={"Scenario"} onClick={() => this.setScenario(0)}>
            <i className={`fa fa-caret-${this.state.scenarioSet === 0 ? "up" : "down"}`}/>
            Scenario 1
          </div>
          <Collapse isOpen={this.state.scenarioSet === 0}>
            <h6>Data to display</h6>
            <section>
              <FormGroup check>
                <Label check>
                  <Input type="checkbox" value={this.state.showStations} onChange={(e) => this.handleChange('showStations', e)} />{' '}
                  Show bike stations
                </Label>
              </FormGroup>
              <section>
                <FormGroup tag="fieldset">
                  <FormGroup check>
                    <Label check>
                      <Input 
                        type="radio" 
                        value="SlovnaftBAjk" 
                        checked={this.state.slovnaftBajk && !this.state.whiteBikes}
                        onChange={this.handleOptionChange}
                      />{' '}
                      SlovnaftBAjk
                    </Label>
                  </FormGroup>
                  <FormGroup check>
                    <Label check>
                      <Input 
                        type="radio" 
                        value="WhiteBikes" 
                        checked={!this.state.slovnaftBajk && this.state.whiteBikes}
                        onChange={this.handleOptionChange}
                      />{' '}
                      WhiteBikes
                    </Label>
                  </FormGroup>
                  <FormGroup check>
                    <Label check>
                      <Input 
                        type="radio" 
                        value="Both" 
                        checked={!this.state.slovnaftBajk && !this.state.whiteBikes}
                        onChange={this.handleOptionChange}
                      />{' '}
                      Both
                    </Label>
                  </FormGroup>
                </FormGroup>
              </section>
              <FormGroup check>
                <Label check>
                  <Input type="checkbox" value={this.state.showWays} onChange={(e) => this.handleChange('showWays', e)} />{' '}
                  Show bike paths
                </Label>
              </FormGroup>
              <FormGroup check>
                <Label check>
                  <Input type="checkbox" value={this.state.useDistanceFromMe} onChange={(e) => this.handleChange('useDistanceFromMe', e)}/>{' '}
                  Search in distance from my position
                </Label>
              </FormGroup>
              <section>
                <Input bsSize={"sm"} type={"number"} value={this.state.distanceFromMe} step={0.05} onChange={(e) => this.handleChange('distanceFromMe', e)} />
              </section>
            </section>
          </Collapse>
          <div className={"Scenario"} onClick={() => this.setScenario(1)}>
            <i className={`fa fa-caret-${this.state.scenarioSet === 1 ? "up" : "down"}`}/>
            Scenario 2
          </div>
          <Collapse isOpen={this.state.scenarioSet === 1}>
            <section>
              <FormGroup check>
                <Label check>
                  <Input type="checkbox" value={this.state.useDistanceFromMe} onChange={(e) => this.loadAdministrativeBorders(e.target.checked)}/>{' '}
                  Display only city parts with bike stations / cycle ways
                </Label>
              </FormGroup>
            </section>
          </Collapse>
          <div className={"Scenario"} onClick={() => this.setScenario(2)}>
            <i className={`fa fa-caret-${this.state.scenarioSet === 2 ? "up" : "down"}`}/>
            Scenario 3
          </div>
          <Collapse isOpen={this.state.scenarioSet === 2} style={{textAlign: "center"}}>
            Hover on city part for statistics
          </Collapse>
          <Button size={"sm"} className={"GetLocation"} color={"primary"} onClick={this.getMyLocation}>Get my location</Button>
        </aside>
        <Map center={position} zoom={this.state.zoom}>
          <MapboxLayer
            accessToken={"pk.eyJ1IjoibW5hZ3kxMTIiLCJhIjoiY2pwNnB1c2dtMDk1azNxczJrdmFseTdzYyJ9.AAcAAqWnr1aWXSQlqhO3qQ"}
            style="mapbox://styles/mnagy112/cjp6pvcan0qgs2rurymwp5n7o"
          />
          <TileLayer
            attribution="&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
            url=""
          />
          {(this.state.showWays || this.state.scenarioSet !== 0) &&
            <GeoJSON key={hash(this.state.cycleWays) + "cycleWay"} data={this.state.cycleWays} style={Home.getLineStyle}/>
          }
          {(this.state.showStations || this.state.scenarioSet !== 0) &&
            <GeoJSON key={hash(this.state.bicycleStations) + "station"} data={this.state.bicycleStations} pointToLayer={this.pointToLayer}/>
          }
          {this.state.useDistanceFromMe &&
            <Circle center={position} radius={this.state.distanceFromMe * 1000} color={"gray"}/>
          }
          <GeoJSON key={hash(this.state.administrativeBorders)} data={this.state.administrativeBorders} style={{color: "black"}} onEachFeature={this.onEachFeature} />
          <Marker position={position} draggable onDragEnd={this.changeMarkerPosition} zIndexOffset={999}>
            <Tooltip direction={"top"} permanent>Tu sa nachádzate</Tooltip>
          </Marker>
        </Map>
      </React.Fragment>
    )
  }
}