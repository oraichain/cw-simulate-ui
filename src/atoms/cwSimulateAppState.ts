import { CWSimulateApp } from "@terran-one/cw-simulate";
import { atom } from "jotai";
import { OraichainConfig } from "../configs/constants";

const cwSimulateAppState = atom({
  app: new CWSimulateApp(OraichainConfig),
});

export default cwSimulateAppState;
