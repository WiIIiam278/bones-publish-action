import { publish } from './publish'
import { getInput, setFailed } from '@actions/core'

const getDownloads = () => {
  const downloads = []
  const distroNames = getInput('distro-names').trim().split('\n')
  const distroGroups = getInput('distro-groups').trim().split('\n')
  const distroDescs = getInput('distro-descriptions').trim().split('\n')
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
      getInput('api-url'),
      getInput('api-key'),
      getInput('project'),
      getInput('channel'),
      {
        version: getInput('version'),
        changelog: getInput('changelog'),
        timestamp: Date.now(),
        downloads: getDownloads(),
        downloadCount: 0
      },
      getInput('files').trim().split('\n')
    )
  } catch (error) {
    setFailed(error.message)
  }
}

export default {
  run
}
