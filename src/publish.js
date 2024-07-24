const { readFileSync } = require('fs')
const fetch = require('node-fetch')
const core = require('@actions/core')
const glob = require('@actions/glob')

const getFormData = (version, files) => {
  const form = new FormData()
  form.append(
    'version',
    new Blob([JSON.stringify(version)], { type: 'application/json' })
  )
  for (const file of files) {
    form.append('files', file)
  }
  return form
}

const getFileForGlob = async fileGlob => {
  const globber = await glob.create(fileGlob.trim())
  const files = await globber.glob()
  if (files.length === 0) {
    throw new Error(`No files found for glob: ${fileGlob}`)
  }
  core.notice(`Found file for glob ${fileGlob}: ${files[0]}`)

  return readFileSync(files[0])
}

const getAllFilesForGlobs = async fileGlobs => {
  const files = []
  for (const fileGlob of fileGlobs) {
    files.push(await getFileForGlob(fileGlob))
  }
  return files
}

async function publish(apiUrl, apiKey, project, channel, version, fileGlobs) {
  const files = await getAllFilesForGlobs(fileGlobs)
  for (let i = 0; i < files.length; i++) {
    version.downloads[i].name = files[i].name
  }
  core.notice(
    `Publishing version ${version.version} with ${files.length} files...`
  )

  const response = await fetch(
    `${apiUrl}/v1/projects/${project}/channels/${channel}/versions/api`,
    {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: getFormData(version, files)
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to publish version: ${response.statusText}`)
  }
  core.notice(`Published version ${version.version}!`)
}

module.exports = {
  publish
}
