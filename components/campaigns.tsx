"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Copy, Users, Crown, Trash2, UserPlus, LogOut } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { type Language, translations } from "@/lib/translations"

interface Campaign {
  id: string
  name: string
  description: string | null
  game_master_id: string
  status: string
  invite_code: string
  created_at: string
  member_count?: number
  role?: string
}

interface CampaignMember {
  id: string
  user_id: string
  role: string
  joined_at: string
  user_email?: string
}

interface CampaignsProps {
  language: Language
}

export function Campaigns({ language }: CampaignsProps) {
  const t = translations[language]
  const { user } = useAuth()
  const supabase = createBrowserClient()

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [members, setMembers] = useState<CampaignMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form states
  const [campaignName, setCampaignName] = useState("")
  const [campaignDescription, setCampaignDescription] = useState("")
  const [inviteCode, setInviteCode] = useState("")

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Get campaigns where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from("campaign_members")
        .select("campaign_id, role")
        .eq("user_id", user.id)

      if (memberError) throw memberError

      const campaignIds = memberData.map((m) => m.campaign_id)

      if (campaignIds.length === 0) {
        setCampaigns([])
        setLoading(false)
        return
      }

      // Get campaign details
      const { data: campaignsData, error: campaignsError } = await supabase
        .from("campaigns")
        .select("*")
        .in("id", campaignIds)
        .order("created_at", { ascending: false })

      if (campaignsError) throw campaignsError

      // Attach role to each campaign
      const campaignsWithRole = campaignsData.map((campaign) => ({
        ...campaign,
        role: memberData.find((m) => m.campaign_id === campaign.id)?.role,
      }))

      setCampaigns(campaignsWithRole)
    } catch (err: any) {
      console.error("[v0] Error loading campaigns:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async () => {
    if (!user || !campaignName.trim()) return

    try {
      setError("")
      setSuccess("")

      const { data, error: createError } = await supabase
        .from("campaigns")
        .insert({
          name: campaignName.trim(),
          description: campaignDescription.trim() || null,
          game_master_id: user.id,
        })
        .select()
        .single()

      if (createError) throw createError

      setSuccess(t.campaigns.campaignCreated || "Campaign created successfully!")
      setCampaignName("")
      setCampaignDescription("")
      setIsCreateDialogOpen(false)
      loadCampaigns()
    } catch (err: any) {
      console.error("[v0] Error creating campaign:", err)
      setError(err.message)
    }
  }

  const handleJoinCampaign = async () => {
    if (!user || !inviteCode.trim()) return

    try {
      setError("")
      setSuccess("")

      // Find campaign by invite code
      const { data: campaign, error: findError } = await supabase
        .from("campaigns")
        .select("id")
        .eq("invite_code", inviteCode.trim().toUpperCase())
        .single()

      if (findError || !campaign) {
        setError(t.campaigns.invalidInviteCode || "Invalid invite code")
        return
      }

      // Add user as member
      const { error: joinError } = await supabase.from("campaign_members").insert({
        campaign_id: campaign.id,
        user_id: user.id,
        role: "player",
      })

      if (joinError) {
        if (joinError.code === "23505") {
          setError(t.campaigns.alreadyMember || "You are already a member of this campaign")
        } else {
          throw joinError
        }
        return
      }

      setSuccess(t.campaigns.joinedCampaign || "Joined campaign successfully!")
      setInviteCode("")
      setIsJoinDialogOpen(false)
      loadCampaigns()
    } catch (err: any) {
      console.error("[v0] Error joining campaign:", err)
      setError(err.message)
    }
  }

  const handleViewCampaign = async (campaign: Campaign) => {
    setSelectedCampaign(campaign)

    try {
      // Load members
      const { data, error } = await supabase
        .from("campaign_members")
        .select("id, user_id, role, joined_at")
        .eq("campaign_id", campaign.id)

      if (error) throw error

      // Get user emails
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in(
          "id",
          data.map((m) => m.user_id),
        )

      const membersWithEmails = data.map((member) => ({
        ...member,
        user_email: profiles?.find((p) => p.id === member.user_id)?.display_name || member.user_id,
      }))

      setMembers(membersWithEmails)
      setIsViewDialogOpen(true)
    } catch (err: any) {
      console.error("[v0] Error loading members:", err)
      setError(err.message)
    }
  }

  const handleCopyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setSuccess(t.campaigns.inviteCodeCopied || "Invite code copied!")
    setTimeout(() => setSuccess(""), 2000)
  }

  const handleLeaveCampaign = async (campaignId: string) => {
    if (!user) return

    if (!confirm(t.campaigns.confirmLeave || "Are you sure you want to leave this campaign?")) return

    try {
      const { error } = await supabase
        .from("campaign_members")
        .delete()
        .eq("campaign_id", campaignId)
        .eq("user_id", user.id)

      if (error) throw error

      setSuccess(t.campaigns.leftCampaign || "Left campaign successfully")
      loadCampaigns()
      setIsViewDialogOpen(false)
    } catch (err: any) {
      console.error("[v0] Error leaving campaign:", err)
      setError(err.message)
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm(t.campaigns.confirmDelete || "Are you sure you want to delete this campaign?")) return

    try {
      const { error } = await supabase.from("campaigns").delete().eq("id", campaignId)

      if (error) throw error

      setSuccess(t.campaigns.campaignDeleted || "Campaign deleted successfully")
      loadCampaigns()
      setIsViewDialogOpen(false)
    } catch (err: any) {
      console.error("[v0] Error deleting campaign:", err)
      setError(err.message)
    }
  }

  const isGM = (campaign: Campaign) => campaign.role === "game_master"

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <div className="text-center">{t.campaigns.loading || "Loading campaigns..."}</div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold">{t.campaigns.title || "Campaigns"}</h2>
          <p className="text-muted-foreground">{t.campaigns.subtitle || "Manage your D&D campaigns"}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsJoinDialogOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            {t.campaigns.joinCampaign || "Join Campaign"}
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>{t.campaigns.createCampaign || "Create Campaign"}</Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 text-green-900 border-green-200">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">{t.campaigns.allCampaigns || "All Campaigns"}</TabsTrigger>
          <TabsTrigger value="gm">{t.campaigns.asGM || "As Game Master"}</TabsTrigger>
          <TabsTrigger value="player">{t.campaigns.asPlayer || "As Player"}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleViewCampaign(campaign)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    {isGM(campaign) ? (
                      <Badge variant="default" className="ml-2">
                        <Crown className="w-3 h-3 mr-1" />
                        GM
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-2">
                        <Users className="w-3 h-3 mr-1" />
                        {t.campaigns.player || "Player"}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {campaign.description || t.campaigns.noDescription || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                    <Badge variant="outline">{campaign.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {campaigns.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {t.campaigns.noCampaigns || "No campaigns yet. Create one to get started!"}
            </div>
          )}
        </TabsContent>

        <TabsContent value="gm" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns
              .filter((c) => isGM(c))
              .map((campaign) => (
                <Card
                  key={campaign.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleViewCampaign(campaign)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {campaign.description || t.campaigns.noDescription || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                      <Badge variant="outline">{campaign.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="player" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns
              .filter((c) => !isGM(c))
              .map((campaign) => (
                <Card
                  key={campaign.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleViewCampaign(campaign)}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {campaign.description || t.campaigns.noDescription || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                      <Badge variant="outline">{campaign.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Campaign Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.campaigns.createCampaign || "Create New Campaign"}</DialogTitle>
            <DialogDescription>
              {t.campaigns.createDescription || "Create a new campaign and invite players"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{t.campaigns.campaignName || "Campaign Name"}</Label>
              <Input
                id="name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder={t.campaigns.namePlaceholder || "Enter campaign name"}
              />
            </div>
            <div>
              <Label htmlFor="description">{t.campaigns.description || "Description"}</Label>
              <Textarea
                id="description"
                value={campaignDescription}
                onChange={(e) => setCampaignDescription(e.target.value)}
                placeholder={t.campaigns.descriptionPlaceholder || "Describe your campaign"}
                rows={4}
              />
            </div>
            <Button onClick={handleCreateCampaign} className="w-full" disabled={!campaignName.trim()}>
              {t.campaigns.create || "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Campaign Dialog */}
      <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.campaigns.joinCampaign || "Join Campaign"}</DialogTitle>
            <DialogDescription>
              {t.campaigns.joinDescription || "Enter the invite code to join a campaign"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="inviteCode">{t.campaigns.inviteCode || "Invite Code"}</Label>
              <Input
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="XXXXXXXX"
                maxLength={8}
              />
            </div>
            <Button onClick={handleJoinCampaign} className="w-full" disabled={!inviteCode.trim()}>
              {t.campaigns.join || "Join"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Campaign Dialog */}
      {selectedCampaign && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedCampaign.name}
                {isGM(selectedCampaign) && (
                  <Badge variant="default">
                    <Crown className="w-3 h-3 mr-1" />
                    GM
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                {selectedCampaign.description || t.campaigns.noDescription || "No description"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {isGM(selectedCampaign) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">{t.campaigns.inviteCode || "Invite Code"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-muted rounded font-mono text-lg">
                        {selectedCampaign.invite_code}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyInviteCode(selectedCampaign.invite_code)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    {t.campaigns.members || "Members"} ({members.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                        <div className="flex items-center gap-2">
                          {member.role === "game_master" ? (
                            <Crown className="w-4 h-4 text-yellow-600" />
                          ) : (
                            <Users className="w-4 h-4" />
                          )}
                          <span className="text-sm">{member.user_email}</span>
                        </div>
                        <Badge variant={member.role === "game_master" ? "default" : "secondary"}>
                          {member.role === "game_master" ? "GM" : t.campaigns.player || "Player"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                {isGM(selectedCampaign) ? (
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteCampaign(selectedCampaign.id)}
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t.campaigns.deleteCampaign || "Delete Campaign"}
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => handleLeaveCampaign(selectedCampaign.id)} className="w-full">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t.campaigns.leaveCampaign || "Leave Campaign"}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
