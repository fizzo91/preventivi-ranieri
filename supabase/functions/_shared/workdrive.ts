const WORKDRIVE_API = "https://www.zohoapis.eu/workdrive/api/v1"
const WORKDRIVE_UPLOAD = "https://upload.zoho.eu/workdrive-api/v1/stream/upload"

type Folder = { id: string; name: string }

async function workdriveJson(token: string, url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, headers: { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/vnd.api+json", ...(init?.headers ?? {}) } })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.errors?.[0]?.title ?? `WorkDrive request failed (${response.status})`)
  return payload
}

async function findChildFolder(token: string, parentId: string, name: string): Promise<Folder | null> {
  const payload = await workdriveJson(token, `${WORKDRIVE_API}/files/${parentId}/files?page[limit]=200`)
  const match = (payload.data ?? []).find((item: any) => item.attributes?.type === "folder" && item.attributes?.name === name)
  return match ? { id: match.id, name: match.attributes.name } : null
}

async function ensureFolder(token: string, parentId: string, name: string): Promise<Folder> {
  const existing = await findChildFolder(token, parentId, name)
  if (existing) return existing
  const payload = await workdriveJson(token, `${WORKDRIVE_API}/files`, { method: "POST", body: JSON.stringify({ data: { type: "files", attributes: { name, parent_id: parentId, type: "folder" } } }) })
  return { id: payload.data.id, name: payload.data.attributes?.name ?? name }
}

export async function ensureProjectFolders(token: string, rootId: string, projectName: string) {
  const project = await ensureFolder(token, rootId, projectName)
  const [cad, pdf, report] = await Promise.all([ensureFolder(token, project.id, "CAD"), ensureFolder(token, project.id, "PDF"), ensureFolder(token, project.id, "REPORT")])
  return { project, cad, pdf, report }
}

export function destinationFor(filename: string, folders: Awaited<ReturnType<typeof ensureProjectFolders>>) {
  const extension = filename.split(".").pop()?.toLowerCase()
  if (["dwg", "dxf", "igs", "iges", "step", "stp"].includes(extension ?? "")) return folders.cad.id
  if (extension === "pdf") return folders.pdf.id
  return folders.report.id
}

export async function uploadWorkDriveFile(token: string, parentId: string, filename: string, content: Blob) {
  const form = new FormData()
  form.append("content", content, filename)
  const response = await fetch(WORKDRIVE_UPLOAD, { method: "POST", headers: { Authorization: `Zoho-oauthtoken ${token}`, "x-parent_id": parentId, "override-name-exist": "true" }, body: form })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.errors?.[0]?.title ?? `WorkDrive upload failed (${response.status})`)
  return payload
}
