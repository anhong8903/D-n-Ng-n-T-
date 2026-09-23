import React, { useState } from 'react';
import { useApp } from '../Store';
import { Plus, Trash2, Users, Receipt } from 'lucide-react';

export default function BillView() {
  const { bill, updateBillDetails, addParticipant, removeParticipant, addItem, removeItem, toggleItemAssignment } = useApp();
  
  const [newParticipant, setNewParticipant] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemTaxable, setNewItemTaxable] = useState(true);

  const handleAddParticipant = (e) => {
    e.preventDefault();
    if (newParticipant.trim()) {
      addParticipant(newParticipant.trim());
      setNewParticipant('');
    }
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (newItemName.trim() && newItemPrice) {
      addItem({
        name: newItemName.trim(),
        price: parseFloat(newItemPrice),
        taxable: newItemTaxable,
        assignedTo: []
      });
      setNewItemName('');
      setNewItemPrice('');
      setNewItemTaxable(true);
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
          <Users size={24} /> Người tham gia
        </h2>
        <form onSubmit={handleAddParticipant} className="flex-between mb-4" style={{ gap: '0.5rem' }}>
          <input 
            type="text" 
            placeholder="Nhập tên người..." 
            value={newParticipant}
            onChange={(e) => setNewParticipant(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ width: 'auto' }}>
            <Plus size={20} /> Thêm
          </button>
        </form>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {bill.participants.map(p => (
            <div key={p} className="badge" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}>
              {p}
              <Trash2 size={14} style={{ cursor: 'pointer', color: 'var(--danger)' }} onClick={() => removeParticipant(p)} />
            </div>
          ))}
          {bill.participants.length === 0 && <p className="text-muted">Chưa có ai tham gia.</p>}
        </div>
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
          <div className="input-group mb-2">
            <input 
              type="number" 
              placeholder="Giá tiền (VD: 250000)" 
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(e.target.value)}
              required
            />
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
                  {bill.participants.map(p => {
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
                  {bill.participants.length === 0 && <span className="text-muted" style={{fontSize: '0.8rem'}}>Hãy thêm người tham gia trước</span>}
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
