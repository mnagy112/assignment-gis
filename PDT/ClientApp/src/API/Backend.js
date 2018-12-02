import 'whatwg-fetch';

const APIUrl = "api/BAjkStations";

let RealBackend = {

  requestStationsData(lat, lon, slovnaftBajk, whiteBikes, distance) {

    return fetch(`${APIUrl}/GetStations?lat=${lat}&lon=${lon}&slovnaftBAjk=${slovnaftBajk}&whiteBikes=${whiteBikes}&distance=${distance}`)
      .then(response => response.json());
  },

  requestStationsAndWaysInsideArea(areaId) {

    return fetch(`${APIUrl}/GetStationsAndWaysInsideArea?areaId=${areaId}`)
      .then(response => response.json());
  },

  requestWaysData(lat, lon, distance) {

    return fetch(`${APIUrl}/GetCycleWays?lat=${lat}&lon=${lon}&distance=${distance}`)
      .then(response => response.json());
  },

  requestWaysNearStation(stationId) {
    
    return fetch(`${APIUrl}/GetNearbyCycleWays?stationId=${stationId}`)
      .then(response => response.json());
  },

  requestAdministrativeBorders() {
    
    return fetch(`${APIUrl}/GetAdministrativeBorders`)
      .then(response => response.json());
  },

  requestStatisticsInArea() {
    
    return fetch(`${APIUrl}/GetStatisticsForAreas`)
      .then(response => response.json());
  }
  
};

export default RealBackend;
