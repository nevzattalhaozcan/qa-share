import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Notes from '../components/Notes';
import { usePermissions } from '../hooks/usePermissions';
import { Lock, User } from 'lucide-react';

export default function Profile() {
    const navigate = useNavigate();
    const { user, logout, createPreference, updateCreatePreference, updatePassword } = useAuth();
    const { canViewNotes } = usePermissions();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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

    return (
        <div className="p-4 space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
                    <User className="w-8 h-8 text-slate-300" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">{user?.name}</h1>
                    <p className="text-muted-foreground">{user?.role}</p>
                    {user?.username && <p className="text-sm text-muted-foreground">@{user.username}</p>}
                </div>
            </div>

            {canViewNotes && (
                <div className="glass-card p-4 rounded-xl space-y-4">
                    <h3 className="font-semibold">Quick Notes</h3>
                    <Notes />
                </div>
            )}

            {/* Only show password change for non-demo users */}
            {user?.id && !user.id.startsWith('673ffa1234567890abcdef0') && (
                <div className="glass-card p-4 rounded-xl space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Lock size={18} />
                        Change Password
                    </h3>

                    <div className="space-y-3">
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
                </div>
            )}

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
        </div>
    );
}
