import React, { useState } from 'react';
import { useApp } from '../Store';
import { Wallet, QrCode } from 'lucide-react';

export default function DebtView() {
  const { user, rooms, calculateTotals, registeredUsers } = useApp();
  const [expandedQr, setExpandedQr] = useState(null);
  
  // Find all rooms where the user is a member
  const myRooms = Object.keys(rooms)
    .map(roomId => ({ id: roomId, ...rooms[roomId] }))
    .filter(room => room.members.includes(user.username));

  let totalDebt = 0;
  const debtsByRoom = [];

  myRooms.forEach(room => {
    // If user is the creator (first member), they don't owe money, they receive it.
    if (room.members[0] === user.username) return;

    const totals = calculateTotals(room.id);
    const myTotal = totals[user.username]?.total || 0;
    if (myTotal > 0) {
      totalDebt += myTotal;
      debtsByRoom.push({
        roomName: room.name,
        amount: myTotal,
        roomId: room.id,
        creator: room.members[0] // Assuming the first member is the creator/payer
      });
    }
  });

  return (
    <div className="animate-slide-up">
      <h2 className="text-center mb-4"><Wallet size={24} style={{display:'inline', marginRight:'0.5rem'}}/> Tiền cần trả</h2>
      
      <div className="glass-panel text-center mb-4" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.2) 0%, rgba(168,85,247,0.2) 100%)' }}>
        <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Tổng nợ của bạn:</p>
        <h1 style={{ margin: 0, color: 'var(--danger)', fontSize: '2.5rem' }}>
          {totalDebt.toLocaleString('vi-VN')} đ
        </h1>
      </div>

      <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Chi tiết từng nhóm:</h3>
      
      {debtsByRoom.length === 0 ? (
        <div className="glass-panel text-center">
          <p className="text-muted">Tuyệt vời! Bạn không nợ đồng nào cả. 🎉</p>
        </div>
      ) : (
        <div className="item-list">
          {debtsByRoom.map((debt, idx) => (
            <div key={idx} className="item-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div className="flex-between mb-2">
                <strong style={{ fontSize: '1.1rem' }}>{debt.roomName}</strong>
                <strong style={{ color: 'var(--danger)' }}>{debt.amount.toLocaleString('vi-VN')} đ</strong>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Chủ xị (người nhận): <strong>{debt.creator}</strong>
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', width: 'auto' }}
                  onClick={() => setExpandedQr(expandedQr === debt.roomId ? null : debt.roomId)}
                >
                  <QrCode size={16} /> Thanh toán
                </button>
              </div>

              {expandedQr === debt.roomId && (() => {
                const creatorProfile = registeredUsers[debt.creator];
                const hasQrInfo = creatorProfile?.bankBin && creatorProfile?.bankAccount;
                const hasStaticQr = !!creatorProfile?.qrImage;

                return (
                  <div className="animate-slide-up" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', textAlign: 'center' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Quét mã trả tiền cho {debt.creator}</h4>
                    {hasQrInfo ? (
                      <>
                        <img 
                          src={`https://img.vietqr.io/image/${creatorProfile.bankBin}-${creatorProfile.bankAccount}-compact2.png?amount=${Math.round(debt.amount)}&addInfo=Tra tien cho ${debt.creator}&accountName=${debt.creator}`} 
                          alt="QR Code" 
                          style={{ width: '100%', maxWidth: '250px', borderRadius: '0.5rem' }} 
                        />
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                          NH: {creatorProfile.bankBin} | STK: {creatorProfile.bankAccount}
                        </p>
                      </>
                    ) : hasStaticQr ? (
                      <img 
                        src={creatorProfile.qrImage} 
                        alt="QR Code" 
                        style={{ width: '100%', maxWidth: '250px', borderRadius: '0.5rem' }} 
                      />
                    ) : (
                      <p style={{ fontSize: '0.9rem', color: 'var(--danger)' }}>
                        {debt.creator} chưa cập nhật mã QR.
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
