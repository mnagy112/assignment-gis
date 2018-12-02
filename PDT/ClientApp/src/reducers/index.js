import { combineReducers } from "redux";
import AppReducer from "./AppReducer";


const rootReducer = combineReducers({
  App: AppReducer
});

export default rootReducer;
