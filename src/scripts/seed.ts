/**
 * Seed script — populates Firestore with 2025 historical data.
 * Run via: npx tsx src/scripts/seed.ts
 *
 * WHY: Uses the Firebase client SDK with the project's web config.
 * Requires Firestore rules to temporarily allow unauthenticated writes
 * (the script deploys open rules before seeding, then restores secure rules after).
 */
import { execSync } from 'child_process';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBG6Bj6rx-yMcChrSTnyAqjodnjUae5ppU',
  authDomain: 'era-foundation-9a5aa.firebaseapp.com',
  projectId: 'era-foundation-9a5aa',
  storageBucket: 'era-foundation-9a5aa.firebasestorage.app',
  messagingSenderId: '534306569645',
  appId: '1:534306569645:web:604f9765316d9ea82eb524',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── Seed data ──

const grantees = [
  { name: 'Greater Miami Jewish Federation',         ein: 'TBD', primaryCategory: 'jewish',    tags: ['Miami','Federation','Annual','Major'] },
  { name: 'Ransom Everglades School',                ein: 'TBD', primaryCategory: 'education', tags: ['Miami','K-12','Multi-year','Major'] },
  { name: 'Miami City Ballet',                       ein: 'TBD', primaryCategory: 'arts',      tags: ['Miami','Dance','Multi-year','Arts','Major'] },
  { name: 'Lehrman Community Day School',            ein: 'TBD', primaryCategory: 'jewish',    tags: ['Miami','Jewish Day School','Multi-year'] },
  { name: 'Baptist Health South Florida Foundation', ein: 'TBD', primaryCategory: 'education', tags: ['Miami','Healthcare','Multi-year'] },
  { name: 'Impact Forum Foundation',                 ein: 'TBD', primaryCategory: 'jewish',    tags: ['Leadership','Jewish'] },
  { name: 'The Birthright Israel Foundation',        ein: 'TBD', primaryCategory: 'jewish',    tags: ['Israel','Youth','Jewish'] },
  { name: 'University of Texas at Austin',           ein: 'TBD', primaryCategory: 'education', tags: ['Higher Education','Texas'] },
  { name: 'Aventura Turnberry Jewish Center',        ein: 'TBD', primaryCategory: 'jewish',    tags: ['Miami','Synagogue','Jewish'] },
  { name: 'Mount Sinai Medical Center Foundation',   ein: 'TBD', primaryCategory: 'education', tags: ['Miami','Healthcare'] },
  { name: "Brother's for Life",                      ein: 'TBD', primaryCategory: 'jewish',    tags: ['Jewish','Community'] },
];

const commitments = [
  { granteeName: 'Ransom Everglades School',                category: 'education', totalPledge: 500000, totalYears: 5, annualPayment: 100000, startYear: 2025 },
  { granteeName: 'Miami City Ballet',                       category: 'arts',      totalPledge: 500000, totalYears: 8, annualPayment: 62500,  startYear: 2025 },
  { granteeName: 'Lehrman Community Day School',            category: 'jewish',    totalPledge: 200000, totalYears: 5, annualPayment: 40000,  startYear: 2025 },
  { granteeName: 'Baptist Health South Florida Foundation', category: 'education', totalPledge: 100000, totalYears: 5, annualPayment: 20000,  startYear: 2025 },
];

const grants2025 = [
  { granteeName: 'Greater Miami Jewish Federation',         category: 'jewish',    purpose: 'General Operating Support 2025', amount: 128000, grantType: 'annual',     paymentDate: '2025-12-15', status: 'paid', acknowledgmentReceived: true,  notes: '' },
  { granteeName: 'Ransom Everglades School',                category: 'education', purpose: 'Multi-Year Pledge Year 1 of 5', amount: 100000, grantType: 'multi-year', paymentDate: '2025-12-15', status: 'paid', acknowledgmentReceived: true,  notes: '', commitmentYear: 1, commitmentTotalYears: 5, commitmentTotalPledge: 500000 },
  { granteeName: 'Miami City Ballet',                       category: 'arts',      purpose: 'Multi-Year Pledge Year 1 of 8', amount: 62500,  grantType: 'multi-year', paymentDate: '2025-12-15', status: 'paid', acknowledgmentReceived: true,  notes: '', commitmentYear: 1, commitmentTotalYears: 8, commitmentTotalPledge: 500000 },
  { granteeName: 'Lehrman Community Day School',            category: 'jewish',    purpose: 'Multi-Year Pledge Year 1 of 5', amount: 40000,  grantType: 'multi-year', paymentDate: '2025-12-15', status: 'paid', acknowledgmentReceived: true,  notes: '', commitmentYear: 1, commitmentTotalYears: 5, commitmentTotalPledge: 200000 },
  { granteeName: 'Baptist Health South Florida Foundation', category: 'education', purpose: 'Multi-Year Pledge Year 1 of 5', amount: 20000,  grantType: 'multi-year', paymentDate: '2025-12-04', status: 'paid', acknowledgmentReceived: true,  notes: '', commitmentYear: 1, commitmentTotalYears: 5, commitmentTotalPledge: 100000 },
  { granteeName: 'Impact Forum Foundation',                 category: 'jewish',    purpose: 'General Operating Support 2025', amount: 10000,  grantType: 'annual',     paymentDate: '2025-12-04', status: 'paid', acknowledgmentReceived: true,  notes: '' },
  { granteeName: 'The Birthright Israel Foundation',        category: 'jewish',    purpose: 'General Operating Support 2025', amount: 10000,  grantType: 'annual',     paymentDate: '2025-12-15', status: 'paid', acknowledgmentReceived: true,  notes: '' },
  { granteeName: 'University of Texas at Austin',           category: 'education', purpose: 'General Operating Support 2025', amount: 10000,  grantType: 'annual',     paymentDate: '2025-12-04', status: 'paid', acknowledgmentReceived: true,  notes: '' },
  { granteeName: 'Aventura Turnberry Jewish Center',        category: 'jewish',    purpose: 'General Operating Support 2025', amount: 8419,   grantType: 'annual',     paymentDate: '2025-11-18', status: 'paid', acknowledgmentReceived: true,  notes: '' },
  { granteeName: 'Mount Sinai Medical Center Foundation',   category: 'education', purpose: 'General Operating Support 2025', amount: 2500,   grantType: 'annual',     paymentDate: '2025-12-04', status: 'paid', acknowledgmentReceived: true,  notes: '' },
  { granteeName: "Brother's for Life",                      category: 'jewish',    purpose: 'General Operating Support 2025', amount: 1800,   grantType: 'annual',     paymentDate: '2025-12-10', status: 'paid', acknowledgmentReceived: true,  notes: '' },
];

