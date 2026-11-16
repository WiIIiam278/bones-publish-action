const { readFileSync, statSync } = require('fs')
const FormData = require('form-data')
const fetch = require('node-fetch')
const core = require('@actions/core')
const glob = require('@actions/glob')

// Cloudflare max upload size is 100MB on Free and Pro plans
const MAX_BATCH_SIZE = 99 * 1000 * 1000

const getFormData = (version, files) => {
  const form = new FormData()
  form.append('version', JSON.stringify(version), {
    contentType: 'application/json'
  })
  for (const file of files) {
    form.append('files', readFileSync(file), {
      contentType: 'application/octet-stream',
      filename: file.split('/').pop()
    })
  }
  return form
}

const getDownloadsFormData = (downloads, files) => {
  const form = new FormData()
  form.append('downloads', JSON.stringify(downloads), {
    contentType: 'application/json'
  })
  for (const file of files) {
    form.append('files', readFileSync(file), {
      contentType: 'application/octet-stream',
      filename: file.split('/').pop()
    })
  }
  return form
}

const getFileForGlob = async fileGlob => {
  const globber = await glob.create(fileGlob.trim())
  const files = await globber.glob()
  if (files.length === 0) {
    throw new Error(`No files found for glob: ${fileGlob}`)
  }
  return files[0]
}

const getAllFilesForGlobs = async fileGlobs => {
  const files = []
  for (const fileGlob of fileGlobs) {
    files.push(await getFileForGlob(fileGlob))
  }
  return files
}

const getBatches = (downloads, files) => {
  const batches = [{ downloads: [], files: [], size: 0 }]
  for (let i = 0; i < files.length; i++) {
    const size = statSync(files[i]).size
    let batch = batches[batches.length - 1]
    if (batch.files.length > 0 && batch.size + size > MAX_BATCH_SIZE) {
      batch = { downloads: [], files: [], size: 0 }
      batches.push(batch)
    }
    batch.downloads.push(downloads[i])
    batch.files.push(files[i])
    batch.size += size
  }
  return batches
}

async function publish(apiUrl, apiKey, project, channel, version, fileGlobs) {
  const files = await getAllFilesForGlobs(fileGlobs)
  for (let i = 0; i < files.length; i++) {
    version.downloads[i].name = files[i].split('/').pop()
  }

  const [first, ...rest] = getBatches(version.downloads, files)
  const data = getFormData(
    { ...version, downloads: first.downloads },
    first.files
  )
  core.notice(`Publishing ${version.name} with ${files.length} files...`)
  const response = await fetch(
    `${apiUrl}/v1/projects/${project}/channels/${channel}/versions/api`,
    {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey
      },
      body: data
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to publish version: ${response.statusText}`)
  }

  for (const batch of rest) {
    const batchData = getDownloadsFormData(batch.downloads, batch.files)
    const batchResponse = await fetch(
      `${apiUrl}/v1/projects/${project}/channels/${channel}/versions/${version.name}/api`,
      {
        method: 'PUT',
        headers: {
          'X-Api-Key': apiKey
        },
        body: batchData
      }
    )

    if (!batchResponse.ok) {
      throw new Error(`Failed to add files: ${batchResponse.statusText}`)
    }
  }
  core.notice(`Published version ${version.name}!`)
}

module.exports = {
  publish
}
