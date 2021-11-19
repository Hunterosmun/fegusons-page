import fs from 'fs'

const files = fs
  .readdirSync(__dirname + '/maps')
  .map(file => file.replace('.json', ''))

export default ` ${files
  .map(file => `import ${file} from './maps/${file}.json'`)
  .join('\n')}

export default {
  ${files.join(', ')}
}
`
