import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('split_bill_user');
    return saved ? JSON.parse(saved) : null; 
  });

  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const saved = localStorage.getItem('split_bill_users');
    return saved ? JSON.parse(saved) : {}; // { username: { pin, bankName, bankAccount } }
  });

  const [bill, setBill] = useState(() => {
    const saved = localStorage.getItem('split_bill_current');
    return saved ? JSON.parse(saved) : {
      name: 'Bữa ăn hôm nay',
      vat: 0,
      tip: 0,
      items: [], 
      participants: [] 
    };
  });

  useEffect(() => {
    if (user) localStorage.setItem('split_bill_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('split_bill_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    localStorage.setItem('split_bill_current', JSON.stringify(bill));
  }, [bill]);

  const register = (username, pin) => {
    if (registeredUsers[username]) {
      return { success: false, message: 'Tên đăng nhập đã tồn tại!' };
    }
    setRegisteredUsers(prev => ({
      ...prev,
      [username]: { pin, bankName: '', bankAccount: '' }
    }));
    return { success: true };
  };

  const login = (username, pin) => {
    const account = registeredUsers[username];
    if (!account) {
      return { success: false, message: 'Tài khoản không tồn tại. Vui lòng đăng ký!' };
    }
    if (account.pin !== pin) {
      return { success: false, message: 'Sai mã PIN!' };
    }
    
    const loggedInUser = { username, pin, bankName: account.bankName, bankAccount: account.bankAccount };
    setUser(loggedInUser);
    
    setBill(prev => {
      if (!prev.participants.includes(username)) {
        return { ...prev, participants: [...prev.participants, username] };
      }
      return prev;
    });
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('split_bill_user');
  };

  const updateProfile = (bankName, bankAccount) => {
    setUser(prev => ({ ...prev, bankName, bankAccount }));
    setRegisteredUsers(prev => ({
      ...prev,
      [user.username]: { ...prev[user.username], bankName, bankAccount }
    }));
  };

  const updateBillDetails = (name, vat, tip) => {
    setBill(prev => ({ ...prev, name, vat, tip }));
  };

  const addParticipant = (name) => {
    if (!name || bill.participants.includes(name)) return;
    setBill(prev => ({ ...prev, participants: [...prev.participants, name] }));
  };

  const removeParticipant = (name) => {
    setBill(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p !== name),
      items: prev.items.map(item => ({
        ...item,
        assignedTo: item.assignedTo.filter(p => p !== name)
      }))
    }));
  };

  const addItem = (item) => {
    setBill(prev => ({ ...prev, items: [...prev.items, { ...item, id: Date.now().toString() }] }));
  };

  const removeItem = (id) => {
    setBill(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  };

  const toggleItemAssignment = (itemId, participant) => {
    setBill(prev => {
      return {
        ...prev,
        items: prev.items.map(item => {
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
    });
  };

  // Helper to calculate total for each participant
  const calculateTotals = () => {
    const totals = {};
    bill.participants.forEach(p => totals[p] = { itemsCost: 0, taxCost: 0, tipCost: 0, total: 0, items: [] });
    
    // First pass: items cost
    let totalTaxableItemsCost = 0;
    let totalItemsCost = 0;

    bill.items.forEach(item => {
      if (item.assignedTo.length === 0) return;
      const costPerPerson = item.price / item.assignedTo.length;
      totalItemsCost += item.price;
      
      if (item.taxable) {
        totalTaxableItemsCost += item.price;
      }

      item.assignedTo.forEach(p => {
        if (totals[p]) {
          totals[p].itemsCost += costPerPerson;
          totals[p].items.push({ name: item.name, cost: costPerPerson, taxable: item.taxable });
        }
      });
    });

    // Calculate overall tip and tax pool
    // Assuming VAT is applied only to taxable items
    const totalVatAmount = totalTaxableItemsCost * (bill.vat / 100);
    // Tip is applied to the grand total of items or just the items cost. Usually tip is % of total before tax.
    const totalTipAmount = totalItemsCost * (bill.tip / 100);

    // Second pass: distribute tax and tip proportionally based on items cost
    bill.participants.forEach(p => {
      if (totalTaxableItemsCost > 0) {
        // Person's share of taxable items
        const personTaxableCost = totals[p].items.filter(i => i.taxable).reduce((sum, i) => sum + i.cost, 0);
        const taxShare = totalVatAmount * (personTaxableCost / totalTaxableItemsCost);
        totals[p].taxCost = taxShare;
      }

      if (totalItemsCost > 0) {
        const tipShare = totalTipAmount * (totals[p].itemsCost / totalItemsCost);
        totals[p].tipCost = tipShare;
      }

      totals[p].total = totals[p].itemsCost + totals[p].taxCost + totals[p].tipCost;
    });

    return totals;
  };

  return (
    <AppContext.Provider value={{
      user, register, login, logout, updateProfile,
      bill, updateBillDetails, addParticipant, removeParticipant,
      addItem, removeItem, toggleItemAssignment, calculateTotals
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
