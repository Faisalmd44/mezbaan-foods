import React, { useState } from 'react';
import { Staff } from '../types';
import { Users, UserCheck, Plus, X, Shield, Lock } from 'lucide-react';

interface StaffScreenProps {
  staffList: Staff[];
  currentStaff: Staff;
  onSwitchStaff: (staff: Staff) => void;
  onAddStaff: (name: string, pin: string, role: 'ADMIN' | 'CASHIER') => void;
}

export const StaffScreen: React.FC<StaffScreenProps> = ({
  staffList,
  currentStaff,
  onSwitchStaff,
  onAddStaff
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'CASHIER'>('CASHIER');
  const [error, setError] = useState<string | null>(null);

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a staff name');
      return;
    }
    if (!pin.trim()) {
      setError('Please provide a numeric PIN');
      return;
    }

    onAddStaff(name.trim(), pin.trim(), role);
    setShowAddDialog(false);
    setName('');
    setPin('');
    setError(null);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full pb-safe-nav">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-[#1E1E24]">Staff Accounts</h2>
          <p className="text-xs text-[#FF6B35] font-semibold mt-0.5">
            Current Logged In: {currentStaff.name} ({currentStaff.role})
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddDialog(true)}
          className="py-2 px-3.5 bg-[#1E1E24] text-white rounded-xl text-xs font-bold hover:bg-black transition-all flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Staff</span>
        </button>
      </div>

      <div className="space-y-2.5">
        {staffList.map((s) => {
          const isCurrent = s.id === currentStaff.id;
          return (
            <div
              key={s.id}
              onClick={() => onSwitchStaff(s)}
              className={`rounded-2xl border p-4 flex items-center justify-between cursor-pointer transition-all ${
                isCurrent
                  ? 'bg-[#1E1E24] text-white border-[#1E1E24] shadow-md'
                  : 'bg-white text-[#1E1E24] border-[#E2E4E8] hover:border-neutral-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isCurrent ? 'bg-white/10 text-white' : 'bg-[#F8F9FA] text-[#1E1E24]'
                  }`}
                >
                  {s.role === 'ADMIN' ? (
                    <Shield className="w-5 h-5 text-[#FF6B35]" />
                  ) : (
                    <Users className="w-5 h-5 text-[#6B6B75]" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight">{s.name}</h4>
                  <span
                    className={`text-xs block mt-0.5 ${
                      isCurrent ? 'text-white/70' : 'text-[#6B6B75]'
                    }`}
                  >
                    Role: {s.role}
                  </span>
                </div>
              </div>

              {isCurrent ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF6B35]/20 text-[#FF6B35] text-xs font-bold">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Active Cashier</span>
                </div>
              ) : (
                <button
                  type="button"
                  className="text-xs font-semibold text-[#6B6B75] bg-[#F8F9FA] border border-[#E2E4E8] px-3 py-1.5 rounded-lg hover:text-[#1E1E24]"
                >
                  Switch
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Staff Modal */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-[#E2E4E8] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#FF6B35]" />
                <h3 className="font-bold text-[#1E1E24] text-base">Add Staff Member</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDialog(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-4 space-y-3.5">
              {error && (
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                  {error}
                </p>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#1E1E24] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#E2E4E8] rounded-xl text-sm text-[#1E1E24] focus:outline-hidden focus:border-[#1E1E24]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E1E24] mb-1">
                  Login PIN
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6B6B75] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="4-digit PIN"
                    className="w-full pl-9 pr-3 py-2 bg-[#F8F9FA] border border-[#E2E4E8] rounded-xl text-sm text-[#1E1E24] focus:outline-hidden focus:border-[#1E1E24]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E1E24] mb-1">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('CASHIER')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      role === 'CASHIER'
                        ? 'bg-[#1E1E24] text-white border-[#1E1E24]'
                        : 'bg-[#F8F9FA] text-[#6B6B75] border-[#E2E4E8]'
                    }`}
                  >
                    Cashier
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      role === 'ADMIN'
                        ? 'bg-[#1E1E24] text-white border-[#1E1E24]'
                        : 'bg-[#F8F9FA] text-[#6B6B75] border-[#E2E4E8]'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDialog(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#E2E4E8] text-xs font-semibold text-[#6B6B75] hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#1E1E24] text-white text-xs font-bold hover:bg-black"
                >
                  Save Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
