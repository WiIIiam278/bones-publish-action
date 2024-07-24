const publish = require('./publish')
const core = require('@actions/core')

const getDownloads = () => {
  const downloads = []
  const distroNames = core.getInput('distro-names').trim().split('\n')
  const distroGroups = core.getInput('distro-groups').trim().split('\n')
  const distroDescs = core.getInput('distro-descriptions').trim().split('\n')
  for (let i = 0; i < distroNames.length; i++) {
    downloads.push({
      distribution: {
        name: distroNames[i].trim(),
        groupName: distroGroups[i].trim(),
        description: distroDescs[i].trim(),
        archived: false
      },
      name: '',
      md5: '',
      fileSize: 0
    })
  }
  return downloads
}

async function run() {
  try {
    await publish(
      core.getInput('api-url'),
      core.getInput('api-key'),
      core.getInput('project'),
      core.getInput('channel'),
      {
        version: core.getInput('version'),
        changelog: core.getInput('changelog'),
        timestamp: Date.now(),
        downloads: getDownloads(),
        downloadCount: 0
      },
      core.getInput('files').trim().split('\n')
    )
  } catch (error) {
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
