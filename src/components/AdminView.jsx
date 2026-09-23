import React, { useState } from 'react';
import { useApp } from '../Store';
import { Shield, Trash2, Users, LogOut, Key } from 'lucide-react';

export default function AdminView() {
  const { registeredUsers, deleteUser, logout, user, changePin } = useApp();
  const [userToDelete, setUserToDelete] = useState(null);
  
  const [newPassword, setNewPassword] = useState('');
  const [passwordChanged, setPasswordChanged] = useState(false);
  
  // Filter out admin from list
  const usersList = Object.keys(registeredUsers)
    .filter(username => username !== 'admin')
    .map(username => ({ username, ...registeredUsers[username] }));

  const handleDeleteClick = (username) => {
    setUserToDelete(username);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUser(userToDelete);
      setUserToDelete(null);
    }
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (newPassword.trim()) {
      changePin(user.username, newPassword.trim());
      setPasswordChanged(true);
      setNewPassword('');
      setTimeout(() => setPasswordChanged(false), 3000);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', paddingBottom: '80px' }}>
      <header className="flex-between mb-4" style={{ padding: '1rem', background: 'rgba(255, 0, 0, 0.1)', borderRadius: '1rem', border: '1px solid rgba(255, 0, 0, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={24} color="var(--danger)" />
          <div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: 0, color: 'var(--danger)' }}>Admin Panel</h1>
            <p style={{ fontSize: '0.8rem', margin: 0 }}>
              Xin chào, <strong>{user.username}</strong>
            </p>
          </div>
        </div>
        <button onClick={logout} className="btn" style={{ width: 'auto', padding: '0.5rem', background: 'transparent', color: 'var(--text-muted)' }} title="Đăng xuất">
          <LogOut size={20} />
        </button>
      </header>

      <div className="glass-panel animate-slide-up mb-4">
        <h2 className="flex-center mb-4" style={{justifyContent: 'flex-start', gap: '0.5rem'}}>
          <Users size={24} /> Quản lý người dùng
        </h2>
        
        <p className="mb-4">
          Tổng số người dùng: <strong>{usersList.length}</strong>
        </p>

        {usersList.length === 0 ? (
          <p className="text-center text-muted">Chưa có người dùng nào đăng ký.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '500px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Username</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>ID</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Ngân hàng</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Số TK</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.username} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>{u.username}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>{u.uid}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{u.bankName || '-'}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{u.bankAccount || '-'}</td>
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDeleteClick(u.username)}
                        className="btn btn-danger"
                        style={{ width: 'auto', padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        <Trash2 size={16} style={{ display: 'inline', marginRight: '0.25rem' }} /> Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass-panel animate-slide-up mb-4">
        <h2 className="flex-center mb-4" style={{justifyContent: 'flex-start', gap: '0.5rem'}}>
          <Key size={24} /> Đổi Mật Khẩu Admin
        </h2>
        
        <form onSubmit={handlePasswordChange}>
          <div className="input-group mb-4">
            <label>Mật khẩu (Mã PIN) mới</label>
            <input 
              type="text" 
              placeholder="Nhập mật khẩu mới..." 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            {passwordChanged ? 'Đã đổi mật khẩu thành công!' : 'Lưu Mật Khẩu'}
          </button>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-panel animate-slide-up" style={{ width: '100%', maxWidth: '400px' }}>
            <h3 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Xóa người dùng?</h3>
            <p className="mb-4">
              Bạn có chắc chắn muốn xóa tài khoản <strong>{userToDelete}</strong> khỏi hệ thống? 
              Hành động này không thể hoàn tác và sẽ xóa họ khỏi tất cả các nhóm.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn" style={{ background: 'transparent', border: '1px solid var(--glass-border)' }} onClick={() => setUserToDelete(null)}>
                Hủy bỏ
              </button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
