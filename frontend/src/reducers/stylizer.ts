import { Action, combineReducers, Reducer } from "redux";

import {
    ActionTypes,
    OpenImageAction,
    SetComixifiedAction,
    SetMaxdimAction,
    SetMultiStylizationDialogIndexAction,
    SetMultiStylizationOfflineModelCachedStatusAction,
    SetMultiStylizationOnDevicePredictionAction,
    SetStyledImageAction,
    SetStyleWeightAction,
} from "../actions/actions";

export interface MultiStylizerState {
    weights: number[];
    dialog_index: number|null;
    on_device_prediction: boolean;
    offline_model_cached: boolean;
}

export interface StylizerState {
    base_image: string|null;
    image: string|null;
    maxdim: number;
    is_styled: boolean;
    is_loading: boolean;
    multi_style: MultiStylizerState;
    comixified: boolean;
}

const baseImage: Reducer<string|null, OpenImageAction> = (state, action) => {
    switch (action.type) {
    case ActionTypes.OPEN_IMAGE:
        return action.url;
    case ActionTypes.CLOSE_IMAGE:
        return null;
    default:
        return state || null;
    }
};

const image: Reducer<string|null, OpenImageAction|SetStyledImageAction> = (state, action) => {
    switch (action.type) {
    case ActionTypes.OPEN_IMAGE:
        return action.url;
    case ActionTypes.SET_STYLED_IMAGE:
        return action.url;
    case ActionTypes.CLOSE_IMAGE:
        return null;
    case ActionTypes.RESET_IMAGE:
        return action.url;
    default:
        return state || null;
    }
};

const maxdim: Reducer<number, SetMaxdimAction> = (state, action) => {
    switch (action.type) {
    case ActionTypes.SET_MAXDIM:
        return action.maxdim;
    default:
        return state || 512;
    }
};

const isStyled: Reducer<boolean, SetStyledImageAction> = (state, action) => {
    switch (action.type) {
    case ActionTypes.SET_STYLED_IMAGE:
        return true;
    case ActionTypes.RESET_IMAGE:
    case ActionTypes.CLOSE_IMAGE:
        return false;
    default:
        return state || false;
    }
};

const isLoading: Reducer<boolean, Action<any>> = (state, action) => {
    switch (action.type) {
    case ActionTypes.SET_LOADING:
        return true;
    case ActionTypes.SET_STYLED_IMAGE:
    case ActionTypes.CLOSE_IMAGE:
    case ActionTypes.SHOW_ERROR:
        return false;
    default:
        return state || false;
    }
};

const comixified: Reducer<boolean, SetComixifiedAction> = (state, action) => {
    switch (action.type) {
    case ActionTypes.SET_COMIXIFIED:
        return action.value;
    case ActionTypes.SET_STYLE_WEIGHT:
    case ActionTypes.SHOW_ERROR:
        return false;
    default:
        return state || false;
    }
};

const multiStyle: Reducer<
    MultiStylizerState,
    SetStyleWeightAction
    | SetMultiStylizationDialogIndexAction
    | SetMultiStylizationOnDevicePredictionAction
    | SetMultiStylizationOfflineModelCachedStatusAction
> = (state, action) => {
    switch (action.type) {
    case ActionTypes.SET_STYLE_WEIGHT:
        const act = action as SetStyleWeightAction;
        const weights = state ? state.weights : Array.from({ length: 16 }).map(() => 0);
        weights[act.index] = act.value;
        return {
            ...state,
            dialog_index: null,
            weights,
        } as MultiStylizerState;
    case ActionTypes.SET_MULTI_STYLIZATION_DIALOG_INDEX:
        return {
            ...state,
            dialog_index: (action as SetMultiStylizationDialogIndexAction).index,
            weights: state ? state.weights : Array.from({ length: 16 }).map(() => 0),
        } as MultiStylizerState;
    case ActionTypes.SET_MULTI_STYLIZATION_ON_DEVICE_PREDICTION:
        return {
            ...state,
            on_device_prediction: (action as SetMultiStylizationOnDevicePredictionAction).value,
        } as MultiStylizerState;
    case ActionTypes.SET_MULTI_STYLIZATION_OFFLINE_MODEL_CACHED_STATUS:
        return {
            ...state,
            offline_model_cached: (action as SetMultiStylizationOfflineModelCachedStatusAction).value,
        } as MultiStylizerState;
    case ActionTypes.SET_COMIXIFIED:
    case ActionTypes.CLOSE_IMAGE:
    case ActionTypes.RESET_IMAGE:
    case ActionTypes.SHOW_ERROR:
        return {
            ...state,
            dialog_index: null,
            weights: Array.from({ length: 16 }).map(() => 0),
        } as MultiStylizerState;
    default:
        return state ? state : {
            dialog_index: null,
            offline_model_cached: false,
            on_device_prediction: false,
            weights: Array.from({ length: 16 }).map(() => 0),
        };
    }
};

export default combineReducers({
    base_image: baseImage,
    comixified,
    image,
    is_loading: isLoading,
    is_styled: isStyled,
    maxdim,
    multi_style: multiStyle,
});
