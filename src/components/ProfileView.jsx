import React, { useState, useRef } from 'react';
import { useApp } from '../Store';
import { QrCode, Save, Image as ImageIcon } from 'lucide-react';
import jsQR from 'jsqr';

// Helper function to parse EMVCo (VietQR) string
function parseVietQR(qrString) {
  let index = 0;
  const tags = {};
  while (index < qrString.length) {
    const tag = qrString.substring(index, index + 2);
    index += 2;
    const length = parseInt(qrString.substring(index, index + 2), 10);
    index += 2;
    const value = qrString.substring(index, index + length);
    index += length;
    tags[tag] = value;
  }
  return tags;
}

function extractBankInfoFromQR(qrString) {
  try {
    const tags = parseVietQR(qrString);
    if (tags['38']) {
      const tag38 = parseVietQR(tags['38']);
      if (tag38['01']) {
        const benInfo = parseVietQR(tag38['01']);
        const bankBin = benInfo['00'];
        const bankAccount = benInfo['01'];
        if (bankBin && bankAccount) {
          return { bankBin, bankAccount };
        }
      }
    }
  } catch (e) {
    console.error("Failed to parse VietQR", e);
  }
  return null;
}

export default function ProfileView() {
  const { user, updateProfile } = useApp();
  const [qrImage, setQrImage] = useState(user.qrImage || null);
  const [bankBin, setBankBin] = useState(user.bankBin || '');
  const [bankAccount, setBankAccount] = useState(user.bankAccount || '');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Read QR code using jsQR
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, img.width, img.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });

        if (code && code.data) {
          const bankInfo = extractBankInfoFromQR(code.data);
          if (bankInfo) {
            setBankBin(bankInfo.bankBin);
            setBankAccount(bankInfo.bankAccount);
          } else {
            setErrorMsg("Không tìm thấy thông tin ngân hàng trong mã QR này. Mã có thể không phải VietQR chuẩn.");
            // Reset if invalid
            setBankBin('');
            setBankAccount('');
          }
        } else {
          setErrorMsg("Không thể đọc được mã QR từ ảnh này. Vui lòng chọn ảnh khác rõ nét hơn.");
          setBankBin('');
          setBankAccount('');
        }

        // Resize image for display/storage
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        const resizeCanvas = document.createElement('canvas');
        resizeCanvas.width = width;
        resizeCanvas.height = height;
        const resizeCtx = resizeCanvas.getContext('2d');
        resizeCtx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = resizeCanvas.toDataURL('image/jpeg', 0.8);
        setQrImage(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!bankBin || !bankAccount) {
      setErrorMsg("Chưa đọc được thông tin ngân hàng hợp lệ. Vui lòng thử ảnh khác.");
      return;
    }
    updateProfile(qrImage, bankBin, bankAccount);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="glass-panel animate-slide-up">
      <h2><QrCode size={24} style={{ display: 'inline', marginRight: '8px' }} /> Cài đặt thanh toán</h2>
      <p className="mb-4">Tải lên hình ảnh mã QR VietQR của bạn. Hệ thống sẽ tự động quét số tài khoản để tạo QR động (có sẵn số tiền) cho từng người nợ nhé!</p>
      
      <form onSubmit={handleSubmit}>
        <div className="input-group mb-4" style={{ alignItems: 'center' }}>
          <div 
            style={{
              width: '200px',
              height: '200px',
              border: '2px dashed var(--glass-border)',
              borderRadius: '1rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.2)',
              position: 'relative'
            }}
            onClick={() => fileInputRef.current.click()}
          >
            {qrImage ? (
              <img src={qrImage} alt="QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <>
                <ImageIcon size={40} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Bấm để chọn ảnh QR</span>
              </>
            )}
          </div>
          <input 
            type="file" 
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
        </div>

        {bankAccount && (
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--success)', margin: 0, fontWeight: '500' }}>✅ Quét thành công!</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>
              NH: {bankBin} | STK: {bankAccount}
            </p>
          </div>
        )}

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--danger)', margin: 0, fontSize: '0.9rem' }}>{errorMsg}</p>
          </div>
        )}
        
        <button type="submit" className="btn btn-primary" disabled={!bankBin || !bankAccount}>
          <Save size={20} />
          {saved ? 'Đã lưu mã QR thành công!' : 'Lưu mã QR'}
        </button>
      </form>
    </div>
  );
}
