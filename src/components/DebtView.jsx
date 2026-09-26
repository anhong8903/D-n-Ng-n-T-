import React, { useState } from 'react';
import { useApp } from '../Store';
import { Wallet, QrCode, ArrowDownToLine, ArrowUpFromLine, Copy, Check } from 'lucide-react';

const CopyableField = ({ label, value, format = false }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const displayValue = format ? Number(value).toLocaleString('vi-VN') : value;

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
      <div style={{ textAlign: 'left', flex: 1, overflow: 'hidden' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{label}</div>
        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayValue}</div>
      </div>
      <button onClick={handleCopy} className="btn" style={{ padding: '0.5rem', background: 'var(--glass-bg)', color: copied ? 'var(--success)' : 'var(--primary)', width: 'auto', border: '1px solid var(--glass-border)', marginLeft: '0.5rem' }}>
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  );
};

export default function DebtView() {
  const { user, rooms, calculateTotals, registeredUsers } = useApp();
  const [expandedQr, setExpandedQr] = useState(null);
  
  // Find all rooms where the user is a member
  const myRooms = Object.keys(rooms)
    .map(roomId => ({ id: roomId, ...rooms[roomId] }))
    .filter(room => room.members.includes(user.username));

  let totalOwe = 0; // I owe others
  let totalReceive = 0; // Others owe me
  const roomDetails = [];

  myRooms.forEach(room => {
    const totals = calculateTotals(room.id);
    const myBalance = totals[user.username]?.balance || 0;
    
    if (myBalance > 0) totalOwe += myBalance;
    if (myBalance < 0) totalReceive += Math.abs(myBalance);

    // Find who owes money (debtors) and who needs to receive money (creditors)
    const creditors = [];
    const debtors = [];
    
    room.members.forEach(m => {
      if (!totals[m]) return;
      if (totals[m].balance < 0) creditors.push({ username: m, amount: Math.abs(totals[m].balance) });
      if (totals[m].balance > 0) debtors.push({ username: m, amount: totals[m].balance });
    });

    if (Math.abs(myBalance) > 0.01) {
      roomDetails.push({
        roomName: room.name,
        roomId: room.id,
        myBalance,
        creditors,
        debtors
      });
    }
  });

  return (
    <div className="animate-slide-up">
      <h2 className="text-center mb-4"><Wallet size={24} style={{display:'inline', marginRight:'0.5rem'}}/> Quản lý Nợ</h2>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-panel text-center" style={{ flex: 1, background: 'linear-gradient(135deg, rgba(236,72,153,0.1) 0%, rgba(168,85,247,0.1) 100%)', padding: '1rem' }}>
          <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Bạn cần trả:</p>
          <h2 style={{ margin: 0, color: 'var(--danger)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
            <ArrowUpFromLine size={18} /> {Math.round(totalOwe).toLocaleString('vi-VN')} đ
          </h2>
        </div>
        <div className="glass-panel text-center" style={{ flex: 1, background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(16,185,129,0.1) 100%)', padding: '1rem' }}>
          <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Bạn cần thu:</p>
          <h2 style={{ margin: 0, color: 'var(--success)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
            <ArrowDownToLine size={18} /> {Math.round(totalReceive).toLocaleString('vi-VN')} đ
          </h2>
        </div>
      </div>

      <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Chi tiết từng nhóm:</h3>
      
      {roomDetails.length === 0 ? (
        <div className="glass-panel text-center">
          <p className="text-muted">Không có khoản nợ nào. Đã thanh toán đầy đủ! 🎉</p>
        </div>
      ) : (
        <div className="item-list">
          {roomDetails.map((detail, idx) => (
            <div key={idx} className="item-card" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '1.25rem' }}>
              <div className="flex-between mb-3" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
                <strong style={{ fontSize: '1.1rem' }}>{detail.roomName}</strong>
                {detail.myBalance > 0 ? (
                  <div style={{ color: 'var(--danger)', fontWeight: 'bold' }}>Nợ: {Math.round(detail.myBalance).toLocaleString('vi-VN')} đ</div>
                ) : (
                  <div style={{ color: 'var(--success)', fontWeight: 'bold' }}>Thu: {Math.round(Math.abs(detail.myBalance)).toLocaleString('vi-VN')} đ</div>
                )}
              </div>
              
              {detail.myBalance > 0 ? (
                <>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Hãy thanh toán cho những người sau:</p>
                  {detail.creditors.map(c => (
                    <div key={c.username} className="flex-between mb-2" style={{ background: 'var(--glass-bg)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem' }}>
                      <span><strong>{c.username}</strong></span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--success)', fontSize: '0.9rem' }}>Đang đợi thu {Math.round(c.amount).toLocaleString('vi-VN')} đ</span>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', width: 'auto' }}
                          onClick={() => setExpandedQr(expandedQr === `${detail.roomId}-${c.username}` ? null : `${detail.roomId}-${c.username}`)}
                        >
                          <QrCode size={14} /> Trả
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Những người sau đang nợ tiền trong nhóm:</p>
                  {detail.debtors.map(d => (
                    <div key={d.username} className="flex-between mb-2" style={{ background: 'var(--glass-bg)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem' }}>
                      <span><strong>{d.username}</strong></span>
                      <span style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>Nợ {Math.round(d.amount).toLocaleString('vi-VN')} đ</span>
                    </div>
                  ))}
                </>
              )}

              {/* QR Code Section for Paying */}
              {detail.creditors.map(c => {
                const qrKey = `${detail.roomId}-${c.username}`;
                if (expandedQr !== qrKey) return null;
                
                const profile = registeredUsers[c.username];
                const hasQrInfo = profile?.bankBin && profile?.bankAccount;
                const hasStaticQr = !!profile?.qrImage;
                // Assuming you pay your entire balance to this person for simplicity in this UI
                const payAmount = Math.round(Math.min(detail.myBalance, c.amount));
                const transferContent = `Tra tien cho ${c.username}`;

                return (
                  <div key={`qr-${c.username}`} className="animate-slide-up" style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--glass-border)', textAlign: 'center' }}>
                    <h4 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Thông tin chuyển khoản</h4>
                    {hasQrInfo ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ background: '#fff', padding: '1rem', borderRadius: '1rem', display: 'inline-block', margin: '0 auto', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                          <img 
                            src={`https://img.vietqr.io/image/${profile.bankBin}-${profile.bankAccount}-qr_only.png?amount=${payAmount}&addInfo=${transferContent}&accountName=${c.username}`} 
                            alt="QR Code" 
                            style={{ width: '100%', maxWidth: '220px', display: 'block' }} 
                          />
                        </div>
                        <div style={{ background: 'var(--glass-bg)', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>
                          <CopyableField label="Ngân hàng" value={profile.bankBin} />
                          <CopyableField label="Chủ tài khoản" value={c.username.toUpperCase()} />
                          <CopyableField label="Số tài khoản" value={profile.bankAccount} />
                          <CopyableField label="Số tiền" value={payAmount.toString()} format={true} />
                          <CopyableField label="Nội dung" value={transferContent} />
                        </div>
                      </div>
                    ) : hasStaticQr ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ background: '#fff', padding: '1rem', borderRadius: '1rem', display: 'inline-block', margin: '0 auto', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                          <img 
                            src={profile.qrImage} 
                            alt="QR Code" 
                            style={{ width: '100%', maxWidth: '220px', display: 'block' }} 
                          />
                        </div>
                        <div style={{ background: 'var(--glass-bg)', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>
                           <CopyableField label="Số tiền cần chuyển" value={payAmount.toString()} format={true} />
                           <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, textAlign: 'left' }}>
                             * Bạn hãy quét mã QR phía trên bằng ứng dụng ngân hàng và nhập đúng số tiền này.
                           </p>
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontSize: '0.9rem', color: 'var(--danger)', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem' }}>
                        {c.username} chưa thiết lập tài khoản ngân hàng. Vui lòng nhắc {c.username} cập nhật thông tin ở mục Cài đặt.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
