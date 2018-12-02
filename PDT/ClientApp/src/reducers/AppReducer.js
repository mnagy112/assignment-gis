import {
  CLEAR_LOADING, RECEIVE_AREAS,
  RECEIVE_BIKE_STATIONS,
  RECEIVE_BIKE_STATIONS_AND_CYCLE_WAYS, RECEIVE_CYCLE_WAYS, RESET_AREAS,
  RESET_STATIONS, RESET_WAYS,
  START_LOADING
} from "../_constants";

let defaultState = {
  loading: 0,
  bicycleStations: [],
  cycleWays: [],
  areas: []
};

const AppReducer = (state = defaultState, action) => {

  switch (action.type) {

    case START_LOADING:
      return {
        ...state,
        loading: state.loading + 1
      };
      
    case CLEAR_LOADING:
      return {
        ...state,
        loading: state.loading + 1
      };
      
    case RECEIVE_BIKE_STATIONS:
      return {
        ...state,
        loading: state.loading - 1,
        bicycleStations: action.data
      };
      
    case RECEIVE_CYCLE_WAYS:
      return {
        ...state,
        loading: state.loading - 1,
        cycleWays: action.data
      };
      
    case RECEIVE_AREAS:
      return {
        ...state,
        loading: state.loading - 1,
        areas: action.data
      };
    
    case RECEIVE_BIKE_STATIONS_AND_CYCLE_WAYS:
      return {
        ...state,
        loading: state.loading - 1,
        bicycleStations: action.data.stations,
        cycleWays: action.data.ways,
      };

    case RESET_STATIONS:
      return {
        ...state,
        bicycleStations: []
      };

    case RESET_WAYS:
      return {
        ...state,
        cycleWays: []
      };

    case RESET_AREAS:
      return {
        ...state,
        areas: []
      };
    
    default:
      return state
  }
};

export default AppReducer;