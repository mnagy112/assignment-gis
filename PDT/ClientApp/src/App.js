import React, { Component } from 'react';
import {Map, TileLayer, Marker, Tooltip, Circle, GeoJSON} from 'react-leaflet';
import {Button, Collapse, FormGroup, Input, Label} from 'reactstrap';
import Utils from './helpers/utils';
import hash from 'object-hash';

import 'leaflet/dist/leaflet.css';
import 'font-awesome/css/font-awesome.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import L from 'leaflet';
import MapboxLayer from "./components/MapboxLayer";
import {connect} from "react-redux";
import AppCreator from "./API/AppCreator";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('./icons/blue.png')
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
  iconUrl: require('./icons/green.png')
});

const redMarker = new LeafIcon({
  iconUrl: require('./icons/red.png')
});

const yellowMarker = new LeafIcon({
  iconUrl: require('./icons/yellow.png')
});

const greyMarker = new LeafIcon({
  iconUrl: require('./icons/darkgrey.png')
});

class App extends Component {

  constructor(...props) {
    super(...props);

    this.state = {
      lat: 48.148598,
      lon: 17.107748,
      zoom: 13,
      scenarioSet: 0,
      administrativeBorders: [],
      useDistanceFromMe: false,
      distanceFromMe: 1,
      showWays: false,
      showStations: false,
      slovnaftBajk: false,
      whiteBikes: false
    };

    this.getMyLocation = this.getMyLocation.bind(this);
    this.changeMarkerPosition = this.changeMarkerPosition.bind(this);
    this.setScenario = this.setScenario.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.pointToLayer = this.pointToLayer.bind(this);
    this.onEachFeature = this.onEachFeature.bind(this);
    this.handleOptionChange = this.handleOptionChange.bind(this);
    
    this.loadStationsData = this.loadStationsData.bind(this);
    this.loadWaysData = this.loadWaysData.bind(this);
  }

  loadWaysData (lat, lon, distance) {

    this.props.fetchWaysData(
      lat ? lat : this.state.lat,
      lon ? lon : this.state.lon,
      distance === true ? this.state.distanceFromMe : distance === false ? -1 : this.state.useDistanceFromMe ? this.state.distanceFromMe : -1
    );
  }

  loadStationsData (lat, lon, slovnaftBajk, whiteBikes, distance) {

    this.props.fetchStationsData(
      lat ? lat : this.state.lat,
      lon ? lon : this.state.lon,
      slovnaftBajk !== undefined ? slovnaftBajk : this.state.slovnaftBajk,
      whiteBikes !== undefined ? whiteBikes : this.state.whiteBikes,
      distance === true ? this.state.distanceFromMe : distance === false ? -1 : this.state.useDistanceFromMe ? this.state.distanceFromMe : -1
    );
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
    
    this.setState({
      ...this.state,
      scenarioSet: scenario
    });

    if (scenario === 1)
      this.props.fetchAdministrativeBorders();

    if (scenario === 2)
      this.props.fetchStatisticsInArea();
    
    this.props.resetLoadedData(true, true, true)
  }

  handleChange(name, e) {
    let val = e.target ? e.target.type === 'checkbox' ? e.target.checked : e.target.value : e;

    this.setState({
      ...this.state,
      [name]: val
    });

    if(name === "showStations") {
      if(val)
        this.loadStationsData();
      else
        this.props.resetLoadedData(true, false, false)
    }
    else if(name === "showWays") {
      if(val)
        this.loadWaysData();
      else
        this.props.resetLoadedData(false, true, false)
    }
    else if(name === "useDistanceFromMe") {
      
      if(this.state.showStations)
        this.loadStationsData(null, null, null, null, val);
      
      if(this.state.showWays)
        this.loadWaysData(null, null, val);
    }
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
      .bindTooltip(Utils.getBikeStationPopupStyle(station), {direction: "top"})
      .on("click", () => this.props.fetchWaysNearStation(station.Id));
  }

  onEachFeature(feature, layer) {
    layer
      .bindTooltip(this.state.scenarioSet === 1 ? feature.properties.Name : Utils.getAreaPopupStyle(feature.properties), {direction: "top"})
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
          this.props.fetchStationsAndWaysInsideArea(feature.properties.Id);
      })
  }

  render() {

    let position = [this.state.lat, this.state.lon];

    return (
      <main>
        {this.props.loadingAPI > 0 &&
          <div className={"loader"}>
            <i className={"fa fa-spinner fa-pulse fa-3x fa-fw"}/>
            <div className={"loading"}>Loading</div>
          </div>
        }
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
              Click on city part to show bicycle stations and ways in city part
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
            // eslint-disable-next-line
            style="mapbox://styles/mnagy112/cjp6pvcan0qgs2rurymwp5n7o"
          />
          
          <TileLayer
            attribution="&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
            url=""
          />
          
          <GeoJSON key={hash(this.props.cycleWays) + "cycleWay"} data={this.props.cycleWays} style={Utils.getLineStyle}/>
          <GeoJSON key={hash(this.props.bicycleStations) + "station"} data={this.props.bicycleStations} pointToLayer={this.pointToLayer}/>
          <GeoJSON key={hash(this.props.areas)} data={this.props.areas} style={{color: "black"}} onEachFeature={this.onEachFeature} />
          
          {this.state.useDistanceFromMe &&
            <Circle center={position} radius={this.state.distanceFromMe * 1000} color={"gray"}/>
          }
          
          <Marker position={position} draggable onDragEnd={this.changeMarkerPosition} zIndexOffset={999}>
            <Tooltip direction={"top"} permanent>You are here</Tooltip>
          </Marker>
        </Map>
      </main>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    loadingAPI: state.App.loading,
    bicycleStations: state.App.bicycleStations,
    cycleWays: state.App.cycleWays,
    areas: state.App.areas
  }
};

const mapDispatchToProps = (dispatch) => {
  return {
    fetchStationsData: (lat, lon, slovnaftBajk, whiteBikes, distance) => dispatch(AppCreator.fetchStationsData(lat, lon, slovnaftBajk, whiteBikes, distance)),
    fetchWaysData: (lat, lon, distance) => dispatch(AppCreator.fetchWaysData(lat, lon, distance)),
    fetchStationsAndWaysInsideArea: (areaId) => dispatch(AppCreator.fetchStationsAndWaysInsideArea(areaId)),
    fetchWaysNearStation: (stationId) => dispatch(AppCreator.fetchWaysNearStation(stationId)),
    resetLoadedData: (stations, ways, areas) => dispatch(AppCreator.resetLoadedData(stations, ways, areas)),
    fetchAdministrativeBorders: () => dispatch(AppCreator.fetchAdministrativeBorders()),
    fetchStatisticsInArea: () => dispatch(AppCreator.fetchStatisticsInArea()),
  }
};


export default connect(mapStateToProps, mapDispatchToProps)(App);
