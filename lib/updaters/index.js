const path = require('path')
const JSON_BUMP_FILES = require('../../defaults').bumpFiles
const updatersByType = {
  json: require('./types/json'),
  'plain-text': require('./types/plain-text'),
  gradle: require('./types/gradle'),
  yaml: require('./types/yaml')
}
const PLAIN_TEXT_BUMP_FILES = ['VERSION.txt', 'version.txt']

const GRADLE_BUMP_FILES = ['build.gradle']

const YAML_BUMP_FILES = ['build.yaml']

function getUpdaterByType (type) {
  const updater = updatersByType[type]
  if (!updater) {
    throw Error(`Unable to locate updater for provided type (${type}).`)
  }
  return updater
}

function getUpdaterByFilename (filename) {
  if (JSON_BUMP_FILES.includes(path.basename(filename))) {
    return getUpdaterByType('json')
  }
  if (PLAIN_TEXT_BUMP_FILES.includes(filename)) {
    return getUpdaterByType('plain-text')
  }

  if (GRADLE_BUMP_FILES.includes(path.basename(filename))) {
    return getUpdaterByType('gradle')
  }

  if (YAML_BUMP_FILES.includes(path.basename(filename))) {
    return getUpdaterByType('yaml')
  }

  throw Error(
    `Unsupported file (${filename}) provided for bumping.\n Please specify the updater \`type\` or use a custom \`updater\`.`
  )
}

function getCustomUpdater (updater) {
  if (typeof updater === 'string') {
    return require(path.resolve(process.cwd(), updater))
  }
  if (
    typeof updater.readVersion === 'function' &&
    typeof updater.writeVersion === 'function'
  ) {
    return updater
  }
  throw new Error('Updater must be a string path or an object with readVersion and writeVersion methods')
}

module.exports.resolveUpdaterObjectFromArgument = function (arg) {
  /**
   * If an Object was not provided, we assume it's the path/filename
   * of the updater.
   */
  let updater = arg
  if (typeof updater !== 'object') {
    updater = {
      filename: arg
    }
  }
  try {
    if (updater.updater) {
      updater.updater = getCustomUpdater(updater.updater)
    } else if (updater.type) {
      updater.updater = getUpdaterByType(updater.type)
    } else {
      updater.updater = getUpdaterByFilename(updater.filename)
    }
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn(err.message)
  }
  /**
   * We weren't able to resolve an updater for the argument.
   */
  if (!updater.updater) {
    return false
  }

  return updater
}
