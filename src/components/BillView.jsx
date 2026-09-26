import React, { useState } from 'react';
import { useApp } from '../Store';
import { Plus, Trash2, Users, Receipt, Search, Wallet } from 'lucide-react';

export default function BillView() {
  const { user, registeredUsers, rooms, activeRoomId, updateBillDetails, addItem, removeItem, toggleItemAssignment, addMemberToRoom, removeMemberFromRoom } = useApp();
  const room = rooms[activeRoomId];
  const bill = room?.bill;
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemTaxable, setNewItemTaxable] = useState(true);
  const [newItemPaidBy, setNewItemPaidBy] = useState(user.username);
  
  const [searchQuery, setSearchQuery] = useState('');

  if (!room) return null;

  // Search logic for adding members
  const searchResults = Object.keys(registeredUsers).map(username => ({
    username,
    ...registeredUsers[username]
  })).filter(u => {
    if (room.members.includes(u.username)) return false; 
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return (u.username && u.username.toLowerCase().includes(q)) || (u.uid && u.uid.toLowerCase().includes(q));
  });


  const handleAddItem = (e) => {
    e.preventDefault();
    if (newItemName.trim() && newItemPrice) {
      addItem({
        name: newItemName.trim(),
        price: parseFloat(newItemPrice),
        taxable: newItemTaxable,
        paidBy: newItemPaidBy,
        assignedTo: []
      });
      setNewItemName('');
      setNewItemPrice('');
      setNewItemTaxable(true);
      // Keep newItemPaidBy as is, usually one person pays for multiple things at once
    }
  };

  return (
    <div className="animate-slide-up">
      {/* Bill Details */}
      <div className="glass-panel">
        <h2 className="flex-center" style={{justifyContent: 'flex-start', gap: '0.5rem'}}>
          <Receipt size={24} /> Hóa đơn
        </h2>
        <div className="input-group">
          <label>Tên hóa đơn</label>
          <input 
            type="text" 
            value={bill.name}
            onChange={(e) => updateBillDetails(e.target.value, bill.vat, bill.tip)}
          />
        </div>
        <div className="flex-between" style={{ gap: '1rem', marginTop: '1rem' }}>
          <div className="input-group" style={{ flex: 1 }}>
            <label>% VAT</label>
            <input 
              type="number" 
              min="0"
              value={bill.vat}
              onChange={(e) => updateBillDetails(bill.name, parseFloat(e.target.value) || 0, bill.tip)}
            />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label>% Tip</label>
            <input 
              type="number" 
              min="0"
              value={bill.tip}
              onChange={(e) => updateBillDetails(bill.name, bill.vat, parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="glass-panel">
        <h2 className="flex-center" style={{justifyContent: 'flex-start', gap: '0.5rem'}}>
          <Users size={24} /> Thành viên nhóm
        </h2>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem', marginBottom: '1rem' }}>
          {room.members.map(p => (
            <div key={p} className="badge" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}>
              {p}
              {p !== user.username && <Trash2 size={14} style={{ cursor: 'pointer', color: 'var(--danger)' }} onClick={() => removeMemberFromRoom(activeRoomId, p)} />}
            </div>
          ))}
        </div>

        <div className="input-group mb-2">
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Thêm thành viên (tìm theo Tên/ID)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '35px' }}
            />
          </div>
        </div>

        {searchQuery && (
          <div style={{ background: 'rgba(255,255,255,0.4)', borderRadius: '0.5rem', padding: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
            {searchResults.length === 0 ? (
              <p className="text-muted text-center" style={{ fontSize: '0.9rem', margin: '0.5rem 0' }}>Không tìm thấy ai</p>
            ) : (
              searchResults.map(u => (
                <div 
                  key={u.username}
                  className="flex-between"
                  style={{ 
                    padding: '0.5rem 1rem', 
                    borderRadius: '0.25rem', 
                    cursor: 'pointer',
                    background: 'transparent',
                    marginBottom: '2px'
                  }}
                  onClick={() => {
                    addMemberToRoom(activeRoomId, u.username);
                    setSearchQuery('');
                  }}
                >
                  <div>
                    <strong>{u.username}</strong> <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{u.uid}</span>
                  </div>
                  <Plus size={16} color="var(--primary)" />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="glass-panel">
        <h2>Danh sách món ăn</h2>
        
        {/* Add item form */}
        <form onSubmit={handleAddItem} className="mb-4 p-3" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '1rem' }}>
          <div className="input-group mb-2">
            <input 
              type="text" 
              placeholder="Tên món (VD: Lẩu Thái)" 
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              required
            />
          </div>
          <div className="input-group mb-3">
            <input 
              type="number" 
              placeholder="Giá tiền (VD: 250000)" 
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(e.target.value)}
              required
            />
          </div>
          <div className="input-group mb-3">
            <label style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Wallet size={16} /> Ai đã trả tiền món này?
            </label>
            <select 
              value={newItemPaidBy}
              onChange={(e) => setNewItemPaidBy(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--glass-border)',
                background: 'rgba(255,255,255,0.1)',
                color: 'var(--text-color)',
                outline: 'none'
              }}
            >
              {room.members.map(m => (
                <option key={m} value={m} style={{ color: '#000' }}>
                  {m === user.username ? 'Tôi (' + m + ')' : m}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-between mb-4">
            <div className="toggle-wrapper" onClick={() => setNewItemTaxable(!newItemTaxable)}>
              <div className={`toggle-bg ${newItemTaxable ? 'active' : ''}`}>
                <div className="toggle-knob"></div>
              </div>
              <span>Có tính thuế (VAT)</span>
            </div>
          </div>
          <button type="submit" className="btn btn-primary">
            <Plus size={20} /> Thêm món
          </button>
        </form>

        {/* List items */}
        <div className="item-list">
          {bill.items.map(item => (
            <div key={item.id} className="item-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div className="flex-between mb-2">
                <div>
                  <strong style={{ fontSize: '1.1rem' }}>{item.name}</strong>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {item.price.toLocaleString('vi-VN')} đ {item.taxable ? '(Có thuế)' : '(Không thuế)'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
                    Người trả: <strong>{item.paidBy || room.members[0]}</strong>
                  </div>
                </div>
                <button 
                  className="btn btn-danger" 
                  style={{ width: 'auto', padding: '0.5rem' }}
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div style={{ marginTop: '0.5rem' }}>
                <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>Ai đã ăn món này?</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {room.members.map(p => {
                    const isAssigned = item.assignedTo.includes(p);
                    return (
                      <div 
                        key={p} 
                        className={`badge ${isAssigned ? 'active' : ''}`}
                        style={{ cursor: 'pointer', padding: '0.5rem' }}
                        onClick={() => toggleItemAssignment(item.id, p)}
                      >
                        {p}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
          {bill.items.length === 0 && <p className="text-center text-muted mt-2">Chưa có món nào.</p>}
        </div>
      </div>
    </div>
  );
}
