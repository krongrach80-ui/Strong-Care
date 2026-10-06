import { createServer } from 'vite';

async function main() {
  console.log('\n============================================================');
  console.log('  STRONG CARE v1.0 — CLINICAL FAIL-SAFE & ACCURACY SUITE    ');
  console.log('============================================================\n');

  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });

  try {
    // Suite 1: Clinical Fail-Safe Matrix (10/10)
    const { runFailSafeMatrixTestSuite } = await server.ssrLoadModule('/src/tests/failSafeSuite.ts');

    console.log('--- SUITE 1: 10/10 Clinical Fail-Safe Scenarios ---\n');

    const summary = await runFailSafeMatrixTestSuite((result, index, total) => {
      const statusTag = result.passed ? '✓ PASSED' : '✗ FAILED';
      console.log(`[${index}/${total}] ${statusTag} (${result.latencyMs}ms) — Test #${result.id}: ${result.testName}`);
      console.log(`    Trigger:  ${result.inputTrigger}`);
      console.log(`    Action:   ${result.expectedAction}`);
      console.log(`    Verified: ${result.actualResult}\n`);
    });

    // Suite 2: Aspect Ratio & Repetition Automaton Invariance
    const { runBiomechanicalVerificationSuite } = await server.ssrLoadModule('/src/tests/aspectRatioAndRepSuite.ts');

    console.log('\n--- SUITE 2: Aspect-Ratio Invariance & Repetition Automaton Tests ---\n');

    const bioSummary = await runBiomechanicalVerificationSuite();

    for (let i = 0; i < bioSummary.results.length; i++) {
      const r = bioSummary.results[i];
      const tag = r.passed ? '✓ PASSED' : '✗ FAILED';
      console.log(`[${i + 1}/${bioSummary.total}] ${tag} — [${r.category}] ${r.name}`);
      console.log(`    Expected: ${r.expected}`);
      console.log(`    Actual:   ${r.actual}`);
      if (r.details) console.log(`    Note:     ${r.details}`);
      console.log();
    }

    const totalTests = summary.total + bioSummary.total;
    const totalPassed = summary.passed + bioSummary.passed;
    const totalFailed = summary.failed + bioSummary.failed;

    console.log('============================================================');
    console.log(`OVERALL RESULT: ${totalPassed}/${totalTests} TESTS PASSED (${totalFailed} FAILURES)`);
    console.log(`Fail-Safe Suite: ${summary.passed}/${summary.total} | Biomechanics Suite: ${bioSummary.passed}/${bioSummary.total}`);
    console.log(`Status: ${totalFailed === 0 ? 'ALL VERIFICATIONS SUCCESSFUL' : 'FAILED'}`);
    console.log('============================================================\n');

    if (totalFailed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    await server.close();
  }
}

main();
