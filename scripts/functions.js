const fs = require('fs')
const ini = require('ini')
const { promisify } = require("util");
const readdir = promisify(require("fs").readdir);
module.exports = (client) => {

  client.Rnd = (min, max) => {
    return Math.floor((Math.random() * (max - min)) + min)
  }

  client.getFiles = async (dir) => {

    const cmdFiles = await readdir(dir);
    let legacy = []
    let current = []
    cmdFiles.forEach(f => {
      if (!f.startsWith("save_") && !f.startsWith("_iislandsofwarsave_")) return;
      if (f.startsWith("save_")) current.push(f)
      else legacy.push(f)
    });
    return [current, legacy]
  }

  client.readLocalFile = (file = `./readyiisland.ini`) => {
    let result
    if (fs.existsSync(file) && fs.lstatSync(file).isDirectory()) result = client.readLocalFiles(file)
    else result = client.readFile(fs.readFileSync(file, 'utf-8'))
    return result
  }

  client.readLocalFiles = (file = `./readyiisland.ini`) => {
    if (fs.existsSync(file) && !fs.lstatSync(file).isDirectory()) return
    let results = fs.readdirSync(file)
    files = []
    results.forEach(f => {
      let n = file + '\\' + f
      if (fs.lstatSync(n).isDirectory()) return
      let c = fs.readFileSync(n, 'utf-8')
      if (!c) return
      let s = client.readFile(c)
      if (!s) return
      files.push(s)
    })
    let save = {}
    files.forEach(f => {
      save = { ...save, ...f }
    })
    return save
  }

  client.readFile = (file) => {
    let result = ini.parse(file)
    return result
  }
  client.saveFile = (object) => {
    let result = ini.stringify(object)
    return result
  }

  client.finder = async (path = require('electron').remote.getGlobal('loaded').path) => {
    let files
    client = {}
    require('./functions')(client)
    files = await client.getFiles(path)
    return files

  }


  client.parse_island_5 = (file, object = true, island = false) => {
    try {
      let parsed_save = {
        "block": [],
        "attachment": [],
        "keybind": [],
      };
      let save_file
      if (!island) {
        if (!object) save_file = client.readFile(file);
        else save_file = file
      }
      let buffer
      if (!island) buffer = save_file.island.island.split(' ');
      else buffer = file
      let bufferCount = 0;
      parsed_save.coreX = buffer[bufferCount];
      bufferCount++;
      parsed_save.coreY = buffer[bufferCount];
      bufferCount++;
      parsed_save.islandWidth = buffer[bufferCount];
      bufferCount++;
      parsed_save.islandHeight = buffer[bufferCount];
      bufferCount++;
      parsed_save.islandOffsetX = buffer[bufferCount];
      bufferCount++;
      parsed_save.islandOffsetY = buffer[bufferCount];
      bufferCount++;
      for (let i = 0; i < 12; i++) {
        parsed_save.block[i] = [];
        parsed_save.attachment[i] = [];
        parsed_save.keybind[i] = [];
        for (let j = 0; j < 12; j++) {
          if (buffer[bufferCount] !== "_") {
            parsed_save.block[i][j] = buffer[bufferCount];
          };
          bufferCount++;
          if (buffer[bufferCount] !== "_") {
            parsed_save.attachment[i][j] = buffer[bufferCount];
          };
          bufferCount++;
          if (buffer[bufferCount] !== "_") {
            parsed_save.keybind[i][j] = buffer[bufferCount];
          };
          bufferCount++;
        };
      };
      return parsed_save;
    } catch (e) { console.error(e); };
  };
  client.parse_island_7 = (file, object = true, island = false) => {
    try {
      let save_file
      if (!island) {
        if (!object) save_file = client.readFile(file);
        else save_file = file
      }
      let buffer
      if (!island) buffer = save_file.island.island.split(' ');
      else buffer = file
      for (let i = 6; i < buffer.length; i += 3) {
        let val = buffer[i]
        let int = parseInt(val)
        if (int) {
          let string = ''
          for (let j = 0; j < int; j++) string += ' _ _ _'
          string = string.trim()
          buffer[i] = string
          i++
        }
      }
      buffer = buffer.join(' ').split(' ')//this resets it cause the thing takes an array and it is an improperly formatted one rn
      return client.parse_island_5(buffer, false, true)
    } catch (e) { console.error(e); };
  };
  client.parse_island = (file, object = true, island = false, version) => {
    if (version >= 7.2) return client.parse_island_7(file, object, island)
    else return client.parse_island_5(file, object, island)
  };
  client.reverse_island = (par) => {
    try {
      let rev = par.coreX + ' ' + par.coreY + ' ' + par.islandWidth + ' ' + par.islandHeight + ' ' + par.islandOffsetX + ' ' + par.islandOffsetY;
      for (let i = 0; i < 12; i++) {
        for (let j = 0; j < 12; j++) {
          rev = rev + ' ' + (par.block[i][j] ? par.block[i][j] : '_') + ' ' + (par.attachment[i][j] ? par.attachment[i][j] : '_') + ' ' + (par.keybind[i][j] ? par.keybind[i][j] : '_')
        }
      }
      return rev;
    } catch (e) { console.error(e) };
  };


  // `await client.wait(1000);` to "pause" for 1 second.
  client.wait = require("util").promisify(setTimeout);

  client.parse_inv = (inv, v) => {
    let ids = client.getIds(v)
    if (!ids) return new Error(`No Ids file found for v${v}!`)
    inv = inv.split(' ')
    inv.forEach((i, index) => {
      if (index + 1 == inv.length) return //stops the freezing idk y
      if (index % 2) return //is odd aka the number count
      let name
      let other = i.split("|")
      if (v >= 6.2) {
        name = other[1];
        while (!other[0])
          other.shift()
        other.shift()
      }
      //else name = i.split("|")[0];
      if (!name) return
      if (other.length > 6) other.forEach((i, index) => {
        if (index < 5 || !i) return
        i = i.split(':')
        if (v >= 7.4) {
          i[0] = i[0].slice(1)
          name = name.slice(1)
        }
        i[0] = ids.properties[`${i[0]}`].toLowerCase()
        other[index] = i.join(':')
      })
      inv[index] = `${ids.items[`${name}`]}|${other.join('|')}`
      return
    });
    return inv.join(' ')
  }

  client.getIds = (v) => {
    try {
      return require(`${process.env.LOCALAPPDATA}/iiow-editor/data/ids/${v}.json`)
    }
    catch (e) {
      return
    }
  }

  client.convertToIds = (items, props) => {
    items = items.split(' ')
    props = props.split(' ')
    console.log(items, props)
    let obj = { properties: {}, items: {} }
    items.forEach((a, i) => {
      obj.items[i] = a.toLowerCase()
    })
    props.forEach((a, i) => {
      obj.properties[i] = a.toLowerCase()
    })
    console.log(obj)
    return obj
  }

  client.parse_islandId = (island, v, id) => {
    let ids = client.getIds(v) || client.convertToIds(id.item, id.property)
    if (!ids && !id) return
    console.log(ids)
    for (let i = 0; i < 12; i++) {
      for (let j = 0; j < 12; j++) {
        if (island.block[i][j]) {
          let name
          let other = island.block[i][j].split("|")
          if (v >= 6.2) {
            if (v >= 7.4) other[1] = other[1].slice(1)
            name = other[1];
            while (!other[0])
              other.shift()
            other.shift()
          }
          //else name = island.block[i][j].split("|")[0];
          if (!name) return
          if (other.length > 6) other.forEach((i, index) => {
            if (index < 5 || !i) return
            i = i.split(':')
            if (v >= 7.4) i[0] = i[0].slice(1)
            i[0] = ids.properties[`${i[0]}`].toLowerCase()
            other[index] = i.join(':')
          })
          island.block[i][j] = `${ids.items[`${name}`]}|${other.join('|')}`
        }
        if (island.attachment[i][j]) {
          let name
          let other = island.attachment[i][j].split("|")
          if (v >= 6.2) {
            if (v >= 7.4) other[1] = other[1].slice(1)
            name = other[1];
            while (!other[0])
              other.shift()
            other.shift()
          }
          //else name = island.attachment[i][j].split("|")[0];
          if (!name) return
          island.attachment[i][j] = `${ids.items[`${name}`]}|${other.join('|')}`
        }
      }
    }
    return island
  }
}