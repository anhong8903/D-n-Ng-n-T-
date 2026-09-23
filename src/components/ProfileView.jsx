import React, { useState } from 'react';
import { useApp } from '../Store';
import { CreditCard, Save } from 'lucide-react';

export default function ProfileView() {
  const { user, updateProfile } = useApp();
  const [bankName, setBankName] = useState(user.bankName || '');
  const [bankAccount, setBankAccount] = useState(user.bankAccount || '');
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile(bankName, bankAccount);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="glass-panel animate-slide-up">
      <h2><CreditCard size={24} style={{ display: 'inline', marginRight: '8px' }} /> Cài đặt thanh toán</h2>
      <p className="mb-4">Nếu bạn là người trả tiền trước, hãy điền thông tin ngân hàng để mọi người có thể quét mã QR trả lại bạn nhé.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Ngân hàng (Ví dụ: Vietcombank, TPBank...)</label>
          <input 
            type="text" 
            placeholder="Tên hoặc Mã ngân hàng" 
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
          />
        </div>
        
        <div className="input-group mb-4">
          <label>Số tài khoản</label>
          <input 
            type="text" 
            placeholder="Nhập số tài khoản" 
            value={bankAccount}
            onChange={(e) => setBankAccount(e.target.value)}
          />
        </div>
        
        <button type="submit" className="btn btn-primary">
          <Save size={20} />
          {saved ? 'Đã lưu thành công!' : 'Lưu thông tin'}
        </button>
      </form>
    </div>
  );
}
