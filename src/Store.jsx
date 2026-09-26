import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('split_bill_user');
    let u = saved ? JSON.parse(saved) : null; 
    
    // Cập nhật UID cho phiên đăng nhập cũ
    if (u && !u.uid) {
       const savedUsers = localStorage.getItem('split_bill_users');
       const parsedUsers = savedUsers ? JSON.parse(savedUsers) : {};
       if (parsedUsers[u.username] && parsedUsers[u.username].uid) {
           u.uid = parsedUsers[u.username].uid;
       } else {
           u.uid = '#' + Math.floor(1000 + Math.random() * 9000).toString();
       }
       localStorage.setItem('split_bill_user', JSON.stringify(u));
    }
    return u;
  });

  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const saved = localStorage.getItem('split_bill_users');
    let users = saved ? JSON.parse(saved) : {}; // { username: { uid, pin, bankName, bankAccount } }
    
    // Tự động cấp ID cho những tài khoản cũ chưa có
    let modified = false;
    Object.keys(users).forEach(username => {
      if (!users[username].uid) {
        users[username].uid = '#' + Math.floor(1000 + Math.random() * 9000).toString();
        modified = true;
      }
    });

    // Tạo sẵn tài khoản admin nếu chưa có
    if (!users['admin']) {
      users['admin'] = { uid: '#ADMIN', pin: 'admin', bankName: '', bankAccount: '' };
      modified = true;
    }

    if (modified) {
      localStorage.setItem('split_bill_users', JSON.stringify(users));
    }
    
    return users;
  });

  const [rooms, setRooms] = useState(() => {
    const saved = localStorage.getItem('split_bill_rooms');
    return saved ? JSON.parse(saved) : {}; 
    // { roomId: { id, name, members: ['username1'], bill: { name, vat, tip, items: [] } } }
  });

  const [activeRoomId, setActiveRoomId] = useState(null);

  useEffect(() => {
    if (user) localStorage.setItem('split_bill_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('split_bill_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    localStorage.setItem('split_bill_rooms', JSON.stringify(rooms));
  }, [rooms]);

  const register = (username, pin) => {
    if (registeredUsers[username]) {
      return { success: false, message: 'Tên đăng nhập đã tồn tại!' };
    }
    const uid = '#' + Math.floor(1000 + Math.random() * 9000).toString();
    setRegisteredUsers(prev => ({
      ...prev,
      [username]: { uid, pin, bankName: '', bankAccount: '' }
    }));
    return { success: true, uid };
  };

  const login = (username, pin) => {
    const account = registeredUsers[username];
    if (!account) {
      return { success: false, message: 'Tài khoản không tồn tại. Vui lòng đăng ký!' };
    }
    if (account.pin !== pin) {
      return { success: false, message: 'Sai mã PIN!' };
    }
    
    const loggedInUser = { username, uid: account.uid, pin, bankName: account.bankName, bankAccount: account.bankAccount };
    setUser(loggedInUser);
    setActiveRoomId(null);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setActiveRoomId(null);
    localStorage.removeItem('split_bill_user');
  };

  const updateProfile = (qrImage, bankBin = '', bankAccount = '') => {
    setUser(prev => ({ ...prev, qrImage, bankBin, bankAccount }));
    setRegisteredUsers(prev => ({
      ...prev,
      [user.username]: { ...prev[user.username], qrImage, bankBin, bankAccount }
    }));
  };

  const createRoom = (name, memberUsernames) => {
    const roomId = 'room_' + Date.now();
    const newRoom = {
      id: roomId,
      name,
      members: Array.from(new Set([user.username, ...memberUsernames])),
      bill: { name: 'Bữa ăn hôm nay', vat: 0, tip: 0, items: [] }
    };
    setRooms(prev => ({ ...prev, [roomId]: newRoom }));
    setActiveRoomId(roomId);
  };

  const addMemberToRoom = (roomId, username) => {
    setRooms(prev => {
      const room = prev[roomId];
      if (room.members.includes(username)) return prev;
      return {
        ...prev,
        [roomId]: {
          ...room,
          members: [...room.members, username]
        }
      };
    });
  };

  const removeMemberFromRoom = (roomId, username) => {
    setRooms(prev => {
      const room = prev[roomId];
      return {
        ...prev,
        [roomId]: {
          ...room,
          members: room.members.filter(m => m !== username),
          bill: {
            ...room.bill,
            items: room.bill.items.map(item => ({
              ...item,
              assignedTo: item.assignedTo.filter(m => m !== username)
            }))
          }
        }
      };
    });
  };

  const updateBillDetails = (name, vat, tip) => {
    if (!activeRoomId) return;
    setRooms(prev => ({
      ...prev,
      [activeRoomId]: {
        ...prev[activeRoomId],
        bill: { ...prev[activeRoomId].bill, name, vat, tip }
      }
    }));
  };

  const addItem = (item) => {
    if (!activeRoomId) return;
    setRooms(prev => {
      const room = prev[activeRoomId];
      return {
        ...prev,
        [activeRoomId]: {
          ...room,
          bill: { ...room.bill, items: [...room.bill.items, { ...item, id: Date.now().toString() }] }
        }
      };
    });
  };

  const removeItem = (id) => {
    if (!activeRoomId) return;
    setRooms(prev => {
      const room = prev[activeRoomId];
      return {
        ...prev,
        [activeRoomId]: {
          ...room,
          bill: { ...room.bill, items: room.bill.items.filter(i => i.id !== id) }
        }
      };
    });
  };

  const toggleItemAssignment = (itemId, participant) => {
    if (!activeRoomId) return;
    setRooms(prev => {
      const room = prev[activeRoomId];
      return {
        ...prev,
        [activeRoomId]: {
          ...room,
          bill: {
            ...room.bill,
            items: room.bill.items.map(item => {
              if (item.id === itemId) {
                const hasParticipant = item.assignedTo.includes(participant);
                return {
                  ...item,
                  assignedTo: hasParticipant 
                    ? item.assignedTo.filter(p => p !== participant)
                    : [...item.assignedTo, participant]
                };
              }
              return item;
            })
          }
        }
      };
    });
  };

  const deleteUser = (usernameToDelete) => {
    if (usernameToDelete === 'admin') return; 
    setRegisteredUsers(prev => {
      const next = { ...prev };
      delete next[usernameToDelete];
      return next;
    });
    setRooms(prev => {
      const nextRooms = { ...prev };
      Object.keys(nextRooms).forEach(roomId => {
         nextRooms[roomId].members = nextRooms[roomId].members.filter(m => m !== usernameToDelete);
         nextRooms[roomId].bill.items = nextRooms[roomId].bill.items.map(item => ({
           ...item,
           assignedTo: item.assignedTo.filter(m => m !== usernameToDelete)
         }));
      });
      return nextRooms;
    });
  };

  const changePin = (username, newPin) => {
    setRegisteredUsers(prev => ({
      ...prev,
      [username]: { ...prev[username], pin: newPin }
    }));
  };

  const calculateTotals = (roomId = activeRoomId) => {
    if (!roomId) return {};
    const room = rooms[roomId];
    if (!room) return {};
    
    const bill = room.bill;
    const totals = {};
    room.members.forEach(p => {
      totals[p] = { itemsCost: 0, taxCost: 0, tipCost: 0, totalConsumed: 0, totalPaid: 0, balance: 0, items: [] };
    });

    bill.items.forEach(item => {
      if (item.assignedTo.length === 0) return;
      
      const payer = item.paidBy || room.members[0]; // Fallback to first member if undefined
      const itemTax = item.taxable ? item.price * (bill.vat / 100) : 0;
      const itemTip = item.price * (bill.tip / 100);
      const itemTotalCost = item.price + itemTax + itemTip;

      if (totals[payer]) {
        totals[payer].totalPaid += itemTotalCost;
      }

      const numConsumers = item.assignedTo.length;
      const baseShare = item.price / numConsumers;
      const taxShare = itemTax / numConsumers;
      const tipShare = itemTip / numConsumers;

      item.assignedTo.forEach(p => {
        if (totals[p]) {
          totals[p].itemsCost += baseShare;
          totals[p].taxCost += taxShare;
          totals[p].tipCost += tipShare;
          totals[p].totalConsumed += (baseShare + taxShare + tipShare);
          totals[p].items.push({ name: item.name, cost: baseShare, taxable: item.taxable });
        }
      });
    });

    room.members.forEach(p => {
      totals[p].total = totals[p].totalConsumed; // Keep backward compatibility for SummaryView
      totals[p].balance = totals[p].totalConsumed - totals[p].totalPaid;
    });

    return totals;
  };

  return (
    <AppContext.Provider value={{
      user, registeredUsers, register, login, logout, updateProfile, deleteUser, changePin,
      rooms, activeRoomId, setActiveRoomId, createRoom, addMemberToRoom, removeMemberFromRoom,
      updateBillDetails, addItem, removeItem, toggleItemAssignment, calculateTotals
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
