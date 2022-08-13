import HaxballJS from "haxball.js";
import roomBuilder from "./index";

HaxballJS.then(HBInit => roomBuilder(HBInit, {
    roomName: "🌕   HaxClimb v0.1.0 by jakjus",
    token: "thr1.AAAAAGL4MUoifVzvb6ZVmQ.V1N6cGbVm9Q",
    // You may define below variables
    // geo: { code: "PL", lat: 50.1, lon: 15.5 },
    // password: "YOUR_PASSWORD",
}))
