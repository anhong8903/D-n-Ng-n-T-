import React, { useState } from 'react';
import { useApp } from '../Store';
import { QrCode, ChevronDown, ChevronUp } from 'lucide-react';

export default function SummaryView() {
  const { user, rooms, activeRoomId, calculateTotals } = useApp();
  const room = rooms[activeRoomId];
  const bill = room?.bill;
  const totals = calculateTotals();
  const [expanded, setExpanded] = useState({});

  if (!room) return null;

  const toggleExpand = (p) => {
    setExpanded(prev => ({ ...prev, [p]: !prev[p] }));
  };

  const hasQrInfo = user.bankBin && user.bankAccount;
  const hasStaticQr = !!user?.qrImage?.trim();

  return (
    <div className="animate-slide-up">
      <h2 className="text-center mb-4">Tổng Kết Thanh Toán</h2>
      
      {room.members.length === 0 && (
        <div className="glass-panel text-center">
          <p>Chưa có ai tham gia để tính toán.</p>
        </div>
      )}

      {room.members.map(p => {
        const total = totals[p].total;
        const isMe = p === user.username;
        const isExpanded = expanded[p];
        
        return (
          <div key={p} className="glass-panel" style={{ padding: '1rem', marginBottom: '1rem' }}>
            <div className="flex-between" style={{ cursor: 'pointer' }} onClick={() => toggleExpand(p)}>
              <div>
                <strong style={{ fontSize: '1.2rem', color: isMe ? 'var(--primary)' : 'inherit' }}>
                  {p} {isMe && '(Bạn)'}
                </strong>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Cần trả: <strong style={{ color: 'var(--success)' }}>{total.toLocaleString('vi-VN')} đ</strong>
                </div>
              </div>
              <div>
                {isExpanded ? <ChevronUp /> : <ChevronDown />}
              </div>
            </div>

            {isExpanded && (
              <div className="animate-slide-up" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Chi tiết món:</h4>
                <ul style={{ listStyle: 'none', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  {totals[p].items.map((item, idx) => (
                    <li key={idx} className="flex-between mb-1">
                      <span>{item.name} {item.taxable && <span style={{fontSize:'0.75rem', color:'var(--accent)'}}>(+Tax)</span>}</span>
                      <span>{item.cost.toLocaleString('vi-VN')} đ</span>
                    </li>
                  ))}
                  {totals[p].items.length === 0 && <li>Không ăn món nào</li>}
                </ul>
                
                <div className="flex-between mb-1" style={{ fontSize: '0.9rem' }}>
                  <span>Tiền món:</span>
                  <span>{totals[p].itemsCost.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex-between mb-1" style={{ fontSize: '0.9rem' }}>
                  <span>Thuế (VAT {bill.vat}%):</span>
                  <span>{totals[p].taxCost.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex-between mb-2" style={{ fontSize: '0.9rem' }}>
                  <span>Phí phục vụ (Tip {bill.tip}%):</span>
                  <span>{totals[p].tipCost.toLocaleString('vi-VN')} đ</span>
                </div>

                {!isMe && total > 0 && (
                  <div style={{ marginTop: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.4)', padding: '1rem', borderRadius: '1rem' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}><QrCode size={18} style={{display:'inline', marginRight:'0.5rem'}}/> Quét mã trả tiền</h4>
                    {hasQrInfo ? (
                      <>
                        <img 
                          src={`https://img.vietqr.io/image/${user.bankBin}-${user.bankAccount}-compact2.png?amount=${Math.round(total)}&addInfo=Tra tien cho ${user.username}&accountName=${user.username}`} 
                          alt="QR Code" 
                          style={{ width: '100%', maxWidth: '250px', borderRadius: '0.5rem' }} 
                        />
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                          NH: {user.bankBin} | STK: {user.bankAccount}
                        </p>
                      </>
                    ) : hasStaticQr ? (
                      <img src={user.qrImage} alt="QR Code" style={{ width: '100%', maxWidth: '250px', borderRadius: '0.5rem' }} />
                    ) : (
                      <p style={{ fontSize: '0.9rem', color: 'var(--danger)' }}>
                        Người nhận chưa cập nhật mã QR.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
