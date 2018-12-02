import Backend from './Backend';
import {
  CLEAR_LOADING, RECEIVE_AREAS,
  RECEIVE_BIKE_STATIONS,
  RECEIVE_BIKE_STATIONS_AND_CYCLE_WAYS, RECEIVE_CYCLE_WAYS, RESET_AREAS,
  RESET_STATIONS, RESET_WAYS,
  START_LOADING
} from "../_constants";

let AppCreator = {

  fetchStationsData(lat, lon, slovnaftBajk, whiteBikes, distance) {

    return (dispatch) => {

      dispatch({type: START_LOADING});

      Backend.requestStationsData(lat, lon, slovnaftBajk, whiteBikes, distance)
        .then(function(response) {
          dispatch({type: RECEIVE_BIKE_STATIONS, data: response});
        }, function(error) {
          dispatch({type: CLEAR_LOADING});
          alert(`Server response error (${error.message})`)
        });
    };
  },

  fetchWaysData(lat, lon, distance) {

    return (dispatch) => {

      dispatch({type: START_LOADING});

      Backend.requestWaysData(lat, lon, distance)
        .then(function(response) {
          dispatch({type: RECEIVE_CYCLE_WAYS, data: response});
        }, function(error) {
          dispatch({type: CLEAR_LOADING});
          alert(`Server response error (${error.message})`)
        });
    };
  },

  fetchStationsAndWaysInsideArea(areaId) {

    return (dispatch) => {

      dispatch({type: START_LOADING});

      Backend.requestStationsAndWaysInsideArea(areaId)
        .then(function(response) {
          dispatch({type: RECEIVE_BIKE_STATIONS_AND_CYCLE_WAYS, data: response});
        }, function(error) {
          dispatch({type: CLEAR_LOADING});
          alert(`Server response error (${error.message})`)
        });
    };
  },

  fetchWaysNearStation(stationId) {

    return (dispatch) => {

      dispatch({type: START_LOADING});

      Backend.requestWaysNearStation(stationId)
        .then(function(response) {
          dispatch({type: RECEIVE_CYCLE_WAYS, data: response});
        }, function(error) {
          dispatch({type: CLEAR_LOADING});
          alert(`Server response error (${error.message})`)
        });
    };
  },

  fetchAdministrativeBorders() {

    return (dispatch) => {

      dispatch({type: START_LOADING});

      Backend.requestAdministrativeBorders()
        .then(function(response) {
          dispatch({type: RECEIVE_AREAS, data: response});
        }, function(error) {
          dispatch({type: CLEAR_LOADING});
          alert(`Server response error (${error.message})`)
        });
    };
  },

  fetchStatisticsInArea() {

    return (dispatch) => {

      dispatch({type: START_LOADING});

      Backend.requestStatisticsInArea()
        .then(function(response) {
          dispatch({type: RECEIVE_AREAS, data: response});
        }, function(error) {
          dispatch({type: CLEAR_LOADING});
          alert(`Server response error (${error.message})`)
        });
    };
  },

  resetLoadedData(stations, ways, areas) {

    return (dispatch) => {

      if(stations)
        dispatch({type: RESET_STATIONS});
      
      if(ways)
        dispatch({type: RESET_WAYS});
      
      if(areas)
        dispatch({type: RESET_AREAS});
    };
  }
};

export default AppCreator;
