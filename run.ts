import HaxballJS from "haxball.js";
import roomBuilder from "./index";

HaxballJS.then(HBInit => roomBuilder(HBInit, {
    roomName: "jajo",
    token: "thr1.AAAAAGL3mQ-NPWppevdk6w.7Lj3AYiAd-U"
}))
