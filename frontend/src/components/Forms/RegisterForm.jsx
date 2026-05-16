import { useState } from 'react';

const RegisterForm = ({ onSubmit, loading }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ name, email, password });
    };

    return (
        <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
                <label htmlFor="reg-name">Full Name</label>
                <input
                    id="reg-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="John Doe"
                />
            </div>
            <div className="form-group">
                <label htmlFor="reg-email">Email</label>
                <input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                />
            </div>
            <div className="form-group">
                <label htmlFor="reg-password">Password</label>
                <input
                    id="reg-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Min 6 characters"
                    minLength="6"
                />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating account...' : 'Register'}
            </button>
        </form>
    );
};

export default RegisterForm;
