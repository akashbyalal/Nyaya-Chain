"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Settings,
  User,
  Shield,
  Bell,
  Lock,
  Key,
  Database,
  Cloud,
  Save,
  RefreshCw,
} from "lucide-react"

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account and system preferences</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Settings */}
          <Card className="lg:col-span-2 glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-accent" />
                Profile Settings
              </CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue="Admin User" className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="admin@nyaya-chain.gov" className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" defaultValue="System Administrator" disabled className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" defaultValue="IT & Security" className="bg-background/50" />
                </div>
              </div>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-accent" />
                Security
              </CardTitle>
              <CardDescription>Account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" className="bg-background/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" type="password" className="bg-background/50" />
              </div>
              <Button variant="outline" className="w-full">
                <Key className="h-4 w-4 mr-2" />
                Update Password
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Notifications */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-accent" />
              Notification Preferences
            </CardTitle>
            <CardDescription>Choose how you want to be notified</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Email Notifications", description: "Receive email alerts for important events", enabled: true },
                { label: "New FIR Alerts", description: "Get notified when a new FIR is filed in your jurisdiction", enabled: true },
                { label: "Verification Requests", description: "Alerts for pending evidence verifications", enabled: true },
                { label: "Tamper Detection Alerts", description: "Immediate alerts when tampered files are detected", enabled: true },
                { label: "Weekly Reports", description: "Receive weekly summary reports", enabled: false },
              ].map((pref) => (
                <div key={pref.label} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div>
                    <p className="font-medium">{pref.label}</p>
                    <p className="text-sm text-muted-foreground">{pref.description}</p>
                  </div>
                  <Switch defaultChecked={pref.enabled} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-accent" />
              System Configuration
            </CardTitle>
            <CardDescription>Advanced system settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-accent" />
                    <div>
                      <p className="font-medium">Database Status</p>
                      <p className="text-sm text-muted-foreground">PostgreSQL v15.2</p>
                    </div>
                  </div>
                  <Badge className="bg-success/10 text-success border-success/20">Connected</Badge>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    <Cloud className="h-5 w-5 text-purple-400" />
                    <div>
                      <p className="font-medium">IPFS Node</p>
                      <p className="text-sm text-muted-foreground">ipfs.nyaya-chain.gov</p>
                    </div>
                  </div>
                  <Badge className="bg-success/10 text-success border-success/20">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-accent" />
                    <div>
                      <p className="font-medium">Blockchain Network</p>
                      <p className="text-sm text-muted-foreground">Hyperledger Fabric</p>
                    </div>
                  </div>
                  <Badge className="bg-success/10 text-success border-success/20">Synced</Badge>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                  <p className="font-medium mb-2">System Actions</p>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync Blockchain Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Database className="h-4 w-4 mr-2" />
                      Run Database Backup
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="h-4 w-4 mr-2" />
                      Security Audit Log
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
