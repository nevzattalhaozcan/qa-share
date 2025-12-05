import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { User, Code } from 'lucide-react';

export default function RoleSelect() {
    const navigate = useNavigate();
    const { quickLogin } = useAuth();
    const { refetchData } = useData();

    const handleRoleSelect = async (role: 'QA' | 'DEV') => {
        quickLogin(role);
        // Fetch data after logging in
        await refetchData();
        navigate('/');
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        QA Share
                    </h1>
                    <p className="text-muted-foreground">Select your role to continue</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* QA Role */}
                    <button
                        onClick={() => handleRoleSelect('QA')}
                        className="glass-card p-8 rounded-2xl hover:bg-white/10 transition-all group space-y-4 flex flex-col items-center"
                    >
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <User size={40} className="text-white" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold">QA</h3>
                            <p className="text-sm text-muted-foreground mt-1">Quality Assurance</p>
                        </div>
                    </button>

                    {/* DEV Role */}
                    <button
                        onClick={() => handleRoleSelect('DEV')}
                        className="glass-card p-8 rounded-2xl hover:bg-white/10 transition-all group space-y-4 flex flex-col items-center"
                    >
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Code size={40} className="text-white" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold">DEV</h3>
                            <p className="text-sm text-muted-foreground mt-1">Developer</p>
                        </div>
                    </button>
                </div>

                <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                        Demo mode - No authentication required
                    </p>
                </div>
            </div>
        </div>
    );
}
