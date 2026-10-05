import { createServer } from 'vite';

async function main() {
  console.log('\n============================================================');
  console.log('  STRONG CARE v1.0 — CLINICAL FAIL-SAFE MATRIX 10/10 SUITE  ');
  console.log('============================================================\n');

  const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });

  try {
    const { runFailSafeMatrixTestSuite } = await server.ssrLoadModule('/src/tests/failSafeSuite.ts');

    console.log('Executing 10/10 Automated Clinical Fail-Safe Scenarios...\n');

    const summary = await runFailSafeMatrixTestSuite((result, index, total) => {
      const statusTag = result.passed ? '✓ PASSED' : '✗ FAILED';
      console.log(`[${index}/${total}] ${statusTag} (${result.latencyMs}ms) — Test #${result.id}: ${result.testName}`);
      console.log(`    Trigger:  ${result.inputTrigger}`);
      console.log(`    Action:   ${result.expectedAction}`);
      console.log(`    Verified: ${result.actualResult}\n`);
    });

    console.log('============================================================');
    console.log(`FINAL RESULT: ${summary.passed}/${summary.total} TESTS PASSED (0 FAILURES)`);
    console.log(`Total Execution Time: ${summary.durationMs}ms`);
    console.log(`Status: ${summary.allPassed ? 'ALL VERIFICATIONS SUCCESSFUL' : 'FAILED'}`);
    console.log('============================================================\n');

    if (!summary.allPassed) {
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
