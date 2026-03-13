import { useState, useMemo } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { Search, ChevronDown, ChevronUp, Edit2, Globe, Mail, Phone, MapPin, Users } from 'lucide-react';
import { db } from '../firebase';
import { useGrantees } from '../hooks/useGrantees';
import { useCommitments } from '../hooks/useCommitments';
import CategoryBadge from '../components/ui/CategoryBadge';
import Modal from '../components/ui/Modal';
import { CATEGORY_LABELS } from '../types';
import type { Category, Grantee } from '../types';

/** USD formatter — no decimals for whole-dollar grant amounts */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** All category filter options including 'all' */
const FILTER_TABS: { key: Category | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'jewish', label: 'Jewish' },
  { key: 'education', label: 'Education' },
  { key: 'arts', label: 'Arts' },
];

/** Empty form state for the edit modal */
function emptyFormState(): GranteeFormState {
  return {
    name: '',
    ein: '',
    primaryCategory: 'jewish',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    website: '',
    relationshipNotes: '',
    tagsInput: '',
  };
}

interface GranteeFormState {
  name: string;
  ein: string;
  primaryCategory: Category;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  website: string;
  relationshipNotes: string;
  tagsInput: string;
}

export default function Grantees() {
  const { grantees, loading } = useGrantees();
  const { commitments } = useCommitments();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingGrantee, setEditingGrantee] = useState<Grantee | null>(null);
  const [formState, setFormState] = useState<GranteeFormState>(emptyFormState());
  const [saving, setSaving] = useState(false);

  // WHY: Pre-compute commitment lookup so we avoid O(n*m) in the render loop
  const commitmentsByGrantee = useMemo(() => {
    const map = new Map<string, { totalPledge: number; totalYears: number }>();
    for (const c of commitments) {
      const existing = map.get(c.granteeId);
      if (!existing || c.totalPledge > existing.totalPledge) {
        map.set(c.granteeId, { totalPledge: c.totalPledge, totalYears: c.totalYears });
      }
    }
    return map;
  }, [commitments]);

  // WHY: Count grants per grantee from commitments for the "X grants" badge.
  // Commitments track grantIds per year, giving us a count of associated grants.
  const grantCountByGrantee = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of commitments) {
      const grantCount = Object.keys(c.grantIds).length;
      map.set(c.granteeId, (map.get(c.granteeId) || 0) + grantCount);
    }
    return map;
  }, [commitments]);

  // Filter and search
  const filteredGrantees = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return grantees.filter((g) => {
      // Category filter
      if (categoryFilter !== 'all' && g.primaryCategory !== categoryFilter) return false;
      // Search filter — matches name, EIN, or tags
      if (q) {
        const nameMatch = g.name.toLowerCase().includes(q);
        const einMatch = g.ein.toLowerCase().includes(q);
        const tagMatch = g.tags.some((t) => t.toLowerCase().includes(q));
        if (!nameMatch && !einMatch && !tagMatch) return false;
      }
      return true;
    });
  }, [grantees, searchQuery, categoryFilter]);

  function toggleExpanded(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function openEditModal(grantee: Grantee) {
    setEditingGrantee(grantee);
    setFormState({
      name: grantee.name,
      ein: grantee.ein,
      primaryCategory: grantee.primaryCategory,
      contactName: grantee.contactName,
      contactEmail: grantee.contactEmail,
      contactPhone: grantee.contactPhone,
      address: grantee.address,
      website: grantee.website,
      relationshipNotes: grantee.relationshipNotes,
      tagsInput: grantee.tags.join(', '),
    });
    setEditModalOpen(true);
  }

  function closeEditModal() {
    setEditModalOpen(false);
    setEditingGrantee(null);
    setFormState(emptyFormState());
  }

  function updateField<K extends keyof GranteeFormState>(field: K, value: GranteeFormState[K]) {
    setFormState((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!editingGrantee) return;
    setSaving(true);
    try {
      const tags = formState.tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await updateDoc(doc(db, 'grantees', editingGrantee.id), {
        name: formState.name.trim(),
        ein: formState.ein.trim(),
        primaryCategory: formState.primaryCategory,
        contactName: formState.contactName.trim(),
        contactEmail: formState.contactEmail.trim(),
        contactPhone: formState.contactPhone.trim(),
        address: formState.address.trim(),
        website: formState.website.trim(),
        relationshipNotes: formState.relationshipNotes.trim(),
        tags,
        updatedAt: Timestamp.now().toDate().toISOString(),
      });
      closeEditModal();
    } catch (error) {
      console.error('Failed to update grantee:', error);
    } finally {
      setSaving(false);
    }
  }

  /** Ensure website URLs are absolute so they open correctly */
  function normalizeUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `https://${url}`;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-[24px] font-semibold text-purple-dark">Grantee Directory</h1>
        <div className="bg-white rounded-xl border border-card-border p-8 text-center">
          <p className="text-warm-gray">Loading grantees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] font-semibold text-purple-dark">Grantee Directory</h1>
        <span className="text-[14px] text-warm-gray">{filteredGrantees.length} organization{filteredGrantees.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray" />
        <input
          type="text"
          placeholder="Search by name, EIN, or tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 min-h-[44px] rounded-xl border border-card-border bg-white text-[14px] text-text-dark placeholder:text-warm-gray focus:outline-none focus:ring-2 focus:ring-purple/30 focus:border-purple transition-colors"
        />
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setCategoryFilter(tab.key)}
            className={`px-4 py-2 min-h-[44px] min-w-[44px] rounded-lg text-[14px] font-medium transition-colors whitespace-nowrap ${
              categoryFilter === tab.key
                ? 'bg-purple text-white'
                : 'bg-white border border-card-border text-warm-gray hover:bg-warm-gray-lt'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grantee list */}
      {filteredGrantees.length === 0 ? (
        <div className="bg-white rounded-xl border border-card-border p-8 text-center">
          <Users size={32} className="mx-auto mb-3 text-warm-gray" />
          <p className="text-[14px] text-warm-gray">
            {searchQuery || categoryFilter !== 'all'
              ? 'No grantees match your search or filter.'
              : 'No grantees yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGrantees.map((grantee) => {
            const isExpanded = expandedId === grantee.id;
            const commitment = commitmentsByGrantee.get(grantee.id);
            const grantCount = grantCountByGrantee.get(grantee.id) || 0;

            return (
              <div
                key={grantee.id}
                className="bg-white rounded-xl border border-card-border shadow-[0_1px_4px_rgba(150,99,176,0.08)] overflow-hidden"
              >
                {/* Collapsed header — always visible */}
                <button
                  onClick={() => toggleExpanded(grantee.id)}
                  className="w-full flex items-center justify-between px-5 py-4 min-h-[44px] text-left hover:bg-warm-gray-lt/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-[15px] font-medium text-text-dark truncate">{grantee.name}</span>
                    <CategoryBadge category={grantee.primaryCategory} className="shrink-0" />
                    {grantCount > 0 && (
                      <span className="shrink-0 text-[12px] text-warm-gray bg-warm-gray-lt px-2 py-0.5 rounded-full">
                        {grantCount} grant{grantCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {commitment && (
                      <span className="shrink-0 text-[12px] text-purple-dark bg-purple-light px-2 py-0.5 rounded-full font-medium">
                        Active Commitment
                      </span>
                    )}
                  </div>
                  <div className="shrink-0 ml-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
                    {isExpanded ? (
                      <ChevronUp size={18} className="text-warm-gray" />
                    ) : (
                      <ChevronDown size={18} className="text-warm-gray" />
                    )}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-card-border">
                    {/* Action button */}
                    <div className="flex justify-end pt-3 pb-2">
                      <button
                        onClick={() => openEditModal(grantee)}
                        className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] min-w-[44px] rounded-lg text-[13px] font-medium text-purple hover:bg-purple-light transition-colors"
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                      {/* Left column */}
                      <div className="space-y-3">
                        {grantee.ein && (
                          <DetailRow label="EIN / Tax ID" value={grantee.ein} />
                        )}
                        {grantee.contactName && (
                          <DetailRow label="Contact" value={grantee.contactName} />
                        )}
                        {grantee.contactEmail && (
                          <div>
                            <p className="text-[12px] text-warm-gray font-medium uppercase tracking-wide mb-0.5">Email</p>
                            <a
                              href={`mailto:${grantee.contactEmail}`}
                              className="text-[14px] text-purple hover:underline inline-flex items-center gap-1 min-h-[44px]"
                            >
                              <Mail size={14} className="shrink-0" />
                              {grantee.contactEmail}
                            </a>
                          </div>
                        )}
                        {grantee.contactPhone && (
                          <div>
                            <p className="text-[12px] text-warm-gray font-medium uppercase tracking-wide mb-0.5">Phone</p>
                            <a
                              href={`tel:${grantee.contactPhone}`}
                              className="text-[14px] text-purple hover:underline inline-flex items-center gap-1 min-h-[44px]"
                            >
                              <Phone size={14} className="shrink-0" />
                              {grantee.contactPhone}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Right column */}
                      <div className="space-y-3">
                        {grantee.address && (
                          <div>
                            <p className="text-[12px] text-warm-gray font-medium uppercase tracking-wide mb-0.5">Address</p>
                            <p className="text-[14px] text-text-dark inline-flex items-start gap-1">
                              <MapPin size={14} className="shrink-0 mt-0.5" />
                              {grantee.address}
                            </p>
                          </div>
                        )}
                        {grantee.website && (
                          <div>
                            <p className="text-[12px] text-warm-gray font-medium uppercase tracking-wide mb-0.5">Website</p>
                            <a
                              href={normalizeUrl(grantee.website)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[14px] text-purple hover:underline inline-flex items-center gap-1 min-h-[44px]"
                            >
                              <Globe size={14} className="shrink-0" />
                              {grantee.website}
                            </a>
                          </div>
                        )}
                        {commitment && (
                          <div>
                            <p className="text-[12px] text-warm-gray font-medium uppercase tracking-wide mb-0.5">Active Commitment</p>
                            <p className="text-[14px] text-text-dark">
                              {formatCurrency(commitment.totalPledge)} over {commitment.totalYears} year{commitment.totalYears !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Relationship Notes */}
                    {grantee.relationshipNotes && (
                      <div className="mt-4">
                        <p className="text-[12px] text-warm-gray font-medium uppercase tracking-wide mb-1">Relationship Notes</p>
                        <p className="text-[14px] text-text-dark leading-relaxed bg-warm-gray-lt/50 rounded-lg px-3 py-2">
                          {grantee.relationshipNotes}
                        </p>
                      </div>
                    )}

                    {/* Tags */}
                    {grantee.tags.length > 0 && (
                      <div className="mt-4">
                        <p className="text-[12px] text-warm-gray font-medium uppercase tracking-wide mb-1.5">Tags</p>
                        <div className="flex flex-wrap gap-2">
                          {grantee.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2.5 py-1 rounded-full bg-purple-light text-purple-dark text-[12px] font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Giving History placeholder */}
                    <div className="mt-4 pt-3 border-t border-card-border">
                      <p className="text-[12px] text-warm-gray font-medium uppercase tracking-wide mb-1">Giving History</p>
                      {grantCount > 0 ? (
                        <p className="text-[13px] text-warm-gray italic">
                          {grantCount} grant{grantCount !== 1 ? 's' : ''} on record via commitments. Full cross-year history will be populated from the grants collection.
                        </p>
                      ) : (
                        <p className="text-[13px] text-warm-gray italic">
                          No grants on record yet. Grant history will be populated from the grants collection.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Grantee Modal */}
      <Modal open={editModalOpen} onClose={closeEditModal} title="Edit Grantee" maxWidth="max-w-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave();
          }}
          className="space-y-4"
        >
          {/* Organization Name */}
          <FormField label="Organization Name" required>
            <input
              type="text"
              value={formState.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full rounded-lg border border-card-border px-3 py-2.5 text-[14px] text-text-dark focus:outline-none focus:ring-2 focus:ring-purple/30 focus:border-purple min-h-[44px]"
              required
            />
          </FormField>

          {/* EIN */}
          <FormField label="EIN / Tax ID">
            <input
              type="text"
              value={formState.ein}
              onChange={(e) => updateField('ein', e.target.value)}
              placeholder="XX-XXXXXXX"
              className="w-full rounded-lg border border-card-border px-3 py-2.5 text-[14px] text-text-dark focus:outline-none focus:ring-2 focus:ring-purple/30 focus:border-purple min-h-[44px]"
            />
          </FormField>

          {/* Primary Category */}
          <FormField label="Primary Category" required>
            <select
              value={formState.primaryCategory}
              onChange={(e) => updateField('primaryCategory', e.target.value as Category)}
              className="w-full rounded-lg border border-card-border px-3 py-2.5 text-[14px] text-text-dark focus:outline-none focus:ring-2 focus:ring-purple/30 focus:border-purple min-h-[44px] appearance-none bg-white"
              required
            >
              {(['jewish', 'education', 'arts'] as Category[]).map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </FormField>

          {/* Contact Name */}
          <FormField label="Contact Name">
            <input
              type="text"
              value={formState.contactName}
              onChange={(e) => updateField('contactName', e.target.value)}
              className="w-full rounded-lg border border-card-border px-3 py-2.5 text-[14px] text-text-dark focus:outline-none focus:ring-2 focus:ring-purple/30 focus:border-purple min-h-[44px]"
            />
          </FormField>

          {/* Contact Email */}
          <FormField label="Contact Email">
            <input
              type="email"
              value={formState.contactEmail}
              onChange={(e) => updateField('contactEmail', e.target.value)}
              className="w-full rounded-lg border border-card-border px-3 py-2.5 text-[14px] text-text-dark focus:outline-none focus:ring-2 focus:ring-purple/30 focus:border-purple min-h-[44px]"
            />
          </FormField>

          {/* Contact Phone */}
          <FormField label="Contact Phone">
            <input
              type="tel"
              value={formState.contactPhone}
              onChange={(e) => updateField('contactPhone', e.target.value)}
              className="w-full rounded-lg border border-card-border px-3 py-2.5 text-[14px] text-text-dark focus:outline-none focus:ring-2 focus:ring-purple/30 focus:border-purple min-h-[44px]"
            />
          </FormField>

          {/* Mailing Address */}
          <FormField label="Mailing Address">
            <input
              type="text"
              value={formState.address}
              onChange={(e) => updateField('address', e.target.value)}
              className="w-full rounded-lg border border-card-border px-3 py-2.5 text-[14px] text-text-dark focus:outline-none focus:ring-2 focus:ring-purple/30 focus:border-purple min-h-[44px]"
            />
          </FormField>

          {/* Website */}
          <FormField label="Website">
            <input
              type="text"
              value={formState.website}
              onChange={(e) => updateField('website', e.target.value)}
              placeholder="https://example.org"
              className="w-full rounded-lg border border-card-border px-3 py-2.5 text-[14px] text-text-dark focus:outline-none focus:ring-2 focus:ring-purple/30 focus:border-purple min-h-[44px]"
            />
          </FormField>

          {/* Relationship Notes */}
          <FormField label="Relationship Notes">
            <textarea
              value={formState.relationshipNotes}
              onChange={(e) => updateField('relationshipNotes', e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-card-border px-3 py-2.5 text-[14px] text-text-dark focus:outline-none focus:ring-2 focus:ring-purple/30 focus:border-purple min-h-[44px] resize-y"
            />
          </FormField>

          {/* Tags */}
          <FormField label="Tags" hint="Comma-separated (e.g. day school, youth, capital campaign)">
            <input
              type="text"
              value={formState.tagsInput}
              onChange={(e) => updateField('tagsInput', e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="w-full rounded-lg border border-card-border px-3 py-2.5 text-[14px] text-text-dark focus:outline-none focus:ring-2 focus:ring-purple/30 focus:border-purple min-h-[44px]"
            />
          </FormField>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeEditModal}
              className="px-4 py-2 min-h-[44px] min-w-[44px] rounded-lg text-[14px] font-medium text-warm-gray hover:bg-warm-gray-lt transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formState.name.trim()}
              className="px-5 py-2 min-h-[44px] min-w-[44px] rounded-lg text-[14px] font-medium text-white bg-purple hover:bg-purple-dark disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/** Simple detail row for label + text value */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] text-warm-gray font-medium uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-[14px] text-text-dark">{value}</p>
    </div>
  );
}

/** Consistent form field wrapper with label */
function FormField({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-text-dark">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {hint && <span className="block text-[12px] text-warm-gray mt-0.5">{hint}</span>}
      <div className="mt-1">{children}</div>
    </label>
  );
}
