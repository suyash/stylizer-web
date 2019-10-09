import { createStore } from "redux";

import reducer from "../reducers/reducers";
import { StylizerState } from "../reducers/stylizer";

export interface State {
    currentSection: number;
    networkStatus: boolean;
    error: string|null;
    stylizer: StylizerState;
}

export default createStore(reducer);
