import React, { useState } from 'react';
import { Expense } from '../types';
const API_URL = import.meta.env.EXPENSE_API_BASE;

export default function ExpenseForm({ onCreate }: { onCreate: (e: Expense) => void }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const res = await fetch(`${API_URL}/api/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, amount: Number(amount) }),
    });
    const data = await res.json();
    onCreate(data);
    setDescription('');
    setAmount('');
  };

  return (
    <form onSubmit={submit} style={{ marginBottom: 20 }}>
      <input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <input
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
        style={{ marginLeft: 8 }}
      />
      <button type="submit" style={{ marginLeft: 8 }}>
        Add
      </button>
    </form>
  );
}
