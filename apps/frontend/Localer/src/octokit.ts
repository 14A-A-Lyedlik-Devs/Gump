import { Octokit } from '@octokit/core'
import { Base64 } from 'js-base64'
import type { OctokitResponse } from '@octokit/types'

const OWNER = import.meta.env.VITE_OWNER
const REPO = import.meta.env.VITE_REPO

const octokit = new Octokit({
  auth: import.meta.env.VITE_GITHUB_TOKEN
})

/**
 * Gets the latest commit for a given branch. Useful to get the sha of the latest commit.
 * @async
 * @param { string } branchName - The name of the branch to get the latest commit for. This is the username.
 * @returns { Promise<{ response: OctokitResponse<any> | undefined; status: number; error?: any }> } The latest commit for the given branch.
 */
export const getLatestCommit = async (
  branchName: string
): Promise<{ response: OctokitResponse<any> | undefined; status: number; error?: any }> => {
  try {
    const response = await octokit.request('GET /repos/{owner}/{repo}/commits/{ref}', {
      owner: OWNER,
      repo: REPO,
      ref: branchName
    })
    console.log('GET latest commit:', response.status)
    return { response, status: response.status }
  } catch (error: any) {
    console.log('GET latest commit error:', error.status)
    console.log('GET latest commit error:', error)
    return { response: undefined, status: error.status, error }
  }
}

/**
 * Gets the pull request for a given branch.
 * @async
 * @param { string } branchName - The name of the branch to get the pull request for. This is the username.
 * @returns { Promise<{ response: any | undefined; status: number; error?: any }> } The pull request for the given branch.
 * @throws { Error } If the pull request does not exist.
 */
export const getPullRequest = async (
  branchName: string
): Promise<{ response: any | undefined; status: number; error?: any }> => {
  try {
    const response = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
      owner: OWNER,
      repo: REPO,
      head: `${OWNER}:${branchName}`
    })
    if (response.data.length !== 0) {
      console.log('GET pull request:', response.status)
      console.log('GET pull request number:', response.data[0].number)
      console.log('GET pull request title:', response.data[0].title)
      console.log('GET pull request html_url:', response.data[0].html_url)
    }
    return { response: response.data[0], status: response.status }
  } catch (error: any) {
    console.log('GET pull request error:', error.status)
    console.log('GET pull request error:', error)
    return { response: undefined, status: error.status, error }
  }
}

/**
 * Gets the content for a given file.
 * @async
 * @param { string } branchName - The name of the branch to get the content for. This is the username.
 * @param { string } fileName - The name of the file to get the content for. This is the locale.
 * @returns { Promise<{ response: OctokitResponse<any> | undefined; status: number; error?: any }> } The content for the given file or undefined if the file or branch does not exist.
 */
export const getContent = async (
  branchName: string,
  fileName: string
): Promise<{ response: OctokitResponse<any> | undefined; status: number; error?: any }> => {
  try {
    const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner: OWNER,
      repo: REPO,
      path: `locales/${fileName}.json`,
      ref: branchName
    })
    console.log('GET content:', response.status)
    return { response, status: response.status }
  } catch (error: any) {
    console.log('GET content error:', error.status)
    console.log('GET content error:', error)
    return { response: undefined, status: error.status, error }
  }
}

/**
 * Gets the sha for a given branch.
 * @async
 * @param { string } [ branchName=main ] - The name of the branch to get the sha for. This is the username. Defaults to main.
 * @returns { Promise<{ sha: string | undefined; status: number; error?: any }> } The response from the get branch request and the sha of the branch.
 */
export const getBranch = async (
  branchName?: string
): Promise<{ sha: string | undefined; status: number; error?: any }> => {
  try {
    if (!branchName) {
      branchName = 'main'
    }
    const response = await octokit.request('GET /repos/{owner}/{repo}/git/ref/heads/{ref}', {
      owner: OWNER,
      repo: REPO,
      ref: branchName
    })
    console.log(`GET ${branchName} branch:`, response.status)
    console.log(`GET ${branchName} branch sha:`, response.data.object.sha)
    return { sha: response.data.object.sha, status: response.status }
  } catch (error: any) {
    console.log(`GET ${branchName} branch error:`, error.status)
    console.log(`GET ${branchName} branch error:`, error)
    return { sha: undefined, status: error.status, error }
  }
}

/**
 * Tries to get a branch, if it exists it returns the branch, if it does not exist it creates the branch.
 * @async
 * @param { string } branchName - The name of the branch to create. This is the username.
 * @param { string } sha - The sha of the commit to create the branch from.
 * @returns { Promise<{ branchName: string | undefined; status: number; error?: any }> } The response from the get branch request or the create branch request or undefined.
 */
