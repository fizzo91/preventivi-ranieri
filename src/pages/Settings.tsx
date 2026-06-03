import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Save, X, Plus, RotateCcw, ShieldCheck, Eye, EyeOff, Loader2, LogOut, Camera } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PasswordStrengthIndicator, validatePassword } from "@/pages/ResetPassword"
import { useAuth } from "@/contexts/AuthContext"
import { useQuotes } from "@/hooks/useQuotes"
import { useProducts } from "@/hooks/useProducts"
import { useClients } from "@/hooks/useClients"
import { useTags } from "@/hooks/useTags"
import { LoadingSpinner, StatCard } from "@/components/shared"
import { supabase } from "@/integrations/supabase/client"
import { validateImageFile } from "@/lib/fileValidation"
import { useNavigate } from "react-router-dom"
import { useIsAdmin } from "@/hooks/useAccessRequests"
import { AccessRequestsPanel } from "@/components/admin/AccessRequestsPanel"

const Settings = () => {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { profile, user, updateProfile, updatePassword, signOut, refreshProfile } = useAuth()
  const { data: quotes = [] } = useQuotes()
  const { data: products = [] } = useProducts()
  const { data: clients = [] } = useClients()
  const { tags: suggestedTags, addTag, removeTag: removeTagFromList, resetToDefaults } = useTags()
  const { isAdmin } = useIsAdmin()
  const [newTag, setNewTag] = useState("")
  const [settings, setSettings] = useState({
    company_name: "", address: "", phone: "", website: "", vat_number: "", tax_code: "", notes: ""
  })
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (profile) {
      setSettings({
        company_name: profile.company_name || "", address: profile.address || "",
        phone: profile.phone || "", website: profile.website || "",
        vat_number: profile.vat_number || "", tax_code: profile.tax_code || "",
        notes: profile.notes || ""
      })
    }
  }, [profile])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    const validation = await validateImageFile(file)
    if (!validation.valid) {
      toast({ title: "Errore", description: validation.error, variant: "destructive" })
      return
    }

    setUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filePath = `${user.id}/avatar.${ext}`

      // Remove old avatar files
      const { data: existingFiles } = await supabase.storage.from('avatars').list(user.id)
      if (existingFiles?.length) {
        await supabase.storage.from('avatars').remove(existingFiles.map(f => `${user.id}/${f.name}`))
      }

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
      
      // Add cache buster
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`
      await updateProfile({ logo: urlWithCacheBust })
      await refreshProfile()

      toast({ title: "Foto aggiornata", description: "La foto profilo è stata caricata con successo." })
    } catch (error: any) {
      toast({ title: "Errore", description: error.message || "Errore durante il caricamento", variant: "destructive" })
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate("/auth")
  }

  const saveSettings = async () => {
    try {
      await updateProfile(settings)
      toast({ title: "Impostazioni Salvate", description: "Le impostazioni dell'azienda sono state aggiornate" })
    } catch {
      toast({ title: "Errore", description: "Si è verificato un errore durante il salvataggio", variant: "destructive" })
    }
  }

  if (!profile) return <LoadingSpinner />

  const initials = profile.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : profile.email[0].toUpperCase()

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <AvatarImage src={profile.logo || undefined} alt={profile.full_name || 'Avatar'} />
                <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-foreground">{profile.full_name || 'Utente'}</h1>
              <p className="text-muted-foreground">{profile.email}</p>
              {profile.company_name && (
                <p className="text-sm text-muted-foreground mt-1">{profile.company_name}</p>
              )}
            </div>
            <Button variant="outline" onClick={handleLogout} className="gap-2 text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4" />
              Esci
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Company Settings */}
      <Card>
        <CardHeader><CardTitle>Dati Azienda</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Ragione Sociale</Label>
              <Input id="company-name" value={settings.company_name} onChange={(e) => setSettings({ ...settings, company_name: e.target.value })} placeholder="La Mia Azienda S.r.l." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vat-number">Partita IVA</Label>
              <Input id="vat-number" value={settings.vat_number} onChange={(e) => setSettings({ ...settings, vat_number: e.target.value })} placeholder="IT12345678901" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-code">Codice Fiscale</Label>
              <Input id="tax-code" value={settings.tax_code} onChange={(e) => setSettings({ ...settings, tax_code: e.target.value })} placeholder="12345678901" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Sito Web</Label>
              <Input id="website" value={settings.website} onChange={(e) => setSettings({ ...settings, website: e.target.value })} placeholder="www.miaazienda.it" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-email">Email</Label>
              <Input id="company-email" type="email" value={profile.email} disabled className="bg-muted cursor-not-allowed" />
              <p className="text-xs text-muted-foreground">L'email è collegata al tuo account e non può essere modificata qui</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-phone">Telefono</Label>
              <Input id="company-phone" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} placeholder="+39 123 456 7890" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-address">Indirizzo</Label>
            <Textarea id="company-address" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} placeholder="Via Roma 123, 00100 Roma (RM)" rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-notes">Note Aziendali</Label>
            <Textarea id="company-notes" value={settings.notes} onChange={(e) => setSettings({ ...settings, notes: e.target.value })} placeholder="Note che appariranno sui preventivi..." rows={4} />
          </div>
          <Button onClick={saveSettings} className="gap-2"><Save className="h-4 w-4" />Salva Impostazioni</Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Tag Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestione Tag</CardTitle>
            <Button variant="ghost" size="sm" onClick={resetToDefaults} className="gap-1 text-xs"><RotateCcw className="h-3 w-3" />Ripristina default</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {suggestedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 text-sm py-1 px-3">
                {tag}
                <button type="button" onClick={() => removeTagFromList(tag)} className="hover:bg-muted rounded-full p-0.5"><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); if (newTag.trim()) { addTag(newTag); setNewTag("") } }
            }} placeholder="Aggiungi nuovo tag..." className="max-w-xs" />
            <Button variant="outline" size="icon" onClick={() => { if (newTag.trim()) { addTag(newTag); setNewTag("") } }}><Plus className="h-4 w-4" /></Button>
          </div>
          <p className="text-xs text-muted-foreground">Questi tag saranno disponibili come suggerimenti quando crei le sezioni dei preventivi.</p>
        </CardContent>
      </Card>

      <Separator />

      {/* Admin: Access Requests */}
      {isAdmin && (
        <>
          <AccessRequestsPanel />
          <Separator />
        </>
      )}

      {/* Security - Change Password */}
      <SecuritySection updatePassword={updatePassword} />

      <Separator />

      {/* Stats */}
      <Card>
        <CardHeader><CardTitle>Statistiche Dati</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Preventivi" value={quotes.length} className="text-primary" />
            <StatCard title="Prodotti" value={products.length} className="text-success" />
            <StatCard title="Clienti" value={clients.length} className="text-warning" />
          </div>
          <div className="text-center text-muted-foreground">
            <p className="text-sm">I tuoi dati sono sincronizzati in tempo reale e accessibili da qualsiasi dispositivo.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const SecuritySection = ({ updatePassword }: { updatePassword: (p: string) => Promise<{ error: any }> }) => {
  const { toast } = useToast()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const validationError = validatePassword(password)
    if (validationError) { setError(validationError); return }
    if (password !== confirmPassword) { setError("Le password non coincidono"); return }

    setLoading(true)
    const { error: updateError } = await updatePassword(password)
    if (updateError) {
      setError(updateError.message)
    } else {
      setPassword("")
      setConfirmPassword("")
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <CardTitle>Sicurezza</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="settings-new-password">Nuova Password</Label>
            <div className="relative">
              <Input id="settings-new-password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <PasswordStrengthIndicator password={password} />
          <div className="space-y-2">
            <Label htmlFor="settings-confirm-password">Conferma Password</Label>
            <div className="relative">
              <Input id="settings-confirm-password" type={showConfirm ? "text" : "password"} placeholder="••••••••"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-destructive">Le password non coincidono</p>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loading || !password || password !== confirmPassword} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Cambia Password
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default Settings
