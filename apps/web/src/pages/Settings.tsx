import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { 
  User as UserIcon, 
  Briefcase, 
  Users, 
  CreditCard, 
  Key, 
  Shield, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  AlertTriangle,
  Mail,
  Camera,
  Globe,
  Lock,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useDatasets } from '../hooks/useQueries';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';

type TabType = 'profile' | 'workspace' | 'team' | 'billing' | 'api-keys';

interface Member {
  id: string;
  user_id: string;
  name: string;
  email: string;
  avatar_url: string;
  role: 'admin' | 'analyst' | 'viewer';
}

interface Invite {
  id: string;
  email: string;
  role: 'admin' | 'analyst' | 'viewer';
  created_at: string;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop'
];

export default function Settings() {
  const { user } = useAuth();
  const { data: datasets } = useDatasets();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Loading states
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [isInvitingMember, setIsInvitingMember] = useState(false);

  // Profile Form State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar_url || AVATAR_PRESETS[0]);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  
  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Workspace Form State
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceSlug, setWorkspaceSlug] = useState('');
  const [workspacePlan, setWorkspacePlan] = useState('free');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Team State
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'analyst' | 'viewer'>('viewer');

  // API Keys State
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // Sync auth user details on load
  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileAvatar(user.avatar_url || AVATAR_PRESETS[0]);
    }
  }, [user]);

  // Load Workspace Info
  useEffect(() => {
    async function fetchWorkspace() {
      try {
        const response = await axios.get('/api/workspace');
        if (response.data?.workspace) {
          setWorkspaceName(response.data.workspace.name);
          setWorkspaceSlug(response.data.workspace.slug);
          setWorkspacePlan(response.data.workspace.plan);
        }
      } catch (err) {
        console.error('Failed to load workspace info');
      }
    }
    fetchWorkspace();
  }, []);

  // Load Team Members & Invites
  const fetchTeam = async () => {
    setIsLoadingTeam(true);
    try {
      const response = await axios.get('/api/org/members');
      setMembers(response.data?.members || []);
      setInvites(response.data?.invites || []);
    } catch (err) {
      toast.error('Failed to load organization team members.');
    } finally {
      setIsLoadingTeam(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'team') {
      fetchTeam();
    }
  }, [activeTab]);

  // Load API Keys from localStorage on tab open
  useEffect(() => {
    if (activeTab === 'api-keys') {
      const keys = JSON.parse(localStorage.getItem('insightflow_api_keys') || '[]');
      setApiKeys(keys);
    }
  }, [activeTab]);

  // Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      // 1. Save profile details
      await axios.put('/api/auth/profile', {
        name: profileName,
        avatar_url: profileAvatar
      });

      // 2. Change password if fields are populated
      if (currentPassword || newPassword || confirmPassword) {
        if (newPassword !== confirmPassword) {
          toast.error("New passwords do not match.");
          setIsSavingProfile(false);
          return;
        }
        await axios.put('/api/auth/password', {
          currentPassword,
          newPassword
        });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }

      toast.success('Profile settings updated successfully!');
      // Force reload page to refresh headers / context
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update profile details.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Save Workspace Changes
  const handleSaveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingWorkspace(true);
    try {
      const res = await axios.put('/api/workspace', {
        name: workspaceName,
        slug: workspaceSlug
      });
      if (res.data?.workspace) {
        setWorkspaceName(res.data.workspace.name);
        setWorkspaceSlug(res.data.workspace.slug);
      }
      toast.success('Workspace updated successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update workspace details.');
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  // Delete Workspace danger zone action
  const handleDeleteWorkspace = async () => {
    if (deleteConfirmText !== workspaceName) {
      toast.error('Workspace name confirmation does not match.');
      return;
    }
    setIsDeletingWorkspace(true);
    try {
      await axios.delete('/api/workspace');
      toast.success('Workspace deleted successfully.');
      setTimeout(() => {
        window.location.href = '/onboarding';
      }, 1500);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete workspace.');
      setIsDeletingWorkspace(false);
    }
  };

  // Send Team invite
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setIsInvitingMember(true);
    try {
      await axios.post('/api/org/members', {
        email: inviteEmail,
        role: inviteRole
      });
      toast.success(`Invitation processed for ${inviteEmail}`);
      setInviteEmail('');
      fetchTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send invitation.');
    } finally {
      setIsInvitingMember(false);
    }
  };

  // Remove/revoke team membership
  const handleRemoveMember = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from this workspace?`)) return;
    try {
      await axios.delete(`/api/org/members/${id}`);
      toast.success('Member removed / Invite revoked.');
      fetchTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to remove member.');
    }
  };

  // API Key Generators
  const handleGenerateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) {
      toast.error('Please enter a key description name.');
      return;
    }

    const randomBytes = Array.from({length: 24}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newKeyString = `sk_live_${randomBytes}`;
    const newKey: ApiKey = {
      id: Math.random().toString(36).substring(2, 9),
      name: newKeyName,
      key: newKeyString,
      created_at: new Date().toLocaleDateString()
    };

    const updatedKeys = [...apiKeys, newKey];
    localStorage.setItem('insightflow_api_keys', JSON.stringify(updatedKeys));
    setApiKeys(updatedKeys);
    setGeneratedKey(newKeyString);
    setNewKeyName('');
    toast.success('API Key generated successfully!');
  };

  const handleRevokeApiKey = (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Systems using this key will immediately lose access.')) return;
    const updatedKeys = apiKeys.filter(k => k.id !== id);
    localStorage.setItem('insightflow_api_keys', JSON.stringify(updatedKeys));
    setApiKeys(updatedKeys);
    toast.success('API key revoked.');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const datasetCount = datasets ? datasets.length : 12;

  // Tabs layout
  const tabs = [
    { id: 'profile' as TabType, label: 'Profile', icon: UserIcon },
    { id: 'workspace' as TabType, label: 'Workspace', icon: Briefcase },
    { id: 'team' as TabType, label: 'Team Members', icon: Users },
    { id: 'billing' as TabType, label: 'Billing & Usage', icon: CreditCard },
    { id: 'api-keys' as TabType, label: 'Developer API Keys', icon: Key },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-text-primary tracking-tight">Settings</h1>
        <p className="text-sm text-text-muted mt-1">Manage organization workspace controls, developer access, and billing parameters.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left tabs pane */}
        <div className="w-full md:w-64 bg-surface/40 border border-border/40 rounded-xl p-2 shrink-0 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setGeneratedKey(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                  isActive 
                    ? 'bg-accent/15 text-accent border border-accent/25 shadow-sm shadow-accent/5' 
                    : 'text-text-muted hover:text-text-primary hover:bg-surface/50 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-accent' : 'text-text-muted'}`} />
                <span>{tab.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-accent" />}
              </button>
            );
          })}
        </div>

        {/* Right content pane */}
        <div className="flex-1 w-full min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* PROFILE TAB */}
              {activeTab === 'profile' && (
                <Card className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">Profile Configuration</h3>
                    <p className="text-xs text-text-muted">Edit personal user details and modify your secure login credentials.</p>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    {/* Avatar Picker Section */}
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="relative group cursor-pointer" onClick={() => setShowAvatarPicker(!showAvatarPicker)}>
                        <img 
                          src={profileAvatar} 
                          alt="Profile Avatar" 
                          className="w-20 h-20 rounded-full object-cover border-2 border-accent/40 group-hover:border-accent group-hover:opacity-80 transition-all"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-5 h-5 text-text-primary" />
                        </div>
                      </div>
                      <div>
                        <Button 
                          type="button" 
                          variant="secondary" 
                          size="sm"
                          onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                        >
                          Change Avatar Preset
                        </Button>
                        <p className="text-xs text-text-muted mt-1">Select from pre-defined presets or click circle avatar.</p>
                      </div>
                    </div>

                    {showAvatarPicker && (
                      <div className="bg-raised border border-border/40 p-4 rounded-lg space-y-3">
                        <p className="text-xs font-semibold text-text-muted">Choose Avatar Preset</p>
                        <div className="grid grid-cols-6 gap-2">
                          {AVATAR_PRESETS.map((preset, index) => (
                            <img
                              key={index}
                              src={preset}
                              alt={`Preset ${index + 1}`}
                              onClick={() => {
                                setProfileAvatar(preset);
                                setShowAvatarPicker(false);
                              }}
                              className={`w-12 h-12 rounded-full cursor-pointer hover:scale-105 border-2 transition-all ${
                                profileAvatar === preset ? 'border-accent scale-105' : 'border-transparent'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Basic Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-text-muted">Full Name</label>
                        <Input 
                          type="text" 
                          value={profileName} 
                          onChange={(e) => setProfileName(e.target.value)} 
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-text-muted">Email Address (Read-only)</label>
                        <Input 
                          type="email" 
                          value={user?.email || ''} 
                          disabled 
                          className="bg-disabled text-text-muted cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <hr className="border-border/30" />

                    {/* Change Password Block */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-accent" />
                        <h4 className="text-sm font-semibold text-text-primary">Change Password</h4>
                      </div>
                      <p className="text-xs text-text-muted">To secure your credentials, enter your existing password followed by your updated password.</p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-text-muted">Current Password</label>
                          <Input 
                            type="password" 
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="••••••••"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-text-muted">New Password</label>
                          <Input 
                            type="password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-text-muted">Confirm New Password</label>
                          <Input 
                            type="password" 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button type="submit" isLoading={isSavingProfile} className="w-full sm:w-auto">
                        Save Account Changes
                      </Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* WORKSPACE TAB */}
              {activeTab === 'workspace' && (
                <Card className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">Workspace Management</h3>
                    <p className="text-xs text-text-muted">Configure the workspace workspace names, slug URIs, and subscriptions.</p>
                  </div>

                  <form onSubmit={handleSaveWorkspace} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-text-muted">Workspace Name</label>
                        <Input 
                          type="text" 
                          value={workspaceName} 
                          onChange={(e) => setWorkspaceName(e.target.value)}
                          required 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-text-muted">Workspace URL Slug</label>
                        <Input 
                          type="text" 
                          value={workspaceSlug} 
                          onChange={(e) => setWorkspaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          required 
                        />
                      </div>
                    </div>

                    <div className="bg-raised border border-border/30 rounded-lg p-3 text-xs text-text-muted flex items-center gap-2">
                      <Globe className="w-4 h-4 text-accent shrink-0" />
                      <span>URL Preview: <strong className="text-text-primary font-mono">insightflow.io/workspace/{workspaceSlug || 'workspace-slug'}</strong></span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-text-muted block">Active Tier Plan</label>
                      <Badge variant="info" className="text-xs px-2.5 py-1 uppercase tracking-wider font-semibold font-display">
                        {workspacePlan === 'pro' ? `Pro Plan — ${datasetCount} datasets used` : `Free Plan — ${datasetCount} datasets used`}
                      </Badge>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button type="submit" isLoading={isSavingWorkspace} className="w-full sm:w-auto">
                        Save Workspace Settings
                      </Button>
                    </div>
                  </form>

                  {/* Danger Zone */}
                  <hr className="border-border/30" />
                  <div className="border border-danger/25 bg-danger/5 rounded-xl p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-danger">Delete Workspace Danger Zone</h4>
                        <p className="text-xs text-text-muted mt-1">This will permanently remove this workspace and wipe all corresponding files, schemas, database tables, and predictions. This action is irreversible.</p>
                      </div>
                    </div>
                    <div>
                      <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
                        Delete Workspace
                      </Button>
                    </div>
                  </div>

                  {/* Delete Workspace Confirmation Modal */}
                  {showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                      <div className="bg-[#121118] border border-border/80 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-6 h-6 text-danger" />
                          <h4 className="text-base font-bold text-text-primary">Confirm Workspace Deletion</h4>
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed">
                          To confirm, please type <strong className="text-text-primary font-mono">{workspaceName}</strong> in the confirmation box below. This will delete the entire monorepo datasets.
                        </p>
                        <Input 
                          type="text" 
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="Type workspace name to confirm"
                          className="border-danger/30 focus:ring-danger/50"
                        />
                        <div className="flex justify-end gap-3 pt-2">
                          <Button variant="secondary" size="sm" onClick={() => {
                            setShowDeleteModal(false);
                            setDeleteConfirmText('');
                          }}>
                            Cancel
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm" 
                            isLoading={isDeletingWorkspace}
                            disabled={deleteConfirmText !== workspaceName}
                            onClick={handleDeleteWorkspace}
                          >
                            Delete Permanently
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* TEAM TAB */}
              {activeTab === 'team' && (
                <Card className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">Team & Workspace Organization</h3>
                    <p className="text-xs text-text-muted">Invite team associates, change roles (Admin, Analyst, Viewer), and manage memberships.</p>
                  </div>

                  {/* Invite Member Section */}
                  <form onSubmit={handleSendInvite} className="bg-raised border border-border/30 rounded-xl p-5 space-y-4">
                    <h4 className="text-sm font-semibold text-text-primary">Invite a Workspace Colleague</h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1 relative">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
                        <Input 
                          type="email" 
                          placeholder="colleague@company.com" 
                          value={inviteEmail} 
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="pl-9"
                          required 
                        />
                      </div>
                      <div className="w-full sm:w-48">
                        <select 
                          value={inviteRole} 
                          onChange={(e) => setInviteRole(e.target.value as any)}
                          className="w-full h-10 px-3 bg-surface/80 border border-border/40 text-text-primary text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50"
                        >
                          <option value="admin">Admin (Full Edit)</option>
                          <option value="analyst">Analyst (Edit Data)</option>
                          <option value="viewer">Viewer (Read Only)</option>
                        </select>
                      </div>
                      <Button type="submit" isLoading={isInvitingMember} className="shrink-0">
                        <Plus className="w-4 h-4 mr-2" />
                        Send Invite
                      </Button>
                    </div>
                  </form>

                  {/* Members Grid & List */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-text-primary">Active Workspace Members</h4>
                    
                    {isLoadingTeam ? (
                      <div className="flex justify-center py-6">
                        <Spinner size="md" />
                      </div>
                    ) : (
                      <div className="border border-border/40 rounded-xl overflow-hidden divide-y divide-border/35 bg-surface/30">
                        {members.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-4 flex-wrap gap-3">
                            <div className="flex items-center gap-3">
                              <img 
                                src={member.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50&h=50&fit=crop'} 
                                alt={member.name} 
                                className="w-10 h-10 rounded-full object-cover border border-border"
                              />
                              <div>
                                <p className="text-sm font-medium text-text-primary">{member.name}</p>
                                <p className="text-xs text-text-muted">{member.email}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Badge variant={member.role === 'admin' ? 'info' : 'neutral'} className="capitalize">
                                {member.role}
                              </Badge>
                              {member.user_id !== user?.id ? (
                                <button 
                                  type="button"
                                  onClick={() => handleRemoveMember(member.id, member.name)}
                                  className="text-text-muted hover:text-danger p-1 rounded-md hover:bg-danger/10 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-accent font-semibold px-2 py-1 bg-accent/10 rounded-md">You</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pending Invites List */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-text-primary">Pending Invitations</h4>
                    
                    {invites.length === 0 ? (
                      <p className="text-xs text-text-muted italic">No pending invitations found.</p>
                    ) : (
                      <div className="border border-border/40 rounded-xl overflow-hidden divide-y divide-border/35 bg-surface/30">
                        {invites.map((invite) => (
                          <div key={invite.id} className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <Mail className="w-5 h-5 text-text-muted shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-text-primary">{invite.email}</p>
                                <p className="text-[10px] text-text-muted">Invited on {new Date(invite.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Badge variant="neutral" className="capitalize text-xs">
                                Pending {invite.role}
                              </Badge>
                              <button 
                                type="button"
                                onClick={() => handleRemoveMember(invite.id, invite.email)}
                                className="text-text-muted hover:text-danger p-1 rounded-md hover:bg-danger/10 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* BILLING TAB */}
              {activeTab === 'billing' && (
                <div className="space-y-6">
                  {/* Current Plan Overview */}
                  <Card className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                    <div className="space-y-2">
                      <Badge variant="info" className="text-xs tracking-wider uppercase font-semibold font-display">
                        Current Subscription
                      </Badge>
                      <h3 className="text-xl font-bold text-text-primary">Pro Plan (12/25 datasets)</h3>
                      <p className="text-xs text-text-muted leading-relaxed">
                        Your billing cycle renews on <strong className="text-text-primary">July 1, 2026</strong>. Auto-billing is configured to credit card ending in <strong className="text-text-primary">4242</strong>.
                      </p>
                    </div>
                    <Button className="shrink-0 w-full md:w-auto bg-accent hover:bg-accent-hover font-semibold">
                      Upgrade to Enterprise
                    </Button>
                  </Card>

                  {/* Resource Usage Bars */}
                  <Card className="space-y-4">
                    <h4 className="text-sm font-semibold text-text-primary">Workspace Usage Analytics</h4>
                    
                    <div className="space-y-4">
                      {/* Dataset Usage */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-text-muted">Ingested Datasets</span>
                          <span className="text-text-primary">{datasetCount} / 25 datasets ({(datasetCount/25 * 100).toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-border/40 h-2 rounded-full overflow-hidden">
                          <div className="bg-accent h-full rounded-full" style={{ width: `${(datasetCount/25 * 100)}%` }} />
                        </div>
                      </div>

                      {/* API Call Count Usage */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-text-muted">Monthly API Request volume</span>
                          <span className="text-text-primary">14,250 / 50,000 requests (28.5%)</span>
                        </div>
                        <div className="w-full bg-border/40 h-2 rounded-full overflow-hidden">
                          <div className="bg-accent-hover h-full rounded-full" style={{ width: '28.5%' }} />
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Invoice List */}
                  <Card className="space-y-4">
                    <h4 className="text-sm font-semibold text-text-primary">Invoice History</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-border/30 text-xs font-semibold text-text-muted uppercase">
                            <th className="pb-3 pt-1">Invoice Date</th>
                            <th className="pb-3 pt-1">Amount</th>
                            <th className="pb-3 pt-1">Status</th>
                            <th className="pb-3 pt-1 text-right">Receipt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20 text-xs text-text-primary">
                          {[
                            { date: 'Jun 1, 2026', amount: '$49.00', status: 'Paid' },
                            { date: 'May 1, 2026', amount: '$49.00', status: 'Paid' },
                            { date: 'Apr 1, 2026', amount: '$49.00', status: 'Paid' },
                            { date: 'Mar 1, 2026', amount: '$19.00', status: 'Paid' }
                          ].map((invoice, idx) => (
                            <tr key={idx} className="hover:bg-surface/10">
                              <td className="py-3.5 font-medium">{invoice.date}</td>
                              <td className="py-3.5">{invoice.amount}</td>
                              <td className="py-3.5">
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                                  {invoice.status}
                                </span>
                              </td>
                              <td className="py-3.5 text-right">
                                <button 
                                  type="button"
                                  onClick={() => toast.success(`Downloading PDF receipt for ${invoice.date}...`)}
                                  className="inline-flex items-center gap-1 text-accent hover:text-accent-hover font-medium"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Download
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}

              {/* API KEYS TAB */}
              {activeTab === 'api-keys' && (
                <Card className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">Developer API Keys</h3>
                    <p className="text-xs text-text-muted">Create secure bearer authorization tokens to feed CSV datasets asynchronously.</p>
                  </div>

                  <form onSubmit={handleGenerateApiKey} className="bg-raised border border-border/30 rounded-xl p-5 space-y-4">
                    <h4 className="text-sm font-semibold text-text-primary">Generate a New API Token</h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <Input 
                          type="text" 
                          placeholder="e.g. Production CI script" 
                          value={newKeyName} 
                          onChange={(e) => setNewKeyName(e.target.value)}
                          required 
                        />
                      </div>
                      <Button type="submit">
                        <Plus className="w-4 h-4 mr-2" />
                        Generate Key
                      </Button>
                    </div>
                  </form>

                  {/* Keys list */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-text-primary">Active Keys</h4>
                    
                    {apiKeys.length === 0 ? (
                      <p className="text-xs text-text-muted italic">No API keys generated yet. Click above to create one.</p>
                    ) : (
                      <div className="border border-border/40 rounded-xl overflow-hidden divide-y divide-border/35 bg-surface/30">
                        {apiKeys.map((key) => (
                          <div key={key.id} className="flex items-center justify-between p-4 flex-wrap gap-3">
                            <div>
                              <p className="text-sm font-semibold text-text-primary">{key.name}</p>
                              <p className="text-xs font-mono text-text-muted mt-1">
                                {key.key.substring(0, 12)}•••••••••••••••••{key.key.substring(key.key.length - 3)}
                              </p>
                              <p className="text-[10px] text-text-muted mt-0.5">Created on {key.created_at}</p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                onClick={() => copyToClipboard(key.key, key.id)}
                                className="h-9 px-3"
                              >
                                {copiedKeyId === key.id ? (
                                  <Check className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleRevokeApiKey(key.id)}
                                className="text-text-muted hover:text-danger h-9 px-3 hover:bg-danger/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Generated Key Reveal Dialog Modal */}
                  {generatedKey && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                      <div className="bg-[#121118] border border-accent/40 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center gap-3 text-accent">
                          <Shield className="w-6 h-6" />
                          <h4 className="text-base font-bold text-text-primary">Key Generated Successfully</h4>
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed">
                          Please copy this key and store it somewhere safe. For safety reasons, <strong className="text-text-primary">you cannot view this key again</strong> after closing this window.
                        </p>
                        
                        <div className="flex items-center gap-2 bg-[#0B0A0F] border border-border/40 p-3 rounded-lg font-mono text-xs select-all break-all text-text-primary">
                          <span className="flex-1">{generatedKey}</span>
                          <button 
                            type="button" 
                            onClick={() => copyToClipboard(generatedKey, 'new-gen-key')}
                            className="p-1 hover:bg-surface rounded text-accent transition-all"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex justify-end pt-2">
                          <Button variant="primary" size="sm" onClick={() => setGeneratedKey(null)}>
                            I've copied the key
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
