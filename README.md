<h1 align="center">⛰️ hax-climb</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-0.1.0-blue.svg?cacheSeconds=2592000" />
  <img src="https://img.shields.io/badge/npm-%3E%3D8.6.0-blue.svg" />
  <img src="https://img.shields.io/badge/node-%3E%3D16.0.0-blue.svg" />
  <a href="https://github.com/jakjus/hax-climb#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/jakjus/hax-climb/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/jakjus/hax-climb/blob/master/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/github/license/jakjus/hax-climb" />
  </a>
</p>

> Haxball Room Script for Climbing Mod (map and gameplay by Winky)

![Preview](./preview.png)

### 🏠 [Homepage](https://github.com/jakjus/hax-climb#readme)

## Prerequisites

- npm >=8.6.0
- node >=16.0.0

## Install

```sh
npm install
```

## Usage

Insert **token** from https://haxball.com/headlesstoken into `run.ts`.

```ts
// run.ts

import HaxballJS from "haxball.js";
import roomBuilder from "./index";

HaxballJS.then(HBInit => roomBuilder(HBInit, {
    roomName: "HaxClimb v0.1.0",
    token: "thr1.AAAAAINSERTYOURTOKEN",
    // You may define below variables
    // geo: { code: "PL", lat: 50.1, lon: 15.5 },
    // password: "YOUR_PASSWORD",
}))
```

Run Server:
```sh
npm start
```

## Features
- [x] Winky's Climbing Challenge map
- [x] Checkpoint system
- [x] Timer
- [x] Leaderboards
- [x] SQLite database (persistent stats)
- [ ] Multiple maps with separate leaderboards
- [ ] Multiple databases

## Author

👤 **Jakub Juszko**

* Website: https://jakjus.com
* Github: [@jakjus](https://github.com/jakjus)
* LinkedIn: [@jakubjuszko](https://linkedin.com/in/jakubjuszko)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/jakjus/hax-climb/issues). 

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2022 [Jakub Juszko](https://github.com/jakjus).<br />
This project is [MIT](https://github.com/jakjus/hax-climb/blob/master/LICENSE) licensed.

***
