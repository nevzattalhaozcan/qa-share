import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Notes from '../components/Notes';
import { usePermissions } from '../hooks/usePermissions';
import { Lock, User, Edit2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function Profile() {
    const navigate = useNavigate();
    const { user, logout, createPreference, updateCreatePreference, updatePassword, updateProfile } = useAuth();
    const { canViewNotes } = usePermissions();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Profile edit state
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');
    const [editUsername, setEditUsername] = useState(user?.username || '');
    const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Password collapse state
    const [isPasswordExpanded, setIsPasswordExpanded] = useState(false);

    const handlePasswordChange = async () => {
        setPasswordMessage(null);

        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'All fields are required' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        if (newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        const success = await updatePassword(currentPassword, newPassword);

        if (success) {
            setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            setPasswordMessage({ type: 'error', text: 'Current password is incorrect' });
        }
    };

    const handleProfileUpdate = async () => {
        setProfileMessage(null);

        if (!editName.trim() || !editUsername.trim()) {
            setProfileMessage({ type: 'error', text: 'Name and username are required' });
            return;
        }

        if (editUsername.trim().length < 3) {
            setProfileMessage({ type: 'error', text: 'Username must be at least 3 characters' });
            return;
        }

        const result = await updateProfile(editName.trim(), editUsername.trim());

        if (result.success) {
            setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
            setIsEditingProfile(false);
        } else {
            setProfileMessage({ type: 'error', text: result.error || 'Failed to update profile' });
        }
    };

    const cancelProfileEdit = () => {
        setEditName(user?.name || '');
        setEditUsername(user?.username || '');
        setIsEditingProfile(false);
        setProfileMessage(null);
    };

    return (
        <div className="p-4 space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
                    <User className="w-8 h-8 text-slate-300" />
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">{user?.name}</h1>
                    <p className="text-muted-foreground">{user?.role}</p>
                    {user?.username && <p className="text-sm text-muted-foreground">@{user.username}</p>}
                </div>
                {!isEditingProfile && (
                    <button
                        onClick={() => setIsEditingProfile(true)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-muted-foreground hover:text-white"
                        title="Edit Profile"
                    >
                        <Edit2 size={20} />
                    </button>
                )}
            </div>

            {/* Edit Profile Section */}
            {isEditingProfile && (
                <div className="glass-card p-4 rounded-xl space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Edit2 size={18} />
                        Edit Profile
                    </h3>

                    <div className="space-y-3">
                        <div>
                            <label className="text-sm text-muted-foreground mb-1 block">Name</label>
                            <Input
                                placeholder="Your name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground mb-1 block">Username</label>
                            <Input
                                placeholder="Your username"
                                value={editUsername}
                                onChange={(e) => setEditUsername(e.target.value)}
                            />
                        </div>

                        {profileMessage && (
                            <p className={`text-sm ${profileMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                {profileMessage.text}
                            </p>
                        )}

                        <div className="flex gap-2">
                            <Button
                                onClick={handleProfileUpdate}
                                className="flex-1"
                                disabled={!editName.trim() || !editUsername.trim()}
                            >
                                <Check size={16} className="mr-1" />
                                Save Changes
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={cancelProfileEdit}
                            >
                                <X size={16} className="mr-1" />
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {canViewNotes && (
                <div className="glass-card p-4 rounded-xl space-y-4">
                    <h3 className="font-semibold">Quick Notes</h3>
                    <Notes />
                </div>
            )}

            {/* Password change section */}
            <div className="glass-card p-4 rounded-xl space-y-4">
                <button
                    onClick={() => setIsPasswordExpanded(!isPasswordExpanded)}
                    className="flex items-center justify-between w-full font-semibold"
                >
                    <div className="flex items-center gap-2">
                        <Lock size={18} />
                        Change Password
                    </div>
                    {isPasswordExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {/* Password input fields */}
                {isPasswordExpanded && (
                    <div className="space-y-3 pt-2">
                        <Input
                            type="password"
                            placeholder="Current Password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <Input
                            type="password"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <Input
                            type="password"
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />

                        {passwordMessage && (
                            <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                {passwordMessage.text}
                            </p>
                        )}

                        <Button
                            onClick={handlePasswordChange}
                            className="w-full"
                            disabled={!currentPassword || !newPassword || !confirmPassword}
                        >
                            Update Password
                        </Button>
                    </div>
                )}
            </div>

            <div className="glass-card p-4 rounded-xl space-y-4">
                <h3 className="font-semibold">Settings</h3>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">"Create" Button Action</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['test', 'bug', 'both'] as const).map((option) => (
                            <button
                                key={option}
                                onClick={() => updateCreatePreference(option)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${createPreference === option
                                    ? 'bg-primary/20 border-primary text-primary'
                                    : 'bg-slate-800/50 border-white/5 hover:bg-white/5'
                                    }`}
                            >
                                {option === 'both' ? 'Ask Both' : option === 'test' ? 'Test Only' : 'Bug Only'}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Choose what happens when you click the + button.
                    </p>
                </div>
            </div>

            <Button
                variant="destructive"
                className="w-full"
                onClick={() => {
                    logout();
                    navigate('/role-select');
                }}
            >
                Logout
            </Button>
        </div >
    );
}
