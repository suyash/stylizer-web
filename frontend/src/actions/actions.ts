import { Action } from "redux";

export const ActionTypes = {
    // tslint:disable:object-literal-sort-keys
    CHANGE_CURRENT_SECTION: 0,
    OPEN_IMAGE: 1,
    SET_MAXDIM: 2,
    SET_STYLE_WEIGHT: 3,
    SET_MULTI_STYLIZATION_DIALOG_INDEX: 4,
    SET_STYLED_IMAGE: 5,
    CLOSE_IMAGE: 6,
    SET_LOADING: 7,
    RESET_IMAGE: 8,
    SET_NETWORK_STATUS: 9,
    SET_MULTI_STYLIZATION_ON_DEVICE_PREDICTION: 10,
    SHOW_ERROR: 11,
    SET_MULTI_STYLIZATION_OFFLINE_MODEL_CACHED_STATUS: 12,
    SET_COMIXIFIED: 13,
    // tslint:enable:object-literal-sort-keys
};

export interface ChangeCurrentSectionAction extends Action<number> {
    pathname: string;
}

export interface OpenImageAction extends Action<number> {
    url: string;
}

export interface SetMaxdimAction extends Action<number> {
    maxdim: number;
}

export interface SetMultiStylizationDialogIndexAction extends Action<number> {
    index: number|null;
}

export interface SetMultiStylizationOnDevicePredictionAction extends Action<number> {
    value: boolean;
}

export interface SetMultiStylizationOfflineModelCachedStatusAction extends Action<number> {
    value: boolean;
}

export interface SetStyleWeightAction extends Action<number> {
    index: number;
    value: number;
}

export interface SetStyledImageAction extends Action<number> {
    url: string;
}

export interface SetNetworkStatusAction extends Action<number> {
    status: boolean;
}

export interface ShowErrorAction extends Action<number> {
    message: string;
}

export interface SetComixifiedAction extends Action<number> {
    value: boolean;
}