export const CreateBranch = async (
  branchName: string,
  sha: string
): Promise<{ branchName: string | undefined; status: number; error?: any }> => {
  const { status, error } = await getBranch(branchName)
  if (status === 200) {
    return { branchName, status, error }
  } else {
    try {
      const response = await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
        owner: OWNER,
        repo: REPO,
        ref: `refs/heads/${branchName}`,
        sha: sha
      })
      console.log('CREATE branch:', response.status)
      return { branchName, status: response.status }
    } catch (error: any) {
      console.log('CREATE branch error:', error.status)
      console.log('CREATE branch error:', error)
      return { branchName: undefined, status: error.status, error }
    }
  }
}

/**
 * Creates or updates a file.
 * @async
 * @param { string } branchName - The name of the branch to create the file on. This is the username.
 * @param { string } fileName - The name of the file to create. This is the locale.
 * @param { string } content - The content of the file to create.
 * @param { string } [ sha ] - The sha of the file to update. This is optional.
 * @returns { Promise<OctokitResponse<any> | undefined> } The response from the create or update file request or undefined.
 */
export const createOrUpdateFile = async (
  branchName: string,
  fileName: string,
  content: string,
  sha?: string
): Promise<{ status: number; error?: any }> => {
  try {
    const response = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
      owner: OWNER,
      repo: REPO,
      path: `locales/${fileName}.json`,
      message: `${branchName} changed ${fileName}.json`,
      content: Base64.encode(content),
      branch: branchName,
      sha: sha
    })
    if (sha) {
      console.log('UPDATE file:', response.status)
    } else {
      console.log('CREATE file:', response.status)
    }
    return { status: response.status }
  } catch (error: any) {
    console.log('CREATE/UPDATE file error:', error.status)
    console.log('CREATE/UPDATE file error:', error)
    return { status: error.status, error }
  }
}

/**
 * Loops through the file names and contents and creates or updates the files.
 * @async
 * @param { string } branchName - The name of the branch to create the files on. This is the username.
 * @param { string[] } fileNames - The names of the files to create. These are the locales.
 * @param { string[] } contents - The new contents of the files to create.
 * @returns { Promise<{ status: number; error?: any }> } The response from the create or update file request or undefined.
 */
export const createFilesAndCommit = async (
  branchName: string,
  fileNames: string[],
  contents: string[]
): Promise<{ status: number; error?: any }> => {
  try {
    for (let i = 0; i < fileNames.length; i++) {
      const fileName = fileNames[i]
      const content = contents[i]
      // if there is a commit, get the latest commit and update the file
      const { response: getLatestCommitResponse } = await getLatestCommit(branchName)
      const mainSha = await getBranch()
      
      if (getLatestCommitResponse?.data.sha !== mainSha.sha) {
        const updateResponse = await createOrUpdateFile(
          branchName,
          fileName,
          content,
          getLatestCommitResponse?.data.sha
        )

        console.log('UPDATE latest commit:', updateResponse?.status)
        return { status: updateResponse?.status }
      } else {
        // no commit, get file sha and update file
        const { response: getContentResponse } = await getContent(branchName, fileName)

        const updateResponse = await createOrUpdateFile(
          branchName,
          fileName,
          content,
          getContentResponse?.data.sha
        )

        console.log('CREATE latest commit:', updateResponse?.status)
        return { status: updateResponse?.status }
      }
    }
  } catch (error: any) {
    console.log('CREATE/UPDATE files error:', error.status)
    console.log('CREATE/UPDATE files error:', error)
    return { status: error.status, error }
  }
  return { status: 200 }
}

/**
 * Creates a pull request.
 * @async
 * @param { string } branchName - The name of the branch to create the pull request from. This is the username.
 * @returns { Promise<> } The response from the create pull request request or undefined.
 */
export const createPullRequest = async (
  branchName: string
): Promise<{
  prNumber?: number
  prUrl?: string
  status: number
  error?: any
}> => {
  const { response, status } = await getPullRequest(branchName)
  if (response) {
    console.log('PULL request already exists:', status)
    return { prNumber: response?.number, prUrl: response?.html_url, status }
  } else {
    try {
      const response = await octokit.request('POST /repos/{owner}/{repo}/pulls', {
        owner: OWNER,
        repo: REPO,
        title: `[Translate] ${branchName}`,
        head: branchName,
        base: 'main'
      })
      console.log('CREATE pull request:', response.status)
      return {
        prNumber: response.data.number,
        prUrl: response.data.html_url,
        status: response.status
      }
    } catch (error: any) {
      console.log('CREATE pull request error:', error.status)
      console.log('CREATE pull request error:', error.message)
      return { status: error.status, error }
    }
  }
}

export const createPullRequestFromContent = async (
  branchName: string,
  fileName: string[],
  content: string[]
) => {
  const { sha } = await getBranch()
  await CreateBranch(branchName, sha!)
  await createFilesAndCommit(branchName, fileName, content)
  await createPullRequest(branchName)
}
