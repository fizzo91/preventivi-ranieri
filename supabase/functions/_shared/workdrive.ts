export interface WorkDriveFolder {
  id: string
  name: string
  permalink: string | null
  created: boolean
}

const resourceId = (payload: Record<string, unknown>): string | null => {
  const data = payload.data as Record<string, unknown> | Record<string, unknown>[] | undefined
  if (Array.isArray(data)) return data[0]?.id ? String(data[0].id) : null
  if (data?.id) return String(data.id)
  return payload.resourceId ? String(payload.resourceId) : null
}

async function workdriveRequest(apiDomain: string, token: string, path: string, init?: RequestInit) {
  const response = await fetch(`${apiDomain}/workdrive/api/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      Accept: "application/vnd.api+json",
      ...init?.headers,
    },
  })
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>
  if (!response.ok) throw new Error(`WorkDrive request failed (${response.status}): ${JSON.stringify(payload).slice(0, 400)}`)
  return payload
}

async function findChildFolder(apiDomain: string, token: string, parentId: string, name: string): Promise<WorkDriveFolder | null> {
  for (let offset = 0; offset < 1000; offset += 50) {
    const query = new URLSearchParams({
      "page[limit]": "50",
      "page[offset]": String(offset),
      "filter[type]": "folder",
      "fields[files]": "name,type,permalink,parent_id",
    })
    const payload = await workdriveRequest(apiDomain, token, `/files/${encodeURIComponent(parentId)}/files?${query}`)
    const files = Array.isArray(payload.data) ? payload.data as Record<string, unknown>[] : []
    const match = files.find((file) => {
      const attributes = file.attributes as Record<string, unknown> | undefined
      return attributes?.name === name && (attributes?.is_folder === true || attributes?.type === "folder")
    })
    if (match) {
      const attributes = match.attributes as Record<string, unknown> | undefined
      return { id: String(match.id), name, permalink: typeof attributes?.permalink === "string" ? attributes.permalink : null, created: false }
    }
    if (files.length < 50) return null
  }
  throw new Error("WorkDrive folder listing exceeded 1000 children")
}

export async function ensureWorkDriveFolder(input: {
  apiDomain: string
  token: string
  parentId: string
  name: string
}): Promise<WorkDriveFolder> {
  const existing = await findChildFolder(input.apiDomain, input.token, input.parentId, input.name)
  if (existing) return existing
  const payload = await workdriveRequest(input.apiDomain, input.token, "/files", {
    method: "POST",
    headers: { "Content-Type": "application/vnd.api+json" },
    body: JSON.stringify({ data: { attributes: { parent_id: input.parentId, name: input.name }, type: "files" } }),
  })
  const id = resourceId(payload)
  if (!id) throw new Error("WorkDrive create-folder response did not include a resource ID")
  const data = (payload.data && !Array.isArray(payload.data) ? payload.data : {}) as Record<string, unknown>
  const attributes = data.attributes as Record<string, unknown> | undefined
  return {
    id,
    name: input.name,
    permalink: typeof attributes?.permalink === "string" ? attributes.permalink : null,
    created: true,
  }
}

export async function ensureProjectWorkDrive(input: {
  apiDomain: string
  token: string
  parentId: string
  projectFolderName: string
}) {
  const project = await ensureWorkDriveFolder({ ...input, name: input.projectFolderName })
  const children = await Promise.all(["CAD", "PDF", "REPORT"].map((name) => ensureWorkDriveFolder({
    apiDomain: input.apiDomain,
    token: input.token,
    parentId: project.id,
    name,
  })))
  return { project, folders: Object.fromEntries(children.map((folder) => [folder.name, folder])) }
}