async function seed() {
  const now = new Date().toISOString();

  // Step 1: Temporarily open Firestore rules for seeding
  console.log('Deploying temporary open rules for seeding...');
  const { writeFileSync, readFileSync } = await import('fs');
  const secureRules = readFileSync('firestore.rules', 'utf-8');
  const openRules = `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}`;
  writeFileSync('firestore.rules', openRules);
  try {
    execSync('firebase deploy --only firestore:rules --force', { stdio: 'pipe' });
  } catch (e) {
    writeFileSync('firestore.rules', secureRules);
    throw new Error('Failed to deploy open rules');
  }

  try {
    // Step 2: Seed grantees
    console.log('Seeding grantees...');
    const granteeIdMap: Record<string, string> = {};
    for (const g of grantees) {
      const ref = doc(collection(db, 'grantees'));
      granteeIdMap[g.name] = ref.id;
      await setDoc(ref, {
        ...g,
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        address: '',
        website: '',
        relationshipNotes: '',
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(`  ${grantees.length} grantees created`);

    // Step 3: Seed commitments
    console.log('Seeding commitments...');
    const commitmentIdMap: Record<string, string> = {};
    for (const c of commitments) {
      const ref = doc(collection(db, 'commitments'));
      commitmentIdMap[c.granteeName] = ref.id;
      await setDoc(ref, {
        ...c,
        granteeId: granteeIdMap[c.granteeName],
        grantIds: {},
        createdAt: now,
      });
    }
    console.log(`  ${commitments.length} commitments created`);

    // Step 4: Seed years
    console.log('Seeding years...');
    await setDoc(doc(db, 'years', '2025'), { fmvEntries: [], budgetTargets: null });
    await setDoc(doc(db, 'years', '2026'), { fmvEntries: [], budgetTargets: null });
    console.log('  Years 2025 and 2026 created');

    // Step 5: Seed 2025 grants
    console.log('Seeding 2025 grants...');
    for (const g of grants2025) {
      const grantRef = doc(collection(db, 'years', '2025', 'grants'));
      const granteeId = granteeIdMap[g.granteeName] || '';

      const grantDoc: Record<string, unknown> = {
        granteeId,
        granteeName: g.granteeName,
        category: g.category,
        purpose: g.purpose,
        amount: g.amount,
        grantType: g.grantType,
        paymentDate: g.paymentDate,
        status: g.status,
        acknowledgmentReceived: g.acknowledgmentReceived,
        notes: g.notes,
        addedBy: 'seed',
        addedByName: 'System Seed',
        createdAt: now,
        updatedAt: now,
      };

      if (g.grantType === 'multi-year') {
        const commitmentId = commitmentIdMap[g.granteeName] || '';
        grantDoc.commitmentId = commitmentId;
        grantDoc.commitmentYear = (g as Record<string, unknown>).commitmentYear;
        grantDoc.commitmentTotalYears = (g as Record<string, unknown>).commitmentTotalYears;
        grantDoc.commitmentTotalPledge = (g as Record<string, unknown>).commitmentTotalPledge;
      }

      await setDoc(grantRef, grantDoc);
    }
    console.log(`  ${grants2025.length} grants created for 2025`);

  } finally {
    // Step 6: Always restore secure rules
    console.log('Restoring secure Firestore rules...');
    writeFileSync('firestore.rules', secureRules);
    execSync('firebase deploy --only firestore:rules --force', { stdio: 'pipe' });
    console.log('  Secure rules restored');
  }

  console.log('\nSeed complete!');
  console.log('  Total: 11 grantees, 4 commitments, 11 grants, 2 years');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message || err);
  process.exit(1);
});
