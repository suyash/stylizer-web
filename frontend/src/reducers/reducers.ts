import { combineReducers, Reducer } from "redux";

import { ActionTypes, ChangeCurrentSectionAction, SetNetworkStatusAction, ShowErrorAction } from "../actions/actions";
import stylizer from "./stylizer";

const sectionFromPathname = (pathname: string): number => {
    switch (pathname) {
    case "/about":
        return 2;
    case "/settings":
        return 1;
    default:
        return 0;
    }
};

const currentSection: Reducer<number, ChangeCurrentSectionAction> = (state, action) => {
    switch (action.type) {
    case ActionTypes.CHANGE_CURRENT_SECTION:
        return sectionFromPathname(action.pathname);
    default:
        return state || 0;
    }
};

const networkStatus: Reducer<boolean, SetNetworkStatusAction> = (state, action) => {
    switch (action.type) {
    case ActionTypes.SET_NETWORK_STATUS:
        return action.status;
    default:
        return state || navigator.onLine;
    }
};

const error: Reducer<string|null, ShowErrorAction> = (state, action) => {
    switch (action.type) {
    case ActionTypes.SHOW_ERROR:
        return action.message;
    default:
        return state || null;
    }
};

export default combineReducers({
    currentSection,
    error,
    networkStatus,
    stylizer,
});
