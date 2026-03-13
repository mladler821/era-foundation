import { useState, useEffect } from 'react';
import { collection, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useYear } from '../../hooks/useYear';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../ui/Modal';
import { CATEGORY_LABELS } from '../../types';
import type { Grant, Category, GrantType, GrantStatus } from '../../types';

interface GrantFormProps {
  open: boolean;
  onClose: () => void;
  grant?: Grant | null;
}

/** Initial empty form state — used for "Add Grant" mode */
function emptyForm() {
  return {
    granteeName: '',
    granteeId: '',
    category: 'jewish' as Category,
    purpose: '',
    amount: '',
    grantType: 'annual' as GrantType,
    paymentDate: '',
    status: 'considering' as GrantStatus,
    commitmentYear: '1',
    commitmentTotalYears: '1',
    acknowledgmentReceived: false,
    notes: '',
  };
}

export default function GrantForm({ open, onClose, grant }: GrantFormProps) {
  const { selectedYear } = useYear();
  const { profile } = useAuth();
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isEditing = !!grant;

  useEffect(() => {
    if (open) {
      setConfirmDelete(false);
      if (grant) {
        setForm({
          granteeName: grant.granteeName,
          granteeId: grant.granteeId,
          category: grant.category,
          purpose: grant.purpose,
          amount: String(grant.amount),
          grantType: grant.grantType,
          paymentDate: grant.paymentDate,
          status: grant.status,
          commitmentYear: String(grant.commitmentYear ?? 1),
          commitmentTotalYears: String(grant.commitmentTotalYears ?? 1),
          acknowledgmentReceived: grant.acknowledgmentReceived,
          notes: grant.notes,
        });
      } else {
        setForm(emptyForm());
      }
    }
  }, [open, grant]);

  const isMultiYear = form.grantType === 'multi-year';
  const amountNum = parseFloat(form.amount) || 0;
  const totalYearsNum = parseInt(form.commitmentTotalYears) || 1;
  const totalPledge = amountNum * totalYearsNum; // WHY: Each year pays the same annual amount, so total pledge = annual amount x total years

  function updateField<K extends keyof ReturnType<typeof emptyForm>>(
    key: K,
    value: ReturnType<typeof emptyForm>[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedYear || !profile) return;
    if (!form.granteeName.trim() || amountNum <= 0) return;

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const grantData = {
        granteeName: form.granteeName.trim(),
        granteeId: form.granteeId || '', // WHY: Empty string until searchable dropdown is built — preserves schema consistency
        category: form.category,
        purpose: form.purpose.trim(),
        amount: amountNum,
        grantType: form.grantType,
        paymentDate: form.paymentDate,
        status: form.status,
        acknowledgmentReceived: form.acknowledgmentReceived,
        notes: form.notes.trim(),
        addedBy: profile.uid,
        addedByName: profile.displayName,
        updatedAt: now,
        ...(isMultiYear
          ? {
              commitmentYear: parseInt(form.commitmentYear) || 1,
              commitmentTotalYears: totalYearsNum,
              commitmentTotalPledge: totalPledge,
            }
          : {
              // WHY: Explicitly clear multi-year fields when switching to annual so stale data doesn't persist
              commitmentYear: null,
              commitmentTotalYears: null,
              commitmentTotalPledge: null,
              commitmentId: null,
            }),
      };

      const grantsCollection = collection(db, 'years', selectedYear, 'grants');

      if (isEditing && grant) {
        await setDoc(doc(grantsCollection, grant.id), {
          ...grantData,
          createdAt: grant.createdAt,
        }, { merge: true });
      } else {
        await addDoc(grantsCollection, {
          ...grantData,
          createdAt: now,
        });
      }

      onClose();
    } catch (error) {
      console.error('Failed to save grant:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!grant || !selectedYear) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'years', selectedYear, 'grants', grant.id));
      onClose();
    } catch (error) {
      console.error('Failed to delete grant:', error);
    } finally {
      setSaving(false);
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  const inputClass =
    'w-full rounded-lg border border-card-border px-3 py-2.5 text-[14px] text-text-dark focus:outline-none focus:ring-2 focus:ring-purple/30 focus:border-purple min-h-[44px]';
  const labelClass = 'block text-[13px] font-medium text-purple-dark mb-1';
  const selectClass = `${inputClass} appearance-none bg-white`;

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Edit Grant' : 'Add Grant'} maxWidth="max-w-xl">
      <form onSubmit={handleSave} className="space-y-4">
        {/* Grantee */}
        <div>
          <label className={labelClass}>Grantee</label>
          <input
            type="text"
            value={form.granteeName}
            onChange={(e) => updateField('granteeName', e.target.value)}
            placeholder="Organization name"
            required
            className={inputClass}
          />
        </div>

        {/* Category */}
        <div>
          <label className={labelClass}>Category</label>
          <select
            value={form.category}
            onChange={(e) => updateField('category', e.target.value as Category)}
            className={selectClass}
          >
            {(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Purpose / Grant Name */}
        <div>
          <label className={labelClass}>Purpose / Grant Name</label>
          <input
            type="text"
            value={form.purpose}
            onChange={(e) => updateField('purpose', e.target.value)}
            placeholder="e.g. Annual operating support"
            className={inputClass}
          />
        </div>

        {/* Amount + Grant Type side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Amount</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => updateField('amount', e.target.value)}
              placeholder="$0"
              required
              min="1"
              step="1"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Grant Type</label>
            <select
              value={form.grantType}
              onChange={(e) => updateField('grantType', e.target.value as GrantType)}
              className={selectClass}
            >
              <option value="annual">Annual</option>
              <option value="multi-year">Multi-Year</option>
            </select>
          </div>
        </div>

        {/* Multi-year fields */}
        {isMultiYear && (
          <div className="bg-purple-light/50 rounded-lg p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Total Years</label>
                <input
                  type="number"
                  value={form.commitmentTotalYears}
                  onChange={(e) => updateField('commitmentTotalYears', e.target.value)}
                  min="2"
                  step="1"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>This is Year #</label>
                <input
                  type="number"
                  value={form.commitmentYear}
                  onChange={(e) => updateField('commitmentYear', e.target.value)}
                  min="1"
                  max={form.commitmentTotalYears}
                  step="1"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="text-[13px] text-purple-dark font-medium">
              Total Pledge: {formatCurrency(totalPledge)}
            </div>
          </div>
        )}

        {/* Payment Date + Status side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Payment Date</label>
            <input
              type="date"
              value={form.paymentDate}
              onChange={(e) => updateField('paymentDate', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select
              value={form.status}
              onChange={(e) => updateField('status', e.target.value as GrantStatus)}
              className={selectClass}
            >
              <option value="considering">Considering</option>
              <option value="committed">Committed</option>
              <option value="paid">Paid</option>
              <option value="acknowledged">Acknowledged</option>
            </select>
          </div>
        </div>

        {/* Acknowledgment checkbox */}
        <label className="flex items-center gap-2 min-h-[44px] cursor-pointer">
          <input
            type="checkbox"
            checked={form.acknowledgmentReceived}
            onChange={(e) => updateField('acknowledgmentReceived', e.target.checked)}
            className="w-5 h-5 rounded border-card-border text-purple focus:ring-purple/30"
          />
          <span className="text-[14px] text-text-dark">Acknowledgment Received</span>
        </label>

        {/* Notes */}
        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={3}
            placeholder="Optional notes..."
            className={`${inputClass} min-h-[80px]`}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-card-border">
          {isEditing ? (
            <div>
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-red-600">Delete this grant?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={saving}
                    className="px-3 py-2 rounded-lg bg-red-600 text-white text-[13px] font-medium hover:bg-red-700 transition-colors min-h-[44px] min-w-[44px]"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-2 rounded-lg text-[13px] text-warm-gray hover:bg-warm-gray-lt transition-colors min-h-[44px] min-w-[44px]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-3 py-2 rounded-lg text-[13px] text-red-600 hover:bg-red-50 transition-colors min-h-[44px] min-w-[44px]"
                >
                  Delete
                </button>
              )}
            </div>
          ) : (
            <div /> /* Spacer when not editing */
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-[14px] font-medium text-warm-gray hover:bg-warm-gray-lt transition-colors min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.granteeName.trim() || amountNum <= 0}
              className="px-5 py-2.5 rounded-lg bg-purple text-white text-[14px] font-medium hover:bg-purple-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {saving ? 'Saving...' : isEditing ? 'Update Grant' : 'Add Grant'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
