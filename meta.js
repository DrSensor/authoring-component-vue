const path = require('path')
const fs = require('fs')
const {
  sortDependencies,
  installDependencies,
  runLintFix,
  toPascalCase,
  printMessage
} = require('./utils')
const pkg = require('./package.json')

const templateVersion = pkg.version

module.exports = {
  helpers: {
    if_or (v1, v2, options) {
      if (v1 || v2) {
        return options.fn(this)
      }
      return options.inverse(this)
    },
    pascalCase: text => toPascalCase(text),
    isEnabled (list, check, options) {
      if (list[check]) return options.fn(this)
      else return options.inverse(this)
    },
    template_version () {
      return templateVersion
    }
  },

  prompts: {
    name: {
      type: 'string',
      required: true,
      message: 'Project name'
    },
    description: {
      type: 'string',
      required: false,
      message: 'Project description',
      default: 'A Vue.js project'
    },
    author: {
      type: 'string',
      message: 'Author'
    },
    addons: {
      type: 'checkbox',
      message:
        'Select which storybook-addon you want to add',
      choices: [
        'knobs',
        'notes',
        'info',
        'readme',
        'console'
      ],
      default: [
        'knobs',
        'notes',
        'readme'
      ]
    },
    customBlocks: {
      type: 'confirm',
      // when: 'addons',
      message: 'Enable custom-blocks?'
    },
    useci: {
      type: 'confirm',
      message: 'Add circleci for Continuos Build?'
    },
    ci: {
      type: 'checkbox',
      when: 'useci',
      message:
        'Configure circleci for Continuos Deployment',
      choices: [
        {
          name: 'Publish to NPM',
          value: 'publish',
          short: 'npm'
        },
        {
          name: 'Deploy storybook to surge.sh',
          value: 'deploy',
          short: 'surge'
        }
      ],
      default: [
        'publish',
        'deploy'
      ]
    },
    alphabetical: {
      type: 'confirm',
      message: 'Sort story and scenario in alphabetical order?'
    },
    autoInstall: {
      type: 'list',
      message:
        'Should we run `npm install` for you after the project has been created? (recommended)',
      choices: [
        {
          name: 'Yes, use NPM',
          value: 'npm',
          short: 'npm'
        },
        {
          name: 'Yes, use Yarn',
          value: 'yarn',
          short: 'yarn'
        },
        {
          name: 'No, I will handle that myself',
          value: false,
          short: 'no'
        }
      ]
    }
  },
  filters: {
    '.circleci/*': 'useci',
    '.loader/docs-loader.js': 'addons.readme && customBlocks',
    '.loader/info-loader.js': 'addons.info && customBlocks',
    '.loader/notes-loader.js': 'addons.notes && customBlocks',
    '.loader/knobs-loader.js': 'addons.knobs && customBlocks'
  },
  complete: function (data, { chalk }) {
    const green = chalk.green

    sortDependencies(data, green)

    const cwd = path.join(process.cwd(), data.inPlace ? '' : data.destDirName)

    const src = path.join(cwd, './components/HelloWorld.vue')
    const target = path.join(cwd, `./components/${toPascalCase(data.name)}.vue`)
    fs.renameSync(src, target)

    if (data.autoInstall) {
      installDependencies(cwd, data.autoInstall, green)
        .then(() => {
          return runLintFix(cwd, data, green)
        })
        .then(() => {
          printMessage(data, green)
        })
        .catch(e => {
          console.log(chalk.red('Error:'), e)
        })
    } else {
      printMessage(data, chalk)
    }
  }
}