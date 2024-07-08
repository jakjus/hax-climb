// This fills circles of a HaxClimb map.
// Instead of creating jump circles and covering it with gray and 5 radius smaller circle
// you may create only colored jump circles and let script fill it with gray ones

const fs = require('node:fs')

// CONFIGURATION BEGIN

const inputMapFilename = "map.hbs"
const outputMapFilename = "mapFilled.hbs"
const jumpCircleColors = ['f5b070', // yellow
  "70f588", // green
  "9e546d"
] //purple

const fillColor = "454C5E" // gray

// CONFIGURATION END

const fill = () => {
  const map = fs.readFileSync(inputMapFilename)
  const mapObj = JSON.parse(map)
  for (const disc of mapObj.discs) {
    if (jumpCircleColors.includes(disc.color)) {
      const grayCoverDisc = { ...disc } // shallow copy
      grayCoverDisc.radius -= 5
      grayCoverDisc.color = fillColor
      mapObj.discs.push(grayCoverDisc)
    }
  }
  const outputMapJson = JSON.stringify(mapObj)
  fs.writeFileSync(outputMapFilename, outputMapJson)
}

fill()
