import maps from './maps.macro'
import character from './character.json'

const loadedMaps = {}
let mapID = 'map1'
let items, doors, map, finish, warps

function loadMap () {
  if (mapID in loadedMaps) {
    const mapData = loadedMaps[mapID]
    map = mapData.map
    items = mapData.items
    doors = mapData.doors
    warps = mapData.warps
    finish = mapData.finish
    return
  }

  map = maps[mapID].map
  items = []
  doors = []
  finish = null
  warps = []

  for (let y = 0; y < map.length; ++y) {
    for (let x = 0; x < map[y].length; ++x) {
      const num = map[y][x]
      if (num !== 1 && num !== 0) {
        const obj = maps[mapID].inMap[num]
        if (obj.type === 'door') doors.push({ ...obj, loc: { x, y } })
        if (obj.type === 'key') items.push({ ...obj, loc: { x, y } })
        if (obj.type === 'warp') warps.push({ ...obj, loc: { x, y } })
        if (obj.type === 'finish') finish = { loc: { x, y } }
        if (obj.type === 'start') character.loc = { x, y }
      }
    }
  }
  loadedMaps[mapID] = { doors, items, warps, finish, map }
}

function drawMap () {
  const game = document.querySelector('.game')
  game.innerHTML = ''
  for (let y = 0; y < map.length; ++y) {
    for (let x = 0; x < map[y].length; ++x) {
      const details = renderCell(x, y)
      createGameObject(game, details, x, y)
    }
  }
  // if (character.inventory) {
  //   output += `\n                    Inventory:${renderInventory()}`
  // }
}

function renderCell (x, y) {
  if (collides(character, { x, y })) return { name: 'player' } // '☺'
  if (finish && collides(finish, { x, y })) return { name: 'flag' } // '⚐'
  if (map[y][x] === 1) return { name: 'wall' } // '█'
  for (const item of items) {
    if (collides(item, { x, y })) return { name: 'key', color: item.color } // colorize(item, '?')
  }
  for (const door of doors) {
    if (collides(door, { x, y })) return { name: 'door', color: door.color } // colorize(door, '*')
  }
  for (const warp of warps) {
    if (collides(warp, { x, y })) return { name: 'warp', color: warp.color } // colorize(warp, '⚘')
  }
  return { name: 'floor' } // ' '
}

function createGameObject (game, { name, color }, x, y) {
  const div = document.createElement('div')
  div.classList.add(name)
  div.style.backgroundColor = color
  div.style.top = `${y * 40}px`
  div.style.left = `${x * 40}px`
  game.appendChild(div)
}

function renderInventory () {
  if (!character.inventory) return ''
  return colorize(character.inventory, '?')
}

function collides (obj, { x, y }) {
  return obj.loc.x === x && obj.loc.y === y
}

function tick ({ x = 0, y = 0 }) {
  const newLoc = { x: character.loc.x + x, y: character.loc.y + y }
  if (map[newLoc.y][newLoc.x] === 1) return
  if (newLoc.y >= map.length || newLoc.x >= map[0].length) return

  const doorIndex = doors.findIndex(door => collides(door, newLoc))
  if (doorIndex !== -1) {
    const door = doors[doorIndex]
    if (character.inventory?.color === door.color) {
      character.inventory = null
      doors.splice(doorIndex, 1)
    } else {
      return
    }
  }

  const warp = warps.find(warp => collides(warp, newLoc))
  if (warp) {
    mapID = warp.to
    loadMap()

    const goto = warps.find(warp2 => warp2.num === warp.correlation)
    character.loc = { x: goto.loc.x + x, y: goto.loc.y + y }

    drawMap()
    return
  }

  if (finish && collides(finish, newLoc)) {
    character.loc = newLoc
    drawMap()
    console.log('\n\n\n                    YOU WIN!!!!!!\n\n\n')
    process.exit()
  }

  const itemIndex = items.findIndex(item => collides(item, newLoc))
  if (itemIndex !== -1) {
    const [item] = items.splice(itemIndex, 1)
    if (character.inventory) {
      items.push({ ...character.inventory, loc: newLoc })
    }
    character.inventory = item
  }

  character.loc = { ...newLoc }
  drawMap()
}

// eslint-disable-next-line
function testMap () {
  const solution = maps[mapID].solution.split('')
  let i = 0
  const intervalID = setInterval(() => {
    const instruction = solution[i]

    if (instruction === 'r') tick({ x: 1 })
    if (instruction === 'l') tick({ x: -1 })
    if (instruction === 'u') tick({ y: -1 })
    if (instruction === 'd') tick({ y: 1 })

    i++
    if (solution.length === i) clearInterval(intervalID)
  }, 20)
}

document.addEventListener('keydown', e => {
  if (e.key === 'w') tick({ y: -1 })
  if (e.key === 's') tick({ y: 1 })
  if (e.key === 'a') tick({ x: -1 })
  if (e.key === 'd') tick({ x: 1 })
  if (e.key === 'ArrowUp') tick({ y: -1 })
  if (e.key === 'ArrowDown') tick({ y: 1 })
  if (e.key === 'ArrowLeft') tick({ x: -1 })
  if (e.key === 'ArrowRight') tick({ x: 1 })
})

loadMap()
drawMap()
// testMap()
