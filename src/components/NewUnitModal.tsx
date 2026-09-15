import React, { useState } from 'react';
import { 
  X, 
  Building, 
  Calendar, 
  User, 
  Layers, 
  PlusCircle, 
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Unit, TechnicianUser } from '../types';
import { ACTIVE_TECHNICIANS } from '../services/db';
import { soundManager } from '../services/audio';

interface NewUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: TechnicianUser;
  technicians?: TechnicianUser[];
  onSwitchToSupervisor?: () => void;
  onCreateUnit: (unitData: Omit<Unit, 'id' | 'last_updated'>) => Promise<void>;
}

export const NewUnitModal: React.FC<NewUnitModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  technicians,
  onCreateUnit
}) => {
  const [unitNumber, setUnitNumber] = useState('');
  const [floorPlan, setFloorPlan] = useState<Unit['floor_plan']>('2B/2B');
  const [building, setBuilding] = useState('Cedar Ridge - Bldg B');
  const [floor, setFloor] = useState<number>(2);
  const [assignedTechId, setAssignedTechId] = useState(currentUser.id);
  const [moveOutDate, setMoveOutDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetReadyDate, setTargetReadyDate] = useState(
    new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  
  // Supervisor Password / Authorization State
  const [supervisorPassword, setSupervisorPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isCurrentSupervisor = currentUser.role === 'Maintenance Supervisor';

  const checkSupervisorPassword = (pwd: string): boolean => {
    const trimmed = pwd.trim().toLowerCase();
    const storedPin = (localStorage.getItem('utt_supervisor_pin') || '').trim().toLowerCase();
    const validPasswords = ['1234', 'supervisor', 'supervisor123', 'super123', 'admin'];
    if (storedPin) {
      validPasswords.push(storedPin);
    }
    return validPasswords.includes(trimmed);
  };

  const isPasswordValid = checkSupervisorPassword(supervisorPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!unitNumber.trim()) {
      setAuthError('Please enter a valid Unit Number.');
      return;
    }

    // Enforce Supervisor Password Check
    if (!checkSupervisorPassword(supervisorPassword)) {
      soundManager.playAlert();
      setAuthError('Supervisor password required. Enter authorized password (e.g. 1234 or supervisor123).');
      return;
    }

    setIsSubmitting(true);
    soundManager.playSyncSuccess();
    try {
      await onCreateUnit({
        unit_number: unitNumber.trim(),
        current_status: 'Inspection',
        floor_plan: floorPlan,
        building,
        floor: Number(floor),
        assigned_technician_id: assignedTechId,
        move_out_date: moveOutDate,
        target_ready_date: targetReadyDate,
        notes: notes.trim() || 'Unit turnover intake initiated.'
      });
      onClose();
    } catch (err) {
      console.error(err);
      setAuthError('Failed to create unit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0D131F] border border-slate-700 rounded-2xl overflow-hidden shadow-2xl my-auto animate-scaleUp">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#00FFB4]/15 text-[#00FFB4] border border-[#00FFB4]/30">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Chakra_Petch'] font-bold text-lg text-white">
                NEW UNIT TURNOVER INTAKE
              </h3>
              <p className="text-xs font-mono text-slate-400">
                Initializes 6 trade workflows & tracking punch-list
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-sans">
          
          {/* Unit Number & Floor Plan */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-slate-300 font-mono text-[11px] font-semibold">
                Unit Number *
              </label>
              <input
                id="input-unit-number"
                type="text"
                required
                placeholder="e.g. 504"
                value={unitNumber}
                onChange={(e) => {
                  setUnitNumber(e.target.value);
                  if (authError) setAuthError(null);
                }}
                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-['Chakra_Petch'] font-bold text-base focus:outline-none focus:border-[#00FFB4]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-slate-300 font-mono text-[11px]">Floor Plan *</label>
              <select
                id="select-floor-plan"
                value={floorPlan}
                onChange={(e) => setFloorPlan(e.target.value as Unit['floor_plan'])}
                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-[#00FFB4] cursor-pointer"
              >
                <option value="1B/1B">1 Bed / 1 Bath (1B/1B)</option>
                <option value="2B/2B">2 Bed / 2 Bath (2B/2B)</option>
                <option value="Studio">Studio</option>
                <option value="3B/2B">3 Bed / 2 Bath (3B/2B)</option>
                <option value="Townhome">Townhome</option>
              </select>
            </div>
          </div>

          {/* Building & Floor */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-slate-300 font-mono text-[11px]">Building</label>
              <input
                id="input-building"
                type="text"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-[#00FFB4]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-slate-300 font-mono text-[11px]">Floor Level</label>
              <input
                id="input-floor-level"
                type="number"
                min={1}
                max={20}
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value))}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-[#00FFB4]"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-slate-300 font-mono text-[11px]">Move-Out Date</label>
              <input
                id="input-move-out-date"
                type="date"
                value={moveOutDate}
                onChange={(e) => setMoveOutDate(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-[#00FFB4]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-slate-300 font-mono text-[11px]">Target Rent-Ready Date</label>
              <input
                id="input-target-ready-date"
                type="date"
                value={targetReadyDate}
                onChange={(e) => setTargetReadyDate(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-[#00FFB4] font-bold focus:outline-none focus:border-[#00FFB4]"
              />
            </div>
          </div>

          {/* Assigned Tech Lead */}
          <div className="space-y-1">
            <label className="block text-slate-300 font-mono text-[11px]">Assigned Turn Tech Lead</label>
            <select
              id="select-assigned-tech"
              value={assignedTechId}
              onChange={(e) => setAssignedTechId(e.target.value)}
              className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-[#00FFB4]"
            >
              {(technicians && technicians.length > 0 ? technicians : ACTIVE_TECHNICIANS).map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.trade_specialty})
                </option>
              ))}
            </select>
          </div>

          {/* Initial Notes */}
          <div className="space-y-1">
            <label className="block text-slate-300 font-mono text-[11px]">Initial Move-Out Notes</label>
            <textarea
              id="input-unit-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Previous tenant left keys on counter. Wall scuffs near entryway."
              className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00FFB4]"
            />
          </div>

          {/* Supervisor Security Password / Authorization Box */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-amber-300 font-mono text-xs font-bold">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>SUPERVISOR SECURITY PASSWORD *</span>
              </div>
              {isPasswordValid ? (
                <span className="flex items-center gap-1 text-[10px] font-mono text-[#00FFB4] bg-[#00FFB4]/10 px-2 py-0.5 rounded border border-[#00FFB4]/30">
                  <ShieldCheck className="w-3 h-3" />
                  <span>AUTHORIZED</span>
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-400">
                  PIN: <code className="text-amber-300">1234</code>
                </span>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-4 h-4 text-slate-400" />
              </div>
              <input
                id="supervisor-password-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={supervisorPassword}
                onChange={(e) => {
                  setSupervisorPassword(e.target.value);
                  if (authError) setAuthError(null);
                }}
                placeholder="Enter Supervisor password (e.g. 1234)"
                className={`w-full pl-9 pr-20 py-2 rounded-lg bg-slate-900 border text-xs font-mono transition-colors focus:outline-none ${
                  isPasswordValid 
                    ? 'border-[#00FFB4] text-[#00FFB4]' 
                    : 'border-slate-700 text-slate-100 focus:border-amber-400'
                }`}
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-white rounded"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                {!isPasswordValid && (
                  <button
                    type="button"
                    onClick={() => {
                      setSupervisorPassword('1234');
                      if (authError) setAuthError(null);
                    }}
                    className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700"
                    title="Fill default supervisor password (1234)"
                  >
                    1234
                  </button>
                )}
              </div>
            </div>

            {/* Error Message */}
            {authError && (
              <div className="flex items-center gap-1.5 text-[11px] text-red-400 font-mono bg-red-950/40 p-2 rounded border border-red-500/30 animate-shake">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
                <span>{authError}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
              <span>Required to confirm intake authorization</span>
              {isCurrentSupervisor && (
                <span className="text-[#00FFB4]">
                  Active Operator: {currentUser.name} (Supervisor)
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              id="cancel-new-unit-btn"
              type="button"
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-new-unit-btn"
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#00FFB4] text-black font-bold font-mono text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,255,180,0.3)] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>INITIALIZING...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>INITIALIZE TURNOVER</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
