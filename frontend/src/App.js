import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [people, setPeople] = useState([]);
  const [balances, setBalances] = useState({});
  const [settlements, setSettlements] = useState([]);
  
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    paid_by: '',
    split_type: 'EQUAL',
    split_data: []
  });
  
  const [newPerson, setNewPerson] = useState('');

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expRes, peopleRes, balRes, setRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/people'),
        fetch('/api/settlements/balances'),
        fetch('/api/settlements')
      ]);
      
      setExpenses(await expRes.json());
      setPeople(await peopleRes.json());
      setBalances(await balRes.json());
      setSettlements(await setRes.json());
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        fetchData();
        setFormData({
          amount: '',
          description: '',
          paid_by: '',
          split_type: 'EQUAL',
          split_data: []
        });
      }
    } catch (err) {
      console.error('Error adding expense:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addPersonToSplit = () => {
    if (newPerson && !formData.split_data.some(p => p.person === newPerson)) {
      setFormData({
        ...formData,
        split_data: [...formData.split_data, { person: newPerson, value: 0 }]
      });
      setNewPerson('');
    }
  };

  const deleteExpense = async (id) => {
    try {
      await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Error deleting expense:', err);
    }
  };

  return (
    <div className="container">
      <h1>Split App</h1>
      
      {/* Add Expense Form */}
      <form onSubmit={handleSubmit} className="card">
        <h2>Add New Expense</h2>
        
        <div className="form-group">
          <label>Description:</label>
          <input 
            type="text" 
            name="description" 
            value={formData.description}
            onChange={handleChange}
            required 
          />
        </div>
        
        <div className="form-group">
          <label>Amount (¥):</label>
          <input 
            type="number" 
            name="amount" 
            step="0.01"
            min="0.01"
            value={formData.amount}
            onChange={handleChange}
            required 
          />
        </div>
        
        <div className="form-group">
          <label>Paid By:</label>
          <select 
            name="paid_by" 
            value={formData.paid_by}
            onChange={handleChange}
            required
          >
            <option value="">Select Person</option>
            {people.map(person => (
              <option key={person} value={person}>{person}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Split Type:</label>
          <select 
            name="split_type" 
            value={formData.split_type}
            onChange={handleChange}
          >
            <option value="EQUAL">Equal</option>
            <option value="PERCENTAGE">Percentage</option>
            <option value="SHARE">Share</option>
            <option value="EXACT">Exact</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Add Participants:</label>
          <div className="split-controls">
            <select 
              value={newPerson}
              onChange={(e) => setNewPerson(e.target.value)}
            >
              <option value="">Select Person</option>
              {people.map(person => (
                <option key={person} value={person}>{person}</option>
              ))}
            </select>
            <button type="button" onClick={addPersonToSplit}>
              Add
            </button>
          </div>
          
          {formData.split_data.map((person, index) => (
            <div key={index} className="split-person">
              <span>{person.person}</span>
              {formData.split_type !== 'EQUAL' && (
                <input 
                  type="number"
                  min="0"
                  value={person.value}
                  onChange={(e) => {
                    const newSplit = [...formData.split_data];
                    newSplit[index].value = parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, split_data: newSplit });
                  }}
                />
              )}
            </div>
          ))}
        </div>
        
        <button type="submit">Add Expense</button>
      </form>
      
      {/* Balances & Settlements */}
      <div className="row">
        <div className="card">
          <h2>Balances</h2>
          <ul>
            {Object.entries(balances).map(([person, balance]) => (
              <li key={person}>
                {person}: {balance >= 0 ? `owed ¥${balance}` : `owes ¥${-balance}`}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="card">
          <h2>Settlements</h2>
          <ul>
            {settlements.map((settlement, index) => (
              <li key={index}>
                {settlement.from} pays ¥{settlement.amount} to {settlement.to}
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {/* Expense List */}
      <div className="card">
        <h2>Expense History</h2>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
              <th>Paid By</th>
              <th>Split Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(expense => (
              <tr key={expense._id}>
                <td>{expense.description}</td>
                <td>¥{expense.amount.toFixed(2)}</td>
                <td>{expense.paid_by}</td>
                <td>{expense.split_type}</td>
                <td>
                  <button onClick={() => deleteExpense(expense._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;