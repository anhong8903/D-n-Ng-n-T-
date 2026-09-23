import React, { useState } from 'react';
import { useApp } from '../Store';
import { Users, Plus, Search, LogOut } from 'lucide-react';

export default function GroupsView() {
  const { user, rooms, setActiveRoomId, createRoom, registeredUsers, logout } = useApp();
  const [isCreating, setIsCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);

  // Find rooms where user is a member
  const myRooms = Object.values(rooms).filter(room => room.members.includes(user.username));

  // Search logic
  const searchResults = Object.keys(registeredUsers).map(username => ({
    username,
    ...registeredUsers[username]
  })).filter(u => {
    if (u.username === user.username) return false; // Don't show self
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return (u.username && u.username.toLowerCase().includes(q)) || (u.uid && u.uid.toLowerCase().includes(q));
  });

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (newRoomName.trim()) {
      createRoom(newRoomName.trim(), selectedMembers);
      setIsCreating(false);
      setNewRoomName('');
      setSelectedMembers([]);
    }
  };

  const toggleMemberSelection = (username) => {
    if (selectedMembers.includes(username)) {
      setSelectedMembers(prev => prev.filter(m => m !== username));
    } else {
      setSelectedMembers(prev => [...prev, username]);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', paddingBottom: '80px' }}>
      <header className="flex-between mb-4" style={{ padding: '1rem', background: 'var(--glass-bg)', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 0 }}>Nhóm của tôi</h1>
          <p style={{ fontSize: '0.8rem', margin: 0 }}>
            Xin chào, <strong style={{color: 'var(--primary)'}}>{user.username} {user.uid}</strong>!
          </p>
        </div>
        <button onClick={logout} className="btn" style={{ width: 'auto', padding: '0.5rem', background: 'transparent', color: 'var(--text-muted)' }} title="Đăng xuất">
          <LogOut size={20} />
        </button>
      </header>

      {!isCreating ? (
        <div className="animate-slide-up">
          <button 
            className="btn btn-primary mb-4" 
            onClick={() => setIsCreating(true)}
            style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
          >
            <Plus size={20} /> Tạo Nhóm Mới
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {myRooms.length === 0 ? (
              <div className="glass-panel text-center text-muted">
                Bạn chưa tham gia nhóm nào. Hãy tạo một nhóm mới!
              </div>
            ) : (
              myRooms.map(room => (
                <div 
                  key={room.id} 
                  className="glass-panel" 
                  style={{ cursor: 'pointer', transition: 'transform 0.2s', padding: '1.5rem' }}
                  onClick={() => setActiveRoomId(room.id)}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                >
                  <div className="flex-between mb-2">
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{room.name}</h3>
                    <div className="badge" style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                      <Users size={14} /> {room.members.length}
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Các thành viên: {room.members.join(', ')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="glass-panel animate-slide-up">
          <h2 className="mb-4">Tạo Nhóm Mới</h2>
          <form onSubmit={handleCreateRoom}>
            <div className="input-group mb-4">
              <label>Tên nhóm</label>
              <input 
                type="text" 
                placeholder="Ví dụ: Du lịch Vũng Tàu" 
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                required
              />
            </div>

            <div className="input-group mb-2">
              <label>Thêm thành viên</label>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Tìm theo Tên hoặc ID (VD: #8492)..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '35px' }}
                />
              </div>
            </div>

            {/* Search Results */}
            {searchQuery && (
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', padding: '0.5rem', marginBottom: '1rem', maxHeight: '150px', overflowY: 'auto' }}>
                {searchResults.length === 0 ? (
                  <p className="text-muted text-center" style={{ fontSize: '0.9rem', margin: '0.5rem 0' }}>Không tìm thấy ai</p>
                ) : (
                  searchResults.map(u => {
                    const isSelected = selectedMembers.includes(u.username);
                    return (
                      <div 
                        key={u.username}
                        className={`flex-between ${isSelected ? 'active' : ''}`}
                        style={{ 
                          padding: '0.5rem 1rem', 
                          borderRadius: '0.25rem', 
                          cursor: 'pointer',
                          background: isSelected ? 'var(--primary)' : 'transparent',
                          color: isSelected ? '#fff' : 'inherit',
                          marginBottom: '2px'
                        }}
                        onClick={() => toggleMemberSelection(u.username)}
                      >
                        <div>
                          <strong>{u.username}</strong> <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{u.uid}</span>
                        </div>
                        {isSelected && <span style={{ fontSize: '0.8rem' }}>Đã chọn</span>}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Selected Members Badges */}
            {selectedMembers.length > 0 && (
              <div className="mb-4">
                <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Đã chọn:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div className="badge active">Bạn</div>
                  {selectedMembers.map(m => (
                    <div key={m} className="badge active" style={{ cursor: 'pointer' }} onClick={() => toggleMemberSelection(m)}>
                      {m} &times;
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn" style={{ background: 'transparent', border: '1px solid var(--glass-border)' }} onClick={() => { setIsCreating(false); setSelectedMembers([]); setSearchQuery(''); }}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary">
                Tạo Nhóm
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
