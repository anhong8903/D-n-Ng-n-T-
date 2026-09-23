import React, { useState } from 'react';
import { useApp } from '../Store';
import { LogIn, UserPlus } from 'lucide-react';

export default function LoginView() {
  const { login, register } = useApp();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (username.trim() && pin.trim()) {
      if (isRegistering) {
        const res = register(username.trim(), pin.trim());
        if (res.success) {
          setSuccessMessage(`Đăng ký thành công! ID của bạn là ${res.uid}. Đang tự động đăng nhập...`);
          setTimeout(() => {
            login(username.trim(), pin.trim());
          }, 2500);
        } else {
          setError(res.message);
        }
      } else {
        const res = login(username.trim(), pin.trim());
        if (!res.success) {
          setError(res.message);
        }
      }
    }
  };

  return (
    <div className="glass-panel animate-slide-up" style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <h2 className="text-center">{isRegistering ? 'Tạo Tài Khoản Mới' : 'Đăng Nhập'}</h2>
      <p className="text-center mb-4">
        {isRegistering 
          ? 'Tạo tài khoản để lưu thông tin ngân hàng của bạn.' 
          : 'Tham gia chia tiền cùng hội bạn!'}
      </p>
      
      {error && <div className="mb-4" style={{ color: 'var(--danger)', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
      {successMessage && <div className="mb-4 p-2" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', fontSize: '0.9rem', textAlign: 'center', border: '1px solid rgba(34, 197, 94, 0.5)', borderRadius: '0.5rem' }}>{successMessage}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Tên của bạn</label>
          <input 
            type="text" 
            placeholder="Ví dụ: Nam" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        
        <div className="input-group mb-4">
          <label>Mã PIN (Mật khẩu)</label>
          <input 
            type="password" 
            placeholder="Nhập mã PIN" 
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
          />
        </div>
        
        <button type="submit" className="btn btn-primary mb-2">
          {isRegistering ? <><UserPlus size={20} /> Đăng Ký</> : <><LogIn size={20} /> Bắt đầu ngay</>}
        </button>
      </form>
      
      <div className="text-center mt-4">
        <button 
          onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccessMessage(''); }} 
          style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {isRegistering ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Tạo mới'}
        </button>
      </div>
    </div>
  );
}
