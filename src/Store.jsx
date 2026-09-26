import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('split_bill_user');
    return saved ? JSON.parse(saved) : null; 
  });

  const [registeredUsers, setRegisteredUsers] = useState({});
  const [rooms, setRooms] = useState({});
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: usersData } = await supabase.from('users').select('*');
      const { data: roomsData } = await supabase.from('rooms').select('*');
      
      const usersMap = {};
      usersData?.forEach(u => usersMap[u.username] = u.data);

      const roomsMap = {};
      roomsData?.forEach(r => roomsMap[r.id] = r.data);

      // Auto Migrate from LocalStorage if Supabase is empty
      if (!usersData || usersData.length === 0) {
        console.log('Migrating users to Supabase...');
        const savedUsers = localStorage.getItem('split_bill_users');
        if (savedUsers) {
          const parsed = JSON.parse(savedUsers);
          for (const username of Object.keys(parsed)) {
            await supabase.from('users').upsert({ username, data: parsed[username] });
            usersMap[username] = parsed[username];
          }
        } else {
           const adminData = { uid: '#ADMIN', pin: 'admin', bankName: '', bankAccount: '' };
           await supabase.from('users').upsert({ username: 'admin', data: adminData });
           usersMap['admin'] = adminData;
        }
      }

      if (!roomsData || roomsData.length === 0) {
        console.log('Migrating rooms to Supabase...');
        const savedRooms = localStorage.getItem('split_bill_rooms');
        if (savedRooms) {
          const parsed = JSON.parse(savedRooms);
          for (const roomId of Object.keys(parsed)) {
            await supabase.from('rooms').upsert({ id: roomId, data: parsed[roomId] });
            roomsMap[roomId] = parsed[roomId];
          }
        }
      }

      setRegisteredUsers(usersMap);
      setRooms(roomsMap);
      setIsReady(true);
    };

    fetchInitialData();

    const usersSub = supabase.channel('users_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, payload => {
        if (payload.eventType === 'DELETE') {
          setRegisteredUsers(prev => {
            const next = { ...prev };
            delete next[payload.old.username];
            return next;
          });
        } else {
          setRegisteredUsers(prev => ({
            ...prev,
            [payload.new.username]: payload.new.data
          }));
        }
      }).subscribe();

    const roomsSub = supabase.channel('rooms_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, payload => {
        if (payload.eventType === 'DELETE') {
          setRooms(prev => {
            const next = { ...prev };
            delete next[payload.old.id];
            return next;
          });
        } else {
          setRooms(prev => ({
            ...prev,
            [payload.new.id]: payload.new.data
          }));
        }
      }).subscribe();

    return () => {
      supabase.removeChannel(usersSub);
      supabase.removeChannel(roomsSub);
    };
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('split_bill_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('split_bill_user');
    }
  }, [user]);

  const updateSupabaseUser = async (username, data) => {
    await supabase.from('users').upsert({ username, data });
  };

  const updateSupabaseRoom = async (id, data) => {
    await supabase.from('rooms').upsert({ id, data });
  };

  const register = (username, pin) => {
    if (registeredUsers[username]) {
      return { success: false, message: 'Tên đăng nhập đã tồn tại!' };
    }
    const uid = '#' + Math.floor(1000 + Math.random() * 9000).toString();
    const newUser = { uid, pin, bankName: '', bankAccount: '', qrImage: '' };
    
    setRegisteredUsers(prev => ({ ...prev, [username]: newUser }));
    updateSupabaseUser(username, newUser);
    return { success: true, uid };
  };

  const login = (username, pin) => {
    const account = registeredUsers[username];
    if (!account) return { success: false, message: 'Tài khoản không tồn tại. Vui lòng đăng ký!' };
    if (account.pin !== pin) return { success: false, message: 'Sai mã PIN!' };
    
    setUser({ username, uid: account.uid, pin, bankName: account.bankName, bankAccount: account.bankAccount, qrImage: account.qrImage });
    setActiveRoomId(null);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setActiveRoomId(null);
  };

  const updateProfile = (qrImage, bankBin = '', bankAccount = '') => {
    setUser(prev => ({ ...prev, qrImage, bankBin, bankAccount }));
    const updatedData = { ...registeredUsers[user.username], qrImage, bankBin, bankAccount };
    setRegisteredUsers(prev => ({ ...prev, [user.username]: updatedData }));
    updateSupabaseUser(user.username, updatedData);
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
    updateSupabaseRoom(roomId, newRoom);
  };

  const addMemberToRoom = (roomId, username) => {
    const room = rooms[roomId];
    if (room.members.includes(username)) return;
    const updatedRoom = { ...room, members: [...room.members, username] };
    setRooms(prev => ({ ...prev, [roomId]: updatedRoom }));
    updateSupabaseRoom(roomId, updatedRoom);
  };

  const removeMemberFromRoom = (roomId, username) => {
    const room = rooms[roomId];
    const updatedRoom = {
      ...room,
      members: room.members.filter(m => m !== username),
      bill: {
        ...room.bill,
        items: room.bill.items.map(item => ({
          ...item,
          assignedTo: item.assignedTo.filter(m => m !== username)
        }))
      }
    };
    setRooms(prev => ({ ...prev, [roomId]: updatedRoom }));
    updateSupabaseRoom(roomId, updatedRoom);
  };

  const updateBillDetails = (name, vat, tip) => {
    if (!activeRoomId) return;
    const room = rooms[activeRoomId];
    const updatedRoom = {
      ...room,
      bill: { ...room.bill, name, vat, tip }
    };
    setRooms(prev => ({ ...prev, [activeRoomId]: updatedRoom }));
    updateSupabaseRoom(activeRoomId, updatedRoom);
  };

  const addItem = (item) => {
    if (!activeRoomId) return;
    const room = rooms[activeRoomId];
    const updatedRoom = {
      ...room,
      bill: { ...room.bill, items: [...room.bill.items, { ...item, id: Date.now().toString() }] }
    };
    setRooms(prev => ({ ...prev, [activeRoomId]: updatedRoom }));
    updateSupabaseRoom(activeRoomId, updatedRoom);
  };

  const removeItem = (id) => {
    if (!activeRoomId) return;
    const room = rooms[activeRoomId];
    const updatedRoom = {
      ...room,
      bill: { ...room.bill, items: room.bill.items.filter(i => i.id !== id) }
    };
    setRooms(prev => ({ ...prev, [activeRoomId]: updatedRoom }));
    updateSupabaseRoom(activeRoomId, updatedRoom);
  };

  const toggleItemAssignment = (itemId, participant) => {
    if (!activeRoomId) return;
    const room = rooms[activeRoomId];
    const updatedRoom = {
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
    };
    setRooms(prev => ({ ...prev, [activeRoomId]: updatedRoom }));
    updateSupabaseRoom(activeRoomId, updatedRoom);
  };

  const deleteUser = (usernameToDelete) => {
    if (usernameToDelete === 'admin') return; 
    setRegisteredUsers(prev => {
      const next = { ...prev };
      delete next[usernameToDelete];
      return next;
    });
    supabase.from('users').delete().eq('username', usernameToDelete);

    setRooms(prev => {
      const nextRooms = { ...prev };
      Object.keys(nextRooms).forEach(roomId => {
         const room = nextRooms[roomId];
         if (room.members.includes(usernameToDelete)) {
           const updatedRoom = {
             ...room,
             members: room.members.filter(m => m !== usernameToDelete),
             bill: {
               ...room.bill,
               items: room.bill.items.map(item => ({
                 ...item,
                 assignedTo: item.assignedTo.filter(m => m !== usernameToDelete)
               }))
             }
           };
           nextRooms[roomId] = updatedRoom;
           updateSupabaseRoom(roomId, updatedRoom);
         }
      });
      return nextRooms;
    });
  };

  const changePin = (username, newPin) => {
    const updatedData = { ...registeredUsers[username], pin: newPin };
    setRegisteredUsers(prev => ({ ...prev, [username]: updatedData }));
    updateSupabaseUser(username, updatedData);
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
      
      const payer = item.paidBy || room.members[0]; 
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
      totals[p].total = totals[p].totalConsumed; 
      totals[p].balance = totals[p].totalConsumed - totals[p].totalPaid;
    });

    return totals;
  };

  if (!isReady) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', color: 'var(--primary)' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '1rem', fontWeight: 600 }}>Đang kết nối Máy chủ...</p>
      </div>
    );
  }

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
