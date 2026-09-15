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
  ShieldAlert,
  ShieldCheck
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
  onSwitchToSupervisor,
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isSupervisor = currentUser.role === 'Maintenance Supervisor';

  // If user is not Maintenance Supervisor, block intake and show authorization requirement
  if (!isSupervisor) {
    return (
      <div id="new-unit-unauthorized-modal" className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
        <div className="relative w-full max-w-md bg-[#0D131F] border border-amber-500/40 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.15)] animate-scaleUp">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-amber-950/20">
            <div className="flex items-center gap-2 text-amber-400 font-['Chakra_Petch'] font-bold text-sm tracking-wide">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>SUPERVISOR AUTHORIZATION REQUIRED</span>
            </div>
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.2)]">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h4 className="font-['Chakra_Petch'] font-bold text-white text-base">
                Unit Intake Restricted
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                Only the <strong className="text-amber-300">Maintenance Supervisor</strong> has permission to register new units or remove units from the turnover pipeline.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-left space-y-1 text-xs font-mono">
              <div className="text-slate-500 text-[10px] uppercase">Active Operator:</div>
              <div className="flex items-center justify-between text-slate-200">
                <span className="font-bold text-white">{currentUser.name}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700 text-[10px]">
                  {currentUser.role}
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              {onSwitchToSupervisor && (
                <button
                  id="switch-to-supervisor-btn"
                  type="button"
                  onClick={() => {
                    soundManager.playSyncSuccess();
                    onSwitchToSupervisor();
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#00FFB4] text-black font-mono font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,255,180,0.3)]"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>SWITCH TO SUPERVISOR</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  onClose();
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitNumber.trim()) return;

    setIsSubmitting(true);
    soundManager.playClick();
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-[#0D131F] border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
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
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-sans">
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-slate-300 font-mono text-[11px]">Unit Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. 504"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-['Chakra_Petch'] font-bold text-base focus:outline-none focus:border-[#00FFB4]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-slate-300 font-mono text-[11px]">Floor Plan *</label>
              <select
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-slate-300 font-mono text-[11px]">Building</label>
              <input
                type="text"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-[#00FFB4]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-slate-300 font-mono text-[11px]">Floor Level</label>
              <input
                type="number"
                min={1}
                max={20}
                value={floor}
                onChange={(e) => setFloor(Number(e.target.value))}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-[#00FFB4]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-slate-300 font-mono text-[11px]">Move-Out Date</label>
              <input
                type="date"
                value={moveOutDate}
                onChange={(e) => setMoveOutDate(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-[#00FFB4]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-slate-300 font-mono text-[11px]">Target Rent-Ready Date</label>
              <input
                type="date"
                value={targetReadyDate}
                onChange={(e) => setTargetReadyDate(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-[#00FFB4] font-bold focus:outline-none focus:border-[#00FFB4]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-slate-300 font-mono text-[11px]">Assigned Turn Tech Lead</label>
            <select
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

          <div className="space-y-1">
            <label className="block text-slate-300 font-mono text-[11px]">Initial Move-Out Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Previous tenant left keys on counter. Wall scuffs near entryway."
              className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00FFB4]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-[#00FFB4] text-black font-bold font-mono uppercase hover:brightness-110"
            >
              {isSubmitting ? 'Creating...' : 'Initialize Turnover'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
